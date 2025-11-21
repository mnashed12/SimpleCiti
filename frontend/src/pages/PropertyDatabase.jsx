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
      setLoading(true);
      setError(null);
      try {
        // Fetch all properties, no filters
        const data = await propertyService.getProperties();
        setProperties(data.results || data || []);
        setCount(data.count || (data.results ? data.results.length : (Array.isArray(data) ? data.length : 0)));
      } catch (err) {
        setError('Failed to load properties.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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

  // Calculate stats from properties
  const stats = useMemo(() => {
    const published = properties.filter(p => p.status === 'approved' && (p.is_active || p.is_pipeline));
    const draft = properties.filter(p => p.status === 'draft' || !p.status);
    
    const publishedPrice = published.reduce((sum, p) => sum + Number(p.purchase_price || 0), 0);
    const draftPrice = draft.reduce((sum, p) => sum + Number(p.purchase_price || 0), 0);
    const totalPrice = properties.reduce((sum, p) => sum + Number(p.purchase_price || 0), 0);
    
    return {
      publishedCount: published.length,
      draftCount: draft.length,
      totalCount: properties.length,
      publishedPriceText: formatMoney(publishedPrice),
      draftPriceText: formatMoney(draftPrice),
      totalPriceText: formatMoney(totalPrice)
    };
  }, [properties]);

  return (
    <div className="pd-container">
      <div className="pd-page-header-row" style={{ marginBottom: '1rem' }}>
        <h1 className="pd-page-header">Property Dashboard</h1>
        <Link to="/SE/PD/add" className="pd-btn pd-btn-primary">+ Add New Property</Link>
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
          <div style={{ padding: '2rem', textAlign: 'center' }}>No properties yet. <Link to="/SE/PD/add">Add your first property</Link></div>
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
              {properties.map((p, index) => {
                const thumb = p.primary_image || (Array.isArray(p.images) ? p.images[0] : null);
                return (
                  <tr key={p.reference_number || p.id || index}>
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
                        {p.reference_number ? (
                          <Link to={`/SE/PD/${p.reference_number}/edit`} className="pd-btn pd-btn-small pd-btn-primary">Edit/View</Link>
                        ) : (
                          <span style={{ color: '#b91c1c', fontSize: '0.9em' }}>No Ref#</span>
                        )}
                        <button
                          className="pd-btn pd-btn-small pd-btn-danger"
                          style={{ marginLeft: 8 }}
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
                              try {
                                await propertyService.deleteProperty(p.reference_number);
                                setProperties((props) => props.filter((prop) => prop.reference_number !== p.reference_number));
                              } catch (err) {
                                alert('Failed to delete property.');
                              }
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}