import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { propertyService } from '../services/apiService';
import '../styles/pd.css';

const defaultState = {
  // Summary basics
  property_type: '',
  title: '',
  marketing_title: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  submarket: '',
  total_sf: '',
  acres: '',
  location_highlights: '',

  // Dates
  loi_date: '',
  psa_date: '',
  dd_end_date: '',
  close_date: '',

  // Financials
  purchase_price: '',
  ltv: '',
  debt_amount: '',
  total_equity: '',
  cap_rate: '',
  current_noi: '',
  projected_irr: '',

  // KBIs and plan
  kbi_1: '',
  kbi_2: '',
  kbi_3: '',
  kbi_4: '',
  business_plan: '',
  hero_summary: '',

  // Details
  est_annual_cash_flow: '',
  per_100k: '',
  est_cash_on_cash: '',
  distribution_frequency: 'Quarterly',

  // Tenancy
  num_tenants: '',
  occupancy_percent: '',
  walt: '',
  tenant_1_name: '', tenant_1_sf: '', tenant_1_percent: '', tenant_1_expiry: '', tenant_1_lease_structure: '', tenant_1_guarantee: '',
  tenant_2_name: '', tenant_2_sf: '', tenant_2_percent: '', tenant_2_expiry: '', tenant_2_lease_structure: '', tenant_2_guarantee: '',
  tenant_3_name: '', tenant_3_sf: '', tenant_3_percent: '', tenant_3_expiry: '', tenant_3_lease_structure: '', tenant_3_guarantee: '',

  // Broker
  broker_name: '', broker_company: '', broker_cell: '', broker_email: '', commission: '',
};

export default function AddProperty() {
  const [form, setForm] = useState(defaultState);
  const [activeTab, setActiveTab] = useState('summary');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [docStorage, setDocStorage] = useState({ om: [], rentroll: [], proforma: [], tic: [], environmental: [], legal: [], operating: [], market: [], brochure: [], other: [] });
  const navigate = useNavigate();

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  // Derived: submarket when city/state present
  const submarket = useMemo(() => {
    if (form.city && form.state) return `${form.city}, ${form.state}`;
    return form.submarket;
  }, [form.city, form.state, form.submarket]);

  // Calculations similar to template
  const recalcFinancials = () => {
    const price = parseFloat(String(form.purchase_price).replace(/[$,]/g, '')) || 0;
    const ltv = parseFloat(String(form.ltv).replace(/[%,]/g, '')) || 0;
    const noi = parseFloat(String(form.current_noi).replace(/[$,]/g, '')) || 0;
    const debt = price * (ltv / 100);
    const equity = Math.max(0, price - debt);
    const cap = price > 0 ? (noi / price) * 100 : 0;
    setForm((f) => ({
      ...f,
      debt_amount: debt ? `$${Math.round(debt).toLocaleString()}` : '',
      total_equity: price ? `$${Math.round(equity).toLocaleString()}` : '',
      cap_rate: cap ? `${cap.toFixed(2)}%` : '',
    }));
  };

  const recalcCashOnCash = () => {
    const annual = parseFloat(String(form.est_annual_cash_flow).replace(/[$,]/g, '')) || 0;
    const equity = parseFloat(String(form.total_equity).replace(/[$,]/g, '')) || 0;
    if (annual && equity) {
      const coc = (annual / equity) * 100;
      const per100k = (coc / 100) * 100000;
      setForm((f) => ({ ...f, est_cash_on_cash: `${coc.toFixed(2)}%`, per_100k: `$${Math.round(per100k).toLocaleString()}` }));
    } else {
      setForm((f) => ({ ...f, est_cash_on_cash: '', per_100k: '' }));
    }
  };

  const addDaysTo = (fromKey, toKey, days) => {
    const fromVal = form[fromKey];
    if (!fromVal) return;
    const d = new Date(fromVal);
    if (isNaN(d.getTime())) return;
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setField(toKey, `${yyyy}-${mm}-${dd}`);
  };

  const updateMarketingTitleDisplay = (val) => {
    setField('marketing_title', val);
    setField('title', val);
  };

  const handleUploadDoc = (type, file) => {
    setDocStorage((old) => ({ ...old, [type]: [...(old[type] || []), file] }));
  };

  const onDocBoxClick = (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) handleUploadDoc(type, file);
    };
    input.click();
  };

  const createProperty = async () => {
    // Minimal payload for backend create; UI collects more but not all are required server-side
    const payload = {
      title: form.title,
      property_type: form.property_type,
      address: form.address,
      city: form.city,
      state: form.state,
      zip_code: form.zip_code,
      purchase_price: form.purchase_price ? Number(String(form.purchase_price).replace(/[$,]/g, '')) : undefined,
      cap_rate: form.cap_rate ? Number(String(form.cap_rate).replace(/[%,]/g, '')) : undefined,
      close_date: form.close_date || undefined,
    };
    const created = await propertyService.createProperty(payload);
    return created.reference_number || created.referenceNumber;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const ref = await createProperty();
      if (ref) {
        navigate(`/SE/PD/${ref}/edit`);
      } else {
        navigate('/SE/PD');
      }
    } catch (err) {
      console.error('Create failed', err);
      setError('Failed to create property. Please review required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const onPublish = async () => {
    // For parity: create then route to Edit screen where publish can occur
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const ref = await createProperty();
      if (ref) {
        navigate(`/SE/PD/${ref}/edit?publishIntent=1`);
      } else {
        navigate('/SE/PD');
      }
    } catch (err) {
      console.error('Create+Publish path failed', err);
      setError('Failed to create property for publishing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pd-container wide">
      <div className="pd-header-row" style={{ paddingTop: '1rem' }}>
        <div className="pd-ref-title">
          <h1>
            <span className="pd-ref-number">NEW PROPERTY</span> -{' '}
            <span id="marketingTitleDisplay">{form.marketing_title || 'Not Set'}</span>
          </h1>
        </div>
        <div className="pd-timeline">
          <div className="pd-timeline-box pd-tl-draft">
            <div className="pd-tl-title">Draft - 0%</div>
            <div>In Progress</div>
          </div>
          <div className="pd-timeline-box pd-tl-published">
            <div className="pd-tl-title">Published</div>
            <div>Awaiting</div>
          </div>
        </div>
      </div>

      <div className="pd-tabs" style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button type="button" className={`pd-tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>Summary</button>
          <button type="button" className={`pd-tab ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Details</button>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', marginLeft: '50px', alignItems: 'center' }}>
          <select className="pd-select" value={form.asset_class || ''} onChange={(e) => setField('asset_class', e.target.value)}>
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
          <select className="pd-select" value={form.deal_stage || ''} onChange={(e) => setField('deal_stage', e.target.value)}>
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
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>
            Only Visible to Clients with Down Payment
          </div>

          {/* Docs Grid */}
          <div className="pd-doc-grid">
            {['om','rentroll','proforma','tic','environmental'].map((t) => (
              <div key={t} className="pd-doc-box" onClick={() => onDocBoxClick(t)}>
                <strong style={{ display: 'block', marginBottom: '.25rem' }}>{{
                  om: 'Offering Memorandum', rentroll: 'Rent Roll', proforma: 'Pro Forma', tic: 'TIC Agreement', environmental: 'Environmental Report'
                }[t]}</strong>
                <div>Drag & drop or click</div>
                {(docStorage[t] || []).length > 0 && (
                  <div style={{ marginTop: '.5rem', fontSize: '10px' }}>{(docStorage[t] || []).length} file(s) selected</div>
                )}
              </div>
            ))}
          </div>
          <div className="pd-doc-grid">
            {['legal','operating','market','brochure','other'].map((t) => (
              <div key={t} className="pd-doc-box" onClick={() => onDocBoxClick(t)}>
                <strong style={{ display: 'block', marginBottom: '.25rem' }}>{{
                  legal: 'Legal Opinion', operating: 'Operating Statements', market: 'Market Research', brochure: 'Marketing Brochure', other: 'Other'
                }[t]}</strong>
                <div>Drag & drop or click</div>
                {(docStorage[t] || []).length > 0 && (
                  <div style={{ marginTop: '.5rem', fontSize: '10px' }}>{(docStorage[t] || []).length} file(s) selected</div>
                )}
              </div>
            ))}
          </div>

          {/* Key Dates */}
          <div className="pd-form-section form-section">
            <div className="pd-form-row form-row" style={{ display: 'flex', gap: '2rem' }}>
              <h1 className="detail-header">Key Dates</h1>
              <div className="pd-form-group form-group">
                <label>LOI Date</label>
                <div className="date-input-wrapper">
                  <input className="pd-input" type="date" name="loi_date" value={form.loi_date} onChange={onChange} />
                </div>
              </div>
              <div className="pd-form-group form-group">
                <label>PSA Date</label>
                <div className="date-input-wrapper">
                  <input className="pd-input" type="date" name="psa_date" value={form.psa_date} onChange={onChange} />
                  <div className="date-buttons">
                    {[5,10,20,30,45].map((d) => (
                      <button key={d} type="button" onClick={() => addDaysTo('loi_date','psa_date', d)}>+{d}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pd-form-group form-group">
                <label>DD End</label>
                <div className="date-input-wrapper">
                  <input className="pd-input" type="date" name="dd_end_date" value={form.dd_end_date} onChange={onChange} />
                  <div className="date-buttons">
                    {[20,30,45,60,90].map((d) => (
                      <button key={d} type="button" onClick={() => addDaysTo('psa_date','dd_end_date', d)}>+{d}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="pd-form-group form-group">
                <label>Closing Date</label>
                <div className="date-input-wrapper">
                  <input className="pd-input" type="date" name="close_date" value={form.close_date} onChange={onChange} />
                  <div className="date-buttons">
                    {[10,20,30,45].map((d) => (
                      <button key={d} type="button" onClick={() => addDaysTo('dd_end_date','close_date', d)}>+{d}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Property */}
          <h1 className="detail-header" style={{ paddingTop: '.5rem' }}>Property</h1>
          <div className="pd-form-row form-row" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div className="pd-form-group form-group" style={{ minWidth: 300, flex: 1 }}>
              <label>Address</label>
              <input className="pd-input" name="address" value={form.address} onChange={onChange} placeholder="900 Stewart Avenue" />
            </div>
            <div className="pd-form-group form-group">
              <label>City</label>
              <input className="pd-input" name="city" value={form.city} onChange={onChange} placeholder="Garden City" />
            </div>
            <div className="pd-form-group form-group">
              <label>State</label>
              <input className="pd-input" name="state" value={form.state} onChange={onChange} maxLength={2} style={{ textTransform: 'uppercase' }} />
            </div>
            <div className="pd-form-group form-group">
              <label>ZIP</label>
              <input className="pd-input" name="zip_code" value={form.zip_code} onChange={onChange} placeholder="11530" />
            </div>
            <div className="pd-form-group form-group">
              <label>SF</label>
              <input className="pd-input" name="total_sf" value={form.total_sf} onChange={onChange} placeholder="75,000" />
            </div>
            <div className="pd-form-group form-group">
              <label>Acres</label>
              <input className="pd-input" name="acres" value={form.acres} onChange={onChange} placeholder="4.5" />
            </div>
            <div className="pd-form-group form-group">
              <label>Submarket</label>
              <input className="pd-input" name="submarket" value={submarket} readOnly placeholder="Auto-filled" />
            </div>
            <div className="pd-form-group form-group" style={{ flex: 1, minWidth: 300 }}>
              <label style={{ alignSelf: 'flex-start', marginTop: '.5rem' }}>Location Highlights</label>
              <input className="pd-input" name="location_highlights" value={form.location_highlights} onChange={onChange} placeholder="Near major highways, airport access..." />
            </div>
          </div>

          {/* Financials */}
          <h1 className="detail-header">Financials</h1>
          <div className="form-section">
            <div className="form-row" style={{ gridTemplateColumns: '0.7fr 0.5fr 0.7fr 0.7fr 0.6fr 0.5fr 0.5fr' }}>
              <div className="form-group">
                <label>Acquisition Price</label>
                <input className="pd-input" name="purchase_price" value={form.purchase_price} onChange={(e) => { onChange(e); }} onBlur={recalcFinancials} placeholder="$5,000,000" />
              </div>
              <div className="form-group">
                <label>LTV %</label>
                <input className="pd-input" name="ltv" value={form.ltv} onChange={(e) => { onChange(e); }} onBlur={recalcFinancials} placeholder="65%" />
              </div>
              <div className="form-group">
                <label>Debt</label>
                <input className="pd-input" name="debt_amount" value={form.debt_amount} readOnly placeholder="Auto-calc" />
              </div>
              <div className="form-group">
                <label>Equity</label>
                <input className="pd-input" name="total_equity" value={form.total_equity} readOnly placeholder="Auto-calc" />
              </div>
              <div className="form-group">
                <label>Cap Rate</label>
                <input className="pd-input" name="cap_rate" value={form.cap_rate} readOnly placeholder="Auto-calc" />
              </div>
              <div className="form-group">
                <label>NOI</label>
                <input className="pd-input" name="current_noi" value={form.current_noi} onChange={(e) => { onChange(e); }} onBlur={recalcFinancials} placeholder="$550,000" />
              </div>
              <div className="form-group">
                <label>IRR (5yr)</label>
                <input className="pd-input" name="projected_irr" value={form.projected_irr} onChange={onChange} placeholder="18.5%" />
              </div>
            </div>
          </div>

          {/* KBIs and Plan */}
          <div className="form-section">
            <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {['kbi_1','kbi_2','kbi_3','kbi_4'].map((k, idx) => (
                <div className="form-group" key={k}>
                  <label>Key Business Initiative #{idx+1}{idx===0 ? ' *' : ''}</label>
                  <select className="pd-select" name={k} value={form[k]} onChange={onChange}>
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
              <div className="form-group">
                <label style={{ alignSelf: 'flex-start', marginTop: '.3rem' }}>Business Plan *</label>
                <textarea className="pd-textarea" name="business_plan" value={form.business_plan} onChange={onChange} placeholder="Describe the value-add strategy and exit plan..." />
              </div>
              <div className="form-group">
                <label>Marketing Title</label>
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                  <input className="pd-input" name="marketing_title" value={form.marketing_title} onChange={(e) => updateMarketingTitleDisplay(e.target.value)} placeholder="3-6 words" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DETAILS TAB */}
        <div className={`pd-tab-panel ${activeTab === 'details' ? 'active' : ''}`} id="details">
          <h1 className="detail-header">Annual Cash Flow</h1>
          <div className="form-section">
            <div className="form-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr' }}>
              <div className="form-group">
                <label>Coupon</label>
                <input className="pd-input" name="est_annual_cash_flow" value={form.est_annual_cash_flow} onChange={(e) => { onChange(e); }} onBlur={recalcCashOnCash} placeholder="$50,000" />
              </div>
              <div className="form-group">
                <label>Per $100k Equity Investment</label>
                <input className="pd-input" name="per_100k" value={form.per_100k} readOnly placeholder="Auto-calc" />
              </div>
              <div className="form-group">
                <label>Cash on Cash</label>
                <input className="pd-input" name="est_cash_on_cash" value={form.est_cash_on_cash} readOnly placeholder="Auto-calc" />
              </div>
              <div className="form-group">
                <label>Distribution Frequency</label>
                <select className="pd-select" name="distribution_frequency" value={form.distribution_frequency} onChange={onChange}>
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
              <div className="form-group">
                <label># of Tenants</label>
                <input className="pd-input" name="num_tenants" value={form.num_tenants} onChange={onChange} />
              </div>
              <div className="form-group">
                <label>Occupancy %</label>
                <input className="pd-input" name="occupancy_percent" value={form.occupancy_percent} onChange={onChange} />
              </div>
              <div className="form-group">
                <label>WALT (years)</label>
                <input className="pd-input" name="walt" value={form.walt} onChange={onChange} />
              </div>
            </div>
          </div>

          {/* Top Tenants */}
          {[1,2,3].map((n) => (
            <div className="form-section" key={n}>
              <div className="form-row" style={{ gridTemplateColumns: '1fr .5fr .5fr .5fr 1fr 1fr' }}>
                <div className="form-group">
                  <label>Top Tenant {n}</label>
                  <input className="pd-input" name={`tenant_${n}_name`} value={form[`tenant_${n}_name`]} onChange={onChange} placeholder={n===1?'Walgreens': n===2?'LA Fitness':'Target'} />
                </div>
                <div className="form-group">
                  <label>SF Leased</label>
                  <input className="pd-input" name={`tenant_${n}_sf`} value={form[`tenant_${n}_sf`]} onChange={onChange} placeholder={n===1?'14,500': n===2?'35,000':'125,000'} />
                </div>
                <div className="form-group">
                  <label>% of NRA</label>
                  <input className="pd-input" name={`tenant_${n}_percent`} value={form[`tenant_${n}_percent`]} readOnly placeholder="Auto-calc" />
                </div>
                <div className="form-group">
                  <label>Lease Expiry Date</label>
                  <input className="pd-input" type="date" name={`tenant_${n}_expiry`} value={form[`tenant_${n}_expiry`]} onChange={onChange} />
                </div>
                <div className="form-group">
                  <label>Lease Structure</label>
                  <select className="pd-select" name={`tenant_${n}_lease_structure`} value={form[`tenant_${n}_lease_structure`]} onChange={onChange}>
                    <option value="">Select...</option>
                    <option>Gross</option>
                    <option>Modified Gross</option>
                    <option>NN</option>
                    <option>NNN</option>
                    <option>Mixed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Corp/Personal Guar</label>
                  <select className="pd-select" name={`tenant_${n}_guarantee`} value={form[`tenant_${n}_guarantee`]} onChange={onChange}>
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
              <div className="form-group">
                <label>Broker Name</label>
                <input className="pd-input" name="broker_name" value={form.broker_name} onChange={onChange} placeholder="John Smith" />
              </div>
              <div className="form-group">
                <label>Company Name</label>
                <input className="pd-input" name="broker_company" value={form.broker_company} onChange={onChange} placeholder="ABC Realty" />
              </div>
              <div className="form-group">
                <label>Broker Cell</label>
                <input className="pd-input" name="broker_cell" value={form.broker_cell} onChange={onChange} placeholder="(555) 987-6543" />
              </div>
              <div className="form-group">
                <label>Broker Email</label>
                <input className="pd-input" type="email" name="broker_email" value={form.broker_email} onChange={onChange} placeholder="broker@company.com" />
              </div>
              <div className="form-group">
                <label>Commission %</label>
                <input className="pd-input" name="commission" value={form.commission} onChange={onChange} placeholder="2%" />
              </div>
            </div>
          </div>

          {/* Hero Summary */}
          <div className="hero-generator" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', padding: '1.5rem', borderRadius: '12px', border: '2px solid #3b82f6', margin: '1.5rem 0' }}>
            <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
              <label style={{ fontSize: '13px', whiteSpace: 'nowrap', fontWeight: 600, minWidth: 110 }}>Hero Summary</label>
              <input className="pd-input" name="hero_summary" value={form.hero_summary} onChange={onChange} placeholder="Click Generate to auto-create from fields above" />
              <button type="button" className="pd-btn pd-btn-primary pd-btn-small" onClick={() => {
                const parts = [];
                if (form.total_sf) parts.push(`${String(form.total_sf).replace(/,/g,'')} SF`);
                if (form.asset_class) parts.push(form.asset_class);
                if (form.city && form.state) parts.push(`in ${form.city}, ${form.state}`);
                if (form.purchase_price) parts.push(`Priced at ${form.purchase_price}`);
                if (form.current_noi) parts.push(`Generating ${form.current_noi} NOI`);
                if (form.occupancy_percent) parts.push(`${form.occupancy_percent} occupied`);
                if (form.walt) parts.push(`with ${form.walt} year WALT`);
                if (form.kbi_1) parts.push(`Value-add: ${form.kbi_1.toLowerCase()}`);
                setField('hero_summary', `${parts.join('. ')}. Prime investment opportunity.`);
              }}>Generate</button>
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '.5rem', textAlign: 'center' }}>Fill in fields above, then click Generate to auto-create marketing summary</div>
          </div>
        </div>

        {/* Actions */}
        <div className="pd-actions">
          <button disabled={submitting} className="pd-btn-submit" type="submit">{submitting ? 'Saving…' : 'Create Property (Save as Draft)'}</button>
          <button disabled={submitting} type="button" className="pd-btn-publish" onClick={onPublish}>Approve & Publish Live</button>
        </div>
        {error && <div style={{ color: '#b91c1c', marginTop: '.75rem', textAlign: 'center' }}>{error}</div>}
      </form>
    </div>
  );
}
