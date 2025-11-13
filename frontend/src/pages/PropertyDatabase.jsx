import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { propertyService } from '../services/apiService';
import '../styles/pd.css';

export default function PropertyDatabase() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [count, setCount] = useState(0);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / pageSize)), [count, pageSize]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const params = { ...filters, page, page_size: pageSize };
        const data = await propertyService.getProperties(params);
        // DRF pagination: results + count, or bare list when not paginated
        const results = data.results || data || [];
        setProperties(Array.isArray(results) ? results : results.properties || []);
        setCount(data.count ?? (results.length || 0));
        setError(null);
      } catch (e) {
        console.error('Failed to load properties', e);
        setError('Could not load properties');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters, page, pageSize]);

  // Stats like in legacy template
  const stats = useMemo(() => {
    let totalCount = properties.length;
    let publishedCount = 0;
    let draftCount = 0;

    let totalPrice = 0;
    let publishedPrice = 0;
    let draftPrice = 0;

    properties.forEach((p) => {
      const price = Number(p.purchase_price || 0);
      totalPrice += price || 0;

      const status = p.status || 'draft';
      const isApproved = status === 'approved';
      const isPublished = isApproved && ((p.is_active ?? false) || (p.is_pipeline ?? false));
      if (isPublished) {
        publishedCount += 1;
        publishedPrice += price || 0;
      }
      if (status === 'draft') {
        draftCount += 1;
        draftPrice += price || 0;
      }
    });

    const toMillions = (n) => `$${(n / 1_000_000).toFixed(2)}M`;

    return {
      totalCount,
      publishedCount,
      draftCount,
      totalPriceText: toMillions(totalPrice),
      publishedPriceText: toMillions(publishedPrice),
      draftPriceText: toMillions(draftPrice),
    };
  }, [properties]);

  const formatMoney = (n) => {
    const val = Number(n || 0);
    return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  const statusBadge = (p) => {
    const status = p.status || 'draft';
    if (status === 'pending_review') return <span className="pd-badge pd-badge-review">REVIEW</span>;
    if (status === 'denied') return <span className="pd-badge pd-badge-denied">DENIED</span>;
    if (status === 'approved') {
      if (p.is_pipeline) return <span className="pd-badge pd-badge-approved">PUBLISHED/PIPE</span>;
      if (p.is_active) return <span className="pd-badge pd-badge-approved">PUBLISHED/LIVE</span>;
      return <span className="pd-badge pd-badge-approved">APPROVED</span>;
    }
    return <span className="pd-badge pd-badge-draft">DRAFT</span>;
  };

  return (
    <div className="pd-container">
      <div className="pd-page-header-row" style={{ marginBottom: '1rem' }}>
        <h1 className="pd-page-header">Property Dashboard</h1>
        <Link to="/PD/add" className="pd-btn pd-btn-primary">+ Add New Property</Link>
      </div>

      <div className="pd-stats">
        <div className="pd-stat-card">
          <h3>Published Deals</h3>
          <div className="pd-stat-number">{stats.publishedCount} | <span className="pd-green">{stats.publishedPriceText}</span></div>
        </div>
        <div className="pd-stat-card">
          <h3>Draft Deals</h3>
          <div className="pd-stat-number">{stats.draftCount} | <span className="pd-amber">{stats.draftPriceText}</span></div>
        </div>
        <div className="pd-stat-card">
          <h3>Total Properties</h3>
          <div className="pd-stat-number">{stats.totalCount} | <span className="pd-green">{stats.totalPriceText}</span></div>
        </div>
      </div>

      <div className="pd-table-wrap">
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>Loading properties…</div>
        ) : error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#b91c1c' }}>{error}</div>
        ) : properties.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>No properties yet. <Link to="/PD/add">Add your first property</Link></div>
        ) : (
          <table className="pd-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Hero Title</th>
                <th>Status</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => {
                const thumb = p.primary_image || (Array.isArray(p.images) ? p.images[0] : null);
                return (
                  <tr key={p.reference_number}>
                    <td>
                      <div className="pd-prop-cell">
                        {thumb ? (
                          <img src={thumb} alt={p.title || p.property_name || p.reference_number} className="pd-thumb" />
                        ) : (
                          <div className="pd-thumb" />
                        )}
                        <div className="pd-prop-info">
                          <span className="pd-ref">{p.reference_number}</span>
                          <span className="pd-type">{(p.property_type || '').toUpperCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td>{p.title || p.property_name || ''}</td>
                    <td>{statusBadge(p)}</td>
                    <td>{formatMoney(p.purchase_price)}</td>
                    <td>
                      <div className="actions-cell">
                        <Link to={`/PD/${p.reference_number}/edit`} className="pd-btn pd-btn-small pd-btn-primary">Edit/View</Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '.5rem', marginTop: '1rem' }}>
          <button className="pd-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
          <div className="pd-muted" style={{ padding: '.6rem 1rem' }}>Page {page} of {totalPages}</div>
          <button className="pd-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
        </div>
      )}
    </div>
  );
}
