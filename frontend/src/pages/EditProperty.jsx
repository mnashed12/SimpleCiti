import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { propertyService } from '../services/apiService';
import '../styles/pd.css';

export default function EditProperty() {
  const { referenceNumber } = useParams();
  const [property, setProperty] = useState(null);
  const [form, setForm] = useState({});
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await propertyService.getPropertyDetail(referenceNumber);
        setProperty(data);
        // Seed form with many fields to support UI parity
        setForm({
          // summary
          marketing_title: data.marketing_title || data.title || '',
          title: data.title || data.property_name || '',
          property_type: data.property_type || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          submarket: data.submarket || '',
          total_sf: data.total_sf || '',
          acres: data.acres || '',
          location_highlights: data.location_highlights || '',

          loi_date: data.loi_date || '',
          psa_date: data.psa_date || '',
          dd_end_date: data.dd_end_date || '',
          close_date: data.close_date || '',

          purchase_price: data.purchase_price ?? data.price ?? '',
          ltv: data.ltv || '',
          debt_amount: data.debt_amount || '',
          total_equity: data.total_equity || '',
          cap_rate: data.cap_rate ?? '',
          current_noi: data.current_noi || '',
          projected_irr: data.projected_irr || '',

          kbi_1: data.kbi_1 || '',
          kbi_2: data.kbi_2 || '',
          kbi_3: data.kbi_3 || '',
          kbi_4: data.kbi_4 || '',
          business_plan: data.business_plan || '',
          hero_summary: data.hero_summary || '',

          est_annual_cash_flow: data.est_annual_cash_flow || '',
          per_100k: data.per_100k || '',
          est_cash_on_cash: data.est_cash_on_cash || '',
          distribution_frequency: data.distribution_frequency || 'Quarterly',

          num_tenants: data.num_tenants || '',
          occupancy_percent: data.occupancy_percent || '',
          walt: data.walt || '',
          tenant_1_name: data.tenant_1_name || '', tenant_1_sf: data.tenant_1_sf || '', tenant_1_percent: data.tenant_1_percent || '', tenant_1_expiry: data.tenant_1_expiry || '', tenant_1_lease_structure: data.tenant_1_lease_structure || '', tenant_1_guarantee: data.tenant_1_guarantee || '',
          tenant_2_name: data.tenant_2_name || '', tenant_2_sf: data.tenant_2_sf || '', tenant_2_percent: data.tenant_2_percent || '', tenant_2_expiry: data.tenant_2_expiry || '', tenant_2_lease_structure: data.tenant_2_lease_structure || '', tenant_2_guarantee: data.tenant_2_guarantee || '',
          tenant_3_name: data.tenant_3_name || '', tenant_3_sf: data.tenant_3_sf || '', tenant_3_percent: data.tenant_3_percent || '', tenant_3_expiry: data.tenant_3_expiry || '', tenant_3_lease_structure: data.tenant_3_lease_structure || '', tenant_3_guarantee: data.tenant_3_guarantee || '',

          broker_name: data.broker_name || '', broker_company: data.broker_company || '', broker_cell: data.broker_cell || '', broker_email: data.broker_email || '', commission: data.commission || '',
        });
        setError(null);
      } catch (e) {
        console.error('Failed to load property', e);
        setError('Property not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [referenceNumber]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        address: form.address,
        city: form.city,
        state: form.state,
        zip_code: form.zip_code,
        property_type: form.property_type,
        purchase_price: form.purchase_price === '' ? undefined : Number(String(form.purchase_price).replace(/[$,]/g, '')),
        cap_rate: form.cap_rate === '' ? undefined : Number(String(form.cap_rate).replace(/[%,]/g, '')),
        close_date: form.close_date || undefined,
        marketing_title: form.marketing_title,
        business_plan: form.business_plan,
        hero_summary: form.hero_summary,
      };
      await propertyService.updateProperty(referenceNumber, payload);
      navigate('/PD');
    } catch (e) {
      console.error('Update failed', e);
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="pd-container" style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>;
  }
  if (error) {
    return (
      <div className="pd-container" style={{ padding: '2rem', textAlign: 'center', color: '#b91c1c' }}>{error}</div>
    );
  }

  return (
    <div className="pd-container wide">
      {/* Header Row */}
      <div className="pd-header-row" style={{ paddingTop: '1rem' }}>
        <div className="pd-ref-title">
          <h1>
            <span className="pd-ref-number">REF #{referenceNumber}</span> -{' '}
            <span id="marketingTitleDisplay">{form.marketing_title || 'Not Set'}</span>
          </h1>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '.5rem' }}>Editing existing property</div>
        </div>
        <div className="pd-timeline">
          <div className="pd-timeline-box pd-tl-draft">
            <div className="pd-tl-title">{(property?.status || 'draft') === 'draft' ? 'Draft' : (property?.status === 'pending_review' ? 'Pending Review' : 'Approved')} - {property?.completion_percentage ?? 0}%</div>
            <div>{property?.submitted_by_name ? `${property.submitted_by_name} - ${property.submitted_date || ''}` : ''}</div>
          </div>
          <div className="pd-timeline-box pd-tl-published">
            <div className="pd-tl-title">Published</div>
            <div>{property?.status === 'approved' ? (property?.is_pipeline ? 'Pipeline' : (property?.is_active ? 'Live' : '')) : 'Awaiting'}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="pd-tabs" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button type="button" className={`pd-tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>Summary</button>
          <button type="button" className={`pd-tab ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Details</button>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', marginLeft: '50px', alignItems: 'center' }}>
          <select className="pd-select" value={form.asset_class || ''} onChange={(e) => setForm((f) => ({ ...f, asset_class: e.target.value }))}>
            <option value="">Asset Class...</option>
            <option value="SB">SB - Small Bay/Flex - 1000</option>
            <option value="IN">IN - Industrial - 2000</option>
            <option value="MF">MF - Multi-Family - 3000</option>
            <option value="OF">OF - Office - 4000</option>
            <option value="RT">RT - Retail - 5000</option>
            <option value="HT">HT - Hotel - 6000</option>
            <option value="MA">MA - Marina - 7000</option>
            <option value="SS">SS - Self Storage - 8000</option>
            <option value="MS">MS - Misc. - 9000</option>
          </select>
          <select className="pd-select" value={form.deal_stage || ''} onChange={(e) => setForm((f) => ({ ...f, deal_stage: e.target.value }))}>
            <option>Deal Status...</option>
            <option>LOI Out</option>
            <option>Under LOI</option>
            <option>Under Due Diligence</option>
            <option>Hard Deposit</option>
            <option>Closing Scheduled</option>
            <option>CLOSED</option>
          </select>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        {/* SUMMARY TAB */}
        <div className={`pd-tab-panel ${activeTab === 'summary' ? 'active' : ''}`} id="summary">
          {/* Key Dates */}
          <div className="form-section">
            <div className="form-row" style={{ display: 'flex', gap: '2rem' }}>
              <h1 className="detail-header">Key Dates</h1>
              <div className="form-group">
                <label>LOI Date</label>
                <div className="date-input-wrapper"><input className="pd-input" type="date" name="loi_date" value={form.loi_date || ''} onChange={(e) => setForm((f) => ({ ...f, loi_date: e.target.value }))} /></div>
              </div>
              <div className="form-group">
                <label>PSA Date</label>
                <div className="date-input-wrapper"><input className="pd-input" type="date" name="psa_date" value={form.psa_date || ''} onChange={(e) => setForm((f) => ({ ...f, psa_date: e.target.value }))} /></div>
              </div>
              <div className="form-group">
                <label>DD End</label>
                <div className="date-input-wrapper"><input className="pd-input" type="date" name="dd_end_date" value={form.dd_end_date || ''} onChange={(e) => setForm((f) => ({ ...f, dd_end_date: e.target.value }))} /></div>
              </div>
              <div className="form-group">
                <label>Closing Date</label>
                <div className="date-input-wrapper"><input className="pd-input" type="date" name="close_date" value={form.close_date || ''} onChange={(e) => setForm((f) => ({ ...f, close_date: e.target.value }))} /></div>
              </div>
            </div>
          </div>

          {/* Property */}
          <h1 className="detail-header" style={{ paddingTop: '.5rem' }}>Property</h1>
          <div className="form-row" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ minWidth: 300, flex: 1 }}>
              <label>Address</label>
              <input className="pd-input" name="address" value={form.address || ''} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="form-group"><label>City</label><input className="pd-input" name="city" value={form.city || ''} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} /></div>
            <div className="form-group"><label>State</label><input className="pd-input" name="state" maxLength={2} value={form.state || ''} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} /></div>
            <div className="form-group"><label>ZIP</label><input className="pd-input" name="zip_code" value={form.zip_code || ''} onChange={(e) => setForm((f) => ({ ...f, zip_code: e.target.value }))} /></div>
            <div className="form-group"><label>SF</label><input className="pd-input" name="total_sf" value={form.total_sf || ''} onChange={(e) => setForm((f) => ({ ...f, total_sf: e.target.value }))} /></div>
            <div className="form-group"><label>Acres</label><input className="pd-input" name="acres" value={form.acres || ''} onChange={(e) => setForm((f) => ({ ...f, acres: e.target.value }))} /></div>
            <div className="form-group"><label>Submarket</label><input className="pd-input" name="submarket" value={form.submarket || ''} readOnly /></div>
            <div className="form-group" style={{ flex: 1, minWidth: 300 }}><label style={{ alignSelf: 'flex-start', marginTop: '.5rem' }}>Location Highlights</label><input className="pd-input" name="location_highlights" value={form.location_highlights || ''} onChange={(e) => setForm((f) => ({ ...f, location_highlights: e.target.value }))} /></div>
          </div>

          {/* Financials */}
          <h1 className="detail-header">Financials</h1>
          <div className="form-section">
            <div className="form-row" style={{ gridTemplateColumns: '0.7fr 0.5fr 0.7fr 0.7fr 0.6fr 0.5fr 0.5fr' }}>
              <div className="form-group"><label>Acquisition Price</label><input className="pd-input" name="purchase_price" value={form.purchase_price ?? ''} onChange={(e) => setForm((f)=>({ ...f, purchase_price: e.target.value }))} /></div>
              <div className="form-group"><label>LTV %</label><input className="pd-input" name="ltv" value={form.ltv ?? ''} onChange={(e) => setForm((f)=>({ ...f, ltv: e.target.value }))} /></div>
              <div className="form-group"><label>Debt</label><input className="pd-input" name="debt_amount" value={form.debt_amount ?? ''} readOnly /></div>
              <div className="form-group"><label>Equity</label><input className="pd-input" name="total_equity" value={form.total_equity ?? ''} readOnly /></div>
              <div className="form-group"><label>Cap Rate</label><input className="pd-input" name="cap_rate" value={form.cap_rate ?? ''} readOnly /></div>
              <div className="form-group"><label>NOI</label><input className="pd-input" name="current_noi" value={form.current_noi ?? ''} onChange={(e) => setForm((f)=>({ ...f, current_noi: e.target.value }))} /></div>
              <div className="form-group"><label>IRR (5yr)</label><input className="pd-input" name="projected_irr" value={form.projected_irr ?? ''} onChange={(e) => setForm((f)=>({ ...f, projected_irr: e.target.value }))} /></div>
            </div>
          </div>

          {/* KBIs */}
          <div className="form-section">
            <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {['kbi_1','kbi_2','kbi_3','kbi_4'].map((k, idx) => (
                <div className="form-group" key={k}>
                  <label>Key Business Initiative #{idx+1}</label>
                  <select className="pd-select" name={k} value={form[k] || ''} onChange={(e) => setForm((f)=>({ ...f, [k]: e.target.value }))}>
                    <option value="">Select...</option>
                    <optgroup label="FINANCIAL">
                      <option>Lease-Up Vacant Space</option>
                      <option>Raise Rents to Market</option>
                      <option>Convert to NNN Leases</option>
                      <option>Extend and Improve Leases</option>
                      <option>Monetize Excess Land</option>
                      <option>Refinance to Unlock Equity</option>
                    </optgroup>
                    <optgroup label="OPERATIONAL">
                      <option>Drive Operating Efficiencies</option>
                      <option>Strengthen Tenant Mix</option>
                      <option>Optimize Expense Recovery</option>
                      <option>Upgrade Tenant Quality</option>
                      <option>Streamline Management Systems</option>
                      <option>Improve Collections and Controls</option>
                    </optgroup>
                    <optgroup label="PROPERTY">
                      <option>Modernize and Rebrand Property</option>
                      <option>Upgrade Roof and Pavement</option>
                      <option>Improve Site Access and Parking</option>
                      <option>Add Tenant Amenities</option>
                      <option>Enhance Curb Appeal</option>
                      <option>Upgrade Building Systems</option>
                    </optgroup>
                  </select>
                </div>
              ))}
            </div>
            <div className="form-row" style={{ gridTemplateColumns: '3fr 1fr', marginTop: '.3rem' }}>
              <div className="form-group"><label style={{ alignSelf: 'flex-start', marginTop: '.3rem' }}>Business Plan</label><textarea className="pd-textarea" name="business_plan" value={form.business_plan || ''} onChange={(e) => setForm((f)=>({ ...f, business_plan: e.target.value }))} /></div>
              <div className="form-group"><label>Marketing Title</label><input className="pd-input" name="marketing_title" value={form.marketing_title || ''} onChange={(e) => setForm((f)=>({ ...f, marketing_title: e.target.value, title: e.target.value }))} placeholder="3-6 words" /></div>
            </div>
          </div>
        </div>

        {/* DETAILS TAB */}
        <div className={`pd-tab-panel ${activeTab === 'details' ? 'active' : ''}`} id="details">
          <h1 className="detail-header">Annual Cash Flow</h1>
          <div className="form-section">
            <div className="form-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr' }}>
              <div className="form-group"><label>Coupon</label><input className="pd-input" name="est_annual_cash_flow" value={form.est_annual_cash_flow || ''} onChange={(e) => setForm((f)=>({ ...f, est_annual_cash_flow: e.target.value }))} /></div>
              <div className="form-group"><label>Per $100k Equity Investment</label><input className="pd-input" name="per_100k" value={form.per_100k || ''} readOnly /></div>
              <div className="form-group"><label>Cash on Cash</label><input className="pd-input" name="est_cash_on_cash" value={form.est_cash_on_cash || ''} readOnly /></div>
              <div className="form-group"><label>Distribution Frequency</label>
                <select className="pd-select" name="distribution_frequency" value={form.distribution_frequency || ''} onChange={(e) => setForm((f)=>({ ...f, distribution_frequency: e.target.value }))}>
                  <option value="">Select...</option>
                  <option>Monthly</option>
                  <option>Quarterly</option>
                  <option>Semi-Annually</option>
                  <option>Annually</option>
                  <option>At Exit</option>
                </select>
              </div>
            </div>
          </div>

          <h1 className="detail-header">Tenancy</h1>
          <div className="form-section">
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr 1.5fr' }}>
              <div className="form-group"><label># of Tenants</label><input className="pd-input" name="num_tenants" value={form.num_tenants || ''} onChange={(e) => setForm((f)=>({ ...f, num_tenants: e.target.value }))} /></div>
              <div className="form-group"><label>Occupancy %</label><input className="pd-input" name="occupancy_percent" value={form.occupancy_percent || ''} onChange={(e) => setForm((f)=>({ ...f, occupancy_percent: e.target.value }))} /></div>
              <div className="form-group"><label>WALT (years)</label><input className="pd-input" name="walt" value={form.walt || ''} onChange={(e) => setForm((f)=>({ ...f, walt: e.target.value }))} /></div>
            </div>
          </div>

          {[1,2,3].map((n) => (
            <div className="form-section" key={n}>
              <div className="form-row" style={{ gridTemplateColumns: '1fr .5fr .5fr .5fr 1fr 1fr' }}>
                <div className="form-group"><label>Top Tenant {n}</label><input className="pd-input" name={`tenant_${n}_name`} value={form[`tenant_${n}_name`] || ''} onChange={(e) => setForm((f)=>({ ...f, [`tenant_${n}_name`]: e.target.value }))} /></div>
                <div className="form-group"><label>SF Leased</label><input className="pd-input" name={`tenant_${n}_sf`} value={form[`tenant_${n}_sf`] || ''} onChange={(e) => setForm((f)=>({ ...f, [`tenant_${n}_sf`]: e.target.value }))} /></div>
                <div className="form-group"><label>% of NRA</label><input className="pd-input" name={`tenant_${n}_percent`} value={form[`tenant_${n}_percent`] || ''} readOnly /></div>
                <div className="form-group"><label>Lease Expiry Date</label><input className="pd-input" type="date" name={`tenant_${n}_expiry`} value={form[`tenant_${n}_expiry`] || ''} onChange={(e) => setForm((f)=>({ ...f, [`tenant_${n}_expiry`]: e.target.value }))} /></div>
                <div className="form-group"><label>Lease Structure</label>
                  <select className="pd-select" name={`tenant_${n}_lease_structure`} value={form[`tenant_${n}_lease_structure`] || ''} onChange={(e) => setForm((f)=>({ ...f, [`tenant_${n}_lease_structure`]: e.target.value }))}>
                    <option value="">Select...</option>
                    <option>Gross</option>
                    <option>Modified Gross</option>
                    <option>NN</option>
                    <option>NNN</option>
                    <option>Mixed</option>
                  </select>
                </div>
                <div className="form-group"><label>Corp/Personal Guar</label>
                  <select className="pd-select" name={`tenant_${n}_guarantee`} value={form[`tenant_${n}_guarantee`] || ''} onChange={(e) => setForm((f)=>({ ...f, [`tenant_${n}_guarantee`]: e.target.value }))}>
                    <option value="">Select...</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          {/* Broker */}
          <h1 className="detail-header">Broker</h1>
          <div className="form-section">
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1.2fr 0.7fr 1.2fr .5fr' }}>
              <div className="form-group"><label>Broker Name</label><input className="pd-input" name="broker_name" value={form.broker_name || ''} onChange={(e) => setForm((f)=>({ ...f, broker_name: e.target.value }))} /></div>
              <div className="form-group"><label>Company Name</label><input className="pd-input" name="broker_company" value={form.broker_company || ''} onChange={(e) => setForm((f)=>({ ...f, broker_company: e.target.value }))} /></div>
              <div className="form-group"><label>Broker Cell</label><input className="pd-input" name="broker_cell" value={form.broker_cell || ''} onChange={(e) => setForm((f)=>({ ...f, broker_cell: e.target.value }))} /></div>
              <div className="form-group"><label>Broker Email</label><input className="pd-input" type="email" name="broker_email" value={form.broker_email || ''} onChange={(e) => setForm((f)=>({ ...f, broker_email: e.target.value }))} /></div>
              <div className="form-group"><label>Commission %</label><input className="pd-input" name="commission" value={form.commission || ''} onChange={(e) => setForm((f)=>({ ...f, commission: e.target.value }))} /></div>
            </div>
          </div>
        </div>

        <div className="pd-actions">
          <button disabled={saving} className="pd-btn-submit" type="submit">{saving ? 'Saving…' : 'Save Changes (Keep as Draft)'}</button>
          <button type="button" onClick={() => navigate('/PD')} className="pd-btn pd-btn-small" style={{ marginLeft: '.5rem' }}>Cancel</button>
        </div>
        {error && <div style={{ color: '#b91c1c', marginTop: '.75rem', textAlign: 'center' }}>{error}</div>}
      </form>
    </div>
  );
}
