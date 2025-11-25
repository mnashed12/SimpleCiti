// Delete image by id using backend API
async function deleteImage(imageId) {
  let csrftoken = '';
  try {
    csrftoken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || '';
  } catch {}
  const resp = await fetch(`/api/se/property-images/${imageId}/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: csrftoken ? { 'X-CSRFToken': csrftoken } : {},
  });
  if (!resp.ok && resp.status !== 204) {
    const errText = await resp.text();
    throw new Error('Delete failed: ' + errText);
  }
  return true;
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { propertyService } from '../services/apiService';
import '../styles/addproperty.css';
import ImageCarousel from '../components/ImageCarousel';

const defaultState = {
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
  loi_date: '',
  psa_date: '',
  dd_end_date: '',
  close_date: '',
  purchase_price: '',
  ltv: '',
  debt_amount: '',
  total_equity: '',
  cap_rate: '',
  current_noi: '',
  projected_irr: '',
  kbi_1: '',
  kbi_2: '',
  kbi_3: '',
  kbi_4: '',
  business_plan: '',
  hero_summary: '',
  est_annual_cash_flow: '',
  per_100k: '',
  est_cash_on_cash: '',
  distribution_frequency: 'Quarterly',
  num_tenants: '',
  occupancy_percent: '',
  walt: '',
  tenant_1_name: '', tenant_1_sf: '', tenant_1_percent: '', tenant_1_expiry: '', tenant_1_lease_structure: '', tenant_1_guarantee: '',
  tenant_2_name: '', tenant_2_sf: '', tenant_2_percent: '', tenant_2_expiry: '', tenant_2_lease_structure: '', tenant_2_guarantee: '',
  tenant_3_name: '', tenant_3_sf: '', tenant_3_percent: '', tenant_3_expiry: '', tenant_3_lease_structure: '', tenant_3_guarantee: '',
  broker_name: '', broker_company: '', broker_cell: '', broker_email: '', commission: '',
};

export default function EditProperty() {
    // --- Approve & Publish logic ---
    const [publishing, setPublishing] = useState(false);
    const onPublish = async () => {
      if (publishing) return;
      setPublishing(true);
      setError(null);
      try {
        // Only send non-empty values
        const payload = {};
        if (form.title) payload.title = form.title;
        if (form.property_type) payload.property_type = form.property_type;
        if (form.deal_stage) payload.deal_stage = form.deal_stage;
        // Map deal_stage display value to backend code
        const dealStageMap = {
          'LOI Out': 'LOI_OUT',
          'Under LOI': 'LOI_NEGOTIATING',
          'Under Due Diligence': 'IN_DUE_DILIGENCE',
          'Hard Deposit': 'CONTRACT_SIGNED',
          'Closing Scheduled': 'CONTRACT_SIGNED',
          'CLOSED': 'CONTRACT_SIGNED',
        };
        if (payload.deal_stage && dealStageMap[payload.deal_stage]) {
          payload.deal_stage = dealStageMap[payload.deal_stage];
        }
        if (form.address) payload.address = form.address;
        if (form.city) payload.city = form.city;
        if (form.state) payload.state = form.state;
        if (form.zip_code) payload.zip_code = form.zip_code;
        if (form.close_date) payload.close_date = form.close_date;
        if (form.purchase_price) {
          const price = Number(String(form.purchase_price).replace(/[$,]/g, ''));
          if (!isNaN(price) && price > 0) payload.purchase_price = price;
        }
        if (form.cap_rate) {
          const cap = Number(String(form.cap_rate).replace(/[%,]/g, ''));
          if (!isNaN(cap)) payload.cap_rate = cap;
        }
        // Add more fields as needed for update
        if (form.total_sf) {
          const totalSf = Number(String(form.total_sf).replace(/[,]/g, ''));
          if (!isNaN(totalSf) && totalSf > 0) payload.total_sf = totalSf;
        }
        // Ensure LTV is sent and cleaned
        if (form.ltv !== undefined && form.ltv !== null && form.ltv !== '') {
          const ltvVal = Number(String(form.ltv).replace(/[%,]/g, ''));
          if (!isNaN(ltvVal)) payload.ltv = ltvVal;
        }
        // Ensure NOI is sent and cleaned
        if (form.current_noi !== undefined && form.current_noi !== null && form.current_noi !== '') {
          const noiVal = Number(String(form.current_noi).replace(/[$,]/g, ''));
          if (!isNaN(noiVal)) payload.current_noi = noiVal;
        }
        payload.is_active = true;
        payload.status = 'approved';
        payload.publish_mode = 'live';
        await propertyService.updateProperty(referenceNumber, payload);
        navigate('/SE/PD');
      } catch (err) {
        setError('Failed to publish property.');
      } finally {
        setPublishing(false);
      }
    };
  const { referenceNumber } = useParams();
  const [form, setForm] = useState(defaultState);
  const [activeTab, setActiveTab] = useState('summary');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docStorage, setDocStorage] = useState({ om: [], rentroll: [], proforma: [], tic: [], environmental: [], legal: [], operating: [], market: [], brochure: [], other: [] });
  const [documents, setDocuments] = useState([]);
  const [images, setImages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await propertyService.getPropertyDetail(referenceNumber);
        // Format all currency and percent fields for view/edit
        const currencyFields = ['purchase_price', 'current_noi', 'est_annual_cash_flow', 'debt_amount', 'total_equity', 'per_100k'];
        const percentFields = ['ltv', 'cap_rate', 'projected_irr', 'occupancy_percent', 'tenant_1_percent', 'tenant_2_percent', 'tenant_3_percent', 'commission', 'vacancy_percent', 'interest_rate', 'dscr', 'walt', 'est_cash_on_cash'];
        const formatted = {};
        Object.entries({
          property_type: typeof data.property_type === 'string' ? data.property_type : (data.type || ''),
          deal_stage: typeof data.deal_stage === 'string' ? data.deal_stage : (data.dealStageCode || ''),
          title: data.title || data.property_name || '',
          marketing_title: data.marketing_title || data.title || '',
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
          num_tenants: data.num_tenants !== undefined && data.num_tenants !== null ? data.num_tenants : '',
          occupancy_percent: data.occupancy_percent || '',
          walt: data.walt || '',
          tenant_1_name: data.tenant_1_name || '', tenant_1_sf: data.tenant_1_sf || '', tenant_1_percent: data.tenant_1_percent || '', tenant_1_expiry: data.tenant_1_expiry || '', tenant_1_lease_structure: data.tenant_1_lease_structure || '', tenant_1_guarantee: data.tenant_1_guarantee || '',
          tenant_2_name: data.tenant_2_name || '', tenant_2_sf: data.tenant_2_sf || '', tenant_2_percent: data.tenant_2_percent || '', tenant_2_expiry: data.tenant_2_expiry || '', tenant_2_lease_structure: data.tenant_2_lease_structure || '', tenant_2_guarantee: data.tenant_2_guarantee || '',
          tenant_3_name: data.tenant_3_name || '', tenant_3_sf: data.tenant_3_sf || '', tenant_3_percent: data.tenant_3_percent || '', tenant_3_expiry: data.tenant_3_expiry || '', tenant_3_lease_structure: data.tenant_3_lease_structure || '', tenant_3_guarantee: data.tenant_3_guarantee || '',
          broker_name: data.broker_name || '', broker_company: data.broker_company || '', broker_cell: data.broker_cell || '', broker_email: data.broker_email || '', commission: data.commission || '',
        }).forEach(([key, val]) => {
          if (currencyFields.includes(key)) {
            formatted[key] = formatCurrency(val);
          } else if (percentFields.includes(key)) {
            formatted[key] = formatPercent(val);
          } else if (key === 'deal_stage' || key === 'property_type') {
            formatted[key] = val || '';
          } else {
            formatted[key] = val;
          }
        });
        setForm((prev) => {
          // Calculate debt/equity if missing or zero
          const price = parseFloat(String(formatted.purchase_price).replace(/[$,]/g, '')) || 0;
          const ltv = parseFloat(String(formatted.ltv).replace(/[%,]/g, '')) || 0;
          const debt = price * (ltv / 100);
          const equity = Math.max(0, price - debt);
          return {
            ...formatted,
            deal_stage: formatted.deal_stage || data.deal_stage || '',
            property_type: formatted.property_type || data.property_type || '',
            debt_amount: debt ? `$${Math.round(debt).toLocaleString()}` : '',
            total_equity: price ? `$${Math.round(equity).toLocaleString()}` : '',
          };
        });
        setImages(data.images || []);
        setError(null);
        // Fetch documents from backend
        try {
          const resp = await fetch(`/api/se/properties/${referenceNumber}/documents/`, {
            method: 'GET',
            credentials: 'include',
          });
          if (resp.ok) {
            const docs = await resp.json();
            setDocuments(docs);
          }
        } catch {}
      } catch (e) {
        setError('Property not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [referenceNumber]);


  // Helper functions for formatting
  function formatCurrency(val) {
    if (val === null || val === undefined || val === '') return '';
    let num = String(val).replace(/[^\d.]/g, '');
    if (num === '') return '';
    let float = parseFloat(num);
    if (isNaN(float)) return '';
    return '$' + float.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  function formatPercent(val) {
    if (val === null || val === undefined || val === '') return '';
    let num = String(val).replace(/[^\d.]/g, '');
    if (num === '') return '';
    let float = parseFloat(num);
    if (isNaN(float)) return '';
    return float + '%';
  }

  // Fields to format
  const currencyFields = ['purchase_price', 'current_noi', 'est_annual_cash_flow'];
  const percentFields = ['ltv', 'cap_rate', 'projected_irr', 'occupancy_percent', 'tenant_1_percent', 'tenant_2_percent', 'tenant_3_percent', 'commission', 'vacancy_percent', 'interest_rate', 'dscr', 'walt'];

  const onChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (currencyFields.includes(name)) {
      newValue = formatCurrency(value);
    } else if (percentFields.includes(name)) {
      newValue = formatPercent(value);
    }
    setForm((f) => ({ ...f, [name]: newValue }));
  };

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  // Derived: submarket when city/state present
  const submarket = useMemo(() => {
    if (form.city && form.state) return `${form.city}, ${form.state}`;
    return form.submarket;
  }, [form.city, form.state, form.submarket]);

  // Calculations
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
    // Upload to backend
    if (!referenceNumber || !file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', type);
    // Get CSRF token from cookie if present
    function getCookie(name) {
      let cookieValue = null;
      if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            break;
          }
        }
      }
      return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');
    fetch(`/api/se/properties/${referenceNumber}/documents/`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: csrftoken ? { 'X-CSRFToken': csrftoken } : {},
    })
      .then(async (resp) => {
        if (resp.ok) {
          // Refresh document list
          const docsResp = await fetch(`/api/se/properties/${referenceNumber}/documents/`, {
            method: 'GET',
            credentials: 'include',
          });
          if (docsResp.ok) {
            const docs = await docsResp.json();
            setDocuments(docs);
          }
        } else {
          alert('Document upload failed.');
        }
      })
      .catch(() => alert('Document upload failed.'));
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

  // Image upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    // Get CSRF token from cookie if present
    function getCookie(name) {
      let cookieValue = null;
      if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            break;
          }
        }
      }
      return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');
    try {
      // POST to /api/se/properties/{referenceNumber}/images/
      await fetch(`/api/se/properties/${referenceNumber}/images/`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: csrftoken ? { 'X-CSRFToken': csrftoken } : {},
      });
      // Refresh images
      const data = await propertyService.getPropertyDetail(referenceNumber);
      setImages(data.images || []);
    } catch (err) {
      alert('Image upload failed.');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // Only send non-empty values
      const payload = {};
      if (form.title) payload.title = form.title;
      if (form.property_type) payload.property_type = form.property_type;
      if (form.deal_stage) payload.deal_stage = form.deal_stage;
      // Map deal_stage display value to backend code
      const dealStageMap = {
        'LOI Out': 'LOI_OUT',
        'Under LOI': 'LOI_NEGOTIATING',
        'Under Due Diligence': 'IN_DUE_DILIGENCE',
        'Hard Deposit': 'CONTRACT_SIGNED',
        'Closing Scheduled': 'CONTRACT_SIGNED',
        'CLOSED': 'CONTRACT_SIGNED',
      };
      if (payload.deal_stage && dealStageMap[payload.deal_stage]) {
        payload.deal_stage = dealStageMap[payload.deal_stage];
      }
      if (form.address) payload.address = form.address;
      if (form.city) payload.city = form.city;
      if (form.state) payload.state = form.state;
      if (form.zip_code) payload.zip_code = form.zip_code;
      if (form.close_date) payload.close_date = form.close_date;
      if (form.purchase_price) {
        const price = Number(String(form.purchase_price).replace(/[$,]/g, ''));
        if (!isNaN(price) && price > 0) payload.purchase_price = price;
      }
      if (form.cap_rate) {
        const cap = Number(String(form.cap_rate).replace(/[%,]/g, ''));
        if (!isNaN(cap)) payload.cap_rate = cap;
      }
      // Add more fields as needed for update
      if (form.total_sf) {
        const totalSf = Number(String(form.total_sf).replace(/[,]/g, ''));
        if (!isNaN(totalSf) && totalSf > 0) payload.total_sf = totalSf;
      }
      // Ensure LTV is sent and cleaned
      if (form.ltv !== undefined && form.ltv !== null && form.ltv !== '') {
        const ltvVal = Number(String(form.ltv).replace(/[%,]/g, ''));
        if (!isNaN(ltvVal)) payload.ltv = ltvVal;
      }
      // Ensure NOI is sent and cleaned
      if (form.current_noi !== undefined && form.current_noi !== null && form.current_noi !== '') {
        const noiVal = Number(String(form.current_noi).replace(/[$,]/g, ''));
        if (!isNaN(noiVal)) payload.current_noi = noiVal;
      }

      // Ensure num_tenants is sent as integer
      if (form.num_tenants !== undefined && form.num_tenants !== null && form.num_tenants !== '') {
        const numTenants = parseInt(String(form.num_tenants).replace(/[^\d]/g, ''), 10);
        if (!isNaN(numTenants)) payload.num_tenants = numTenants;
      }

      // Only send tenant_X_expiry if valid YYYY-MM-DD
      [1,2,3].forEach(n => {
        const key = `tenant_${n}_expiry`;
        const val = form[key];
        if (val && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
          payload[key] = val;
        }
      });

      payload.is_active = false;
      payload.status = 'draft';
      await propertyService.updateProperty(referenceNumber, payload);
      navigate('/SE/PD');
    } catch (err) {
      setError('Failed to save changes.');
    } finally {
      setSubmitting(false);
    }
  };

  // List of required fields for completion tracker
  const requiredFields = [
    'title', 'property_type', 'address', 'city', 'state', 'zip_code', 'total_sf',
    'purchase_price', 'kbi_1', 'business_plan', 'est_annual_cash_flow',
    'num_tenants', 'occupancy_percent', 'walt',
    'broker_name', 'broker_email', 'broker_company'
  ];
  // Calculate completion percentage
  const completionPercent = Math.round(
    requiredFields.filter(f => {
      const val = form[f];
      // Accept 0 as valid for numeric fields
      return val !== undefined && val !== null && val !== '';
    }).length / requiredFields.length * 100
  );

  if (loading) {
    return <div className="pd-container" style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>;
  }
  if (error) {
    return <div className="pd-container" style={{ padding: '2rem', textAlign: 'center', color: '#b91c1c' }}>{error}</div>;
  }

  return (
    <div className="pd-container wide">
      <div className="pd-header-row ap-pt-1rem">
        <div className="pd-ref-title">
          <h1>
            <span className="pd-ref-number">REF #{referenceNumber}</span> -{' '}
            <span id="marketingTitleDisplay">{form.marketing_title || 'Not Set'}</span>
          </h1>
        </div>
        <div className="pd-timeline">
          <div className="pd-timeline-box pd-tl-draft">
            <div className="pd-tl-title">Draft - {completionPercent}%</div>
            <div>In Progress</div>
          </div>
          <div className="pd-timeline-box pd-tl-published">
            <div className="pd-tl-title">Published</div>
            <div>Awaiting</div>
          </div>
        </div>
      </div>

      <div className="pd-tabs ap-mt-1rem">
        <div className="ap-flex ap-gap-05rem">
          <button type="button" className={`pd-tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>Summary</button>
          <button type="button" className={`pd-tab ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Details</button>
        </div>
        <div className="ap-flex ap-gap-05rem ap-ml-50px ap-items-center">
          <div className="ap-asset-deal-row">
            <div className="ap-asset-class-group">
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
            </div>
            <div className="ap-deal-status-group">
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
        </div>
      </div>

      <form onSubmit={onSubmit}>
        {/* SUMMARY TAB */}
        <div className={`pd-tab-panel ${activeTab === 'summary' ? 'active' : ''}`} id="summary">
          <div className="ap-banner-info">
            Only Visible to Clients with Down Payment
          </div>

          {/* Docs Grid */}
          <div className="pd-doc-grid">
            {['om','rentroll','proforma','tic','environmental'].map((t) => (
              <div key={t} className="pd-doc-box-container">
                <div
                  className={`pd-doc-box${documents.some(doc => doc.document_type === t) ? ' pd-doc-box-disabled' : ''}`}
                  onClick={() => {
                    if (!documents.some(doc => doc.document_type === t)) onDocBoxClick(t);
                  }}
                  style={documents.some(doc => doc.document_type === t) ? { cursor: 'not-allowed', opacity: 0.7 } : {}}
                >
                  {/* Field label above, single line */}
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                    {{
                      om: 'Offering Memorandum', rentroll: 'Rent Roll', proforma: 'Pro Forma', tic: 'TIC Agreement', environmental: 'Environmental Report'
                    }[t]}
                  </div>
                  {/* Filename below, blue like hyperlink */}
                  {(() => {
                    const doc = documents.find(doc => doc.document_type === t);
                    if (doc) {
                      return (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 500, display: 'block', marginTop: 2 }}
                        >
                          {doc.filename}
                        </a>
                      );
                    } else {
                      return <div>Drag & drop or click</div>;
                    }
                  })()}
                </div>
                {/* Remove button below if document exists */}
                {(() => {
                  const doc = documents.find(doc => doc.document_type === t);
                  if (doc) {
                    return (
                      <div className="pd-doc-remove-btn-row ap-mt-05rem ap-fs-10px" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="pd-btn pd-btn-small pd-btn-danger"
                          style={{ fontSize: '11px', padding: '2px 8px'}}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!window.confirm('Delete this document?')) return;
                            try {
                              const csrftoken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || '';
                              const resp = await fetch(`/api/se/properties/${referenceNumber}/documents/${doc.id}/`, {
                                method: 'DELETE',
                                credentials: 'include',
                                headers: csrftoken ? { 'X-CSRFToken': csrftoken } : {},
                              });
                              if (resp.ok || resp.status === 204) {
                                // Refresh document list
                                const docsResp = await fetch(`/api/se/properties/${referenceNumber}/documents/`, {
                                  method: 'GET',
                                  credentials: 'include',
                                });
                                if (docsResp.ok) {
                                  const docs = await docsResp.json();
                                  setDocuments(docs);
                                }
                              } else {
                                alert('Failed to delete document.');
                              }
                            } catch {
                              alert('Failed to delete document.');
                            }
                          }}
                        >Remove</button>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ))}
          </div>
          <div className="pd-doc-grid">
            {['legal','operating','market','brochure','other'].map((t) => (
              <div key={t} className="pd-doc-box" onClick={() => onDocBoxClick(t)}>
                <strong className="ap-block ap-mb-025rem">{{
                  legal: 'Legal Opinion', operating: 'Operating Statements', market: 'Market Research', brochure: 'Marketing Brochure', other: 'Other'
                }[t]}</strong>
                <div>Drag & drop or click</div>
                {documents.filter(doc => doc.document_type === t).map(doc => (
                  <div key={doc.id} className="ap-mt-05rem ap-fs-10px">
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">{doc.filename}</a>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Key Dates */}
          <div className="pd-form-section form-section">
            <h1 className="detail-header">Key Dates</h1>
            <div className="key-dates-row">
              <div className="key-date-group">
                <label className="key-date-label">LOI Date</label>
                <div className="key-date-input-row">
                  <input className="pd-input key-date-input" type="date" name="loi_date" value={form.loi_date} onChange={onChange} />
                </div>
              </div>
              <div className="key-date-group">
                <label className="key-date-label">PSA Date</label>
                <div className="key-date-input-row">
                  <input className="pd-input key-date-input" type="date" name="psa_date" value={form.psa_date} onChange={onChange} />
                </div>
                <div className="date-buttons">
                  {[5,10,20,30,45].map((d) => (
                    <button key={d} type="button" onClick={() => addDaysTo('loi_date','psa_date', d)}>+{d}</button>
                  ))}
                </div>
              </div>
              <div className="key-date-group">
                <label className="key-date-label">DD End</label>
                <div className="key-date-input-row">
                  <input className="pd-input key-date-input" type="date" name="dd_end_date" value={form.dd_end_date} onChange={onChange} />
                </div>
                <div className="date-buttons">
                  {[20,30,45,60,90].map((d) => (
                    <button key={d} type="button" onClick={() => addDaysTo('psa_date','dd_end_date', d)}>+{d}</button>
                  ))}
                </div>
              </div>
              <div className="key-date-group">
                <label className="key-date-label">Closing Date</label>
                <div className="key-date-input-row">
                  <input className="pd-input key-date-input" type="date" name="close_date" value={form.close_date} onChange={onChange} />
                </div>
                <div className="date-buttons">
                  {[10,20,30,45].map((d) => (
                    <button key={d} type="button" onClick={() => addDaysTo('dd_end_date','close_date', d)}>+{d}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Property */}
          <h1 className="detail-header ap-pt-05rem">Property</h1>
          <div className="pd-form-row form-row ap-flex ap-gap-15rem ap-flex-wrap">
            <div className="pd-form-group form-group ap-minw-300 ap-flex-1">
              <label>Address</label>
              <input className={`pd-input${!form.address ? ' pd-input-required' : ''}`} name="address" value={form.address} onChange={onChange} placeholder="900 Stewart Avenue" required />
            </div>
            <div className="pd-form-group form-group">
              <label>City</label>
              <input className={`pd-input${!form.city ? ' pd-input-required' : ''}`} name="city" value={form.city} onChange={onChange} placeholder="Garden City" required />
            </div>
            <div className="pd-form-group form-group">
              <label>State</label>
              <input className={`pd-input ap-uppercase${!form.state ? ' pd-input-required' : ''}`} name="state" value={form.state} onChange={onChange} maxLength={2} required />
            </div>
            <div className="pd-form-group form-group">
              <label>ZIP</label>
              <input className={`pd-input${!form.zip_code ? ' pd-input-required' : ''}`} name="zip_code" value={form.zip_code} onChange={onChange} placeholder="11530" required />
            </div>
            <div className="pd-form-group form-group">
              <label>SF</label>
              <input className={`pd-input${!form.total_sf ? ' pd-input-required' : ''}`} name="total_sf" value={form.total_sf} onChange={onChange} placeholder="75,000" required />
            </div>
            <div className="pd-form-group form-group">
              <label>Acres</label>
              <input className="pd-input" name="acres" value={form.acres} onChange={onChange} placeholder="4.5" />
            </div>
            <div className="pd-form-group form-group">
              <label>Submarket</label>
              <input className="pd-input" name="submarket" value={submarket} readOnly placeholder="Auto-filled" />
            </div>
            <div className="pd-form-group form-group ap-flex-1 ap-minw-300">
              <label className="ap-align-start ap-mt-05rem">Location Highlights</label>
              <input className="pd-input" name="location_highlights" value={form.location_highlights} onChange={onChange} placeholder="Near major highways, airport access..." />
            </div>
          </div>

          {/* Financials */}
          <h1 className="detail-header">Financials</h1>
          <div className="form-section">
            <div className="form-row ap-grid-cols-financials">
              <div className="form-group">
                <label>Acquisition Price</label>
                <input className={`pd-input${!form.purchase_price ? ' pd-input-required' : ''}`} name="purchase_price" value={form.purchase_price} onChange={onChange} onBlur={recalcFinancials} placeholder="$5,000,000" required />
              </div>
              <div className="form-group">
                <label>LTV %</label>
                <input className="pd-input" name="ltv" value={form.ltv} onChange={onChange} onBlur={recalcFinancials} placeholder="65%" />
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
                <input className="pd-input" name="current_noi" value={form.current_noi} onChange={onChange} onBlur={recalcFinancials} placeholder="$550,000" />
              </div>
              <div className="form-group">
                <label>IRR (5yr)</label>
                <input className="pd-input" name="projected_irr" value={form.projected_irr} onChange={onChange} placeholder="18.5%" />
              </div>
            </div>
          </div>

          {/* KBIs and Plan */}
          <div className="form-section">
            <div className="form-row ap-grid-cols-4">
              {['kbi_1','kbi_2','kbi_3','kbi_4'].map((k, idx) => (
                <div className="form-group" key={k}>
                  <label>Key Business Initiative #{idx+1}{idx===0 ? ' *' : ''}</label>
                  <select className={`pd-select${k === 'kbi_1' && !form[k] ? ' pd-input-required' : ''}`} name={k} value={form[k]} onChange={onChange} required={k === 'kbi_1'}>
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
            <div className="form-row ap-grid-cols-3-1 ap-mt-03rem">
              <div className="form-group business-plan-group">
                <label className="ap-align-start ap-mt-03rem">Business Plan *</label>
                <textarea className={`pd-textarea business-plan-box${!form.business_plan ? ' pd-input-required' : ''}`} name="business_plan" value={form.business_plan} onChange={onChange} placeholder="Describe the value-add strategy and exit plan..." required />
              </div>
              <div className="form-group marketing-title-group">
                <label>Marketing Title</label>
                <div className="ap-flex ap-gap-05rem ap-items-center">
                  <input className="pd-input marketing-title-box" name="marketing_title" value={form.marketing_title} onChange={(e) => updateMarketingTitleDisplay(e.target.value)} placeholder="3-6 words" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DETAILS TAB */}
        <div className={`pd-tab-panel ${activeTab === 'details' ? 'active' : ''}`} id="details">
          <h1 className="detail-header">Annual Cash Flow</h1>
          <div className="form-section">
            <div className="form-row ap-grid-cols-cashflow">
              <div className="form-group">
                <label>Coupon</label>
                <input className={`pd-input${!form.est_annual_cash_flow ? ' pd-input-required' : ''}`} name="est_annual_cash_flow" value={form.est_annual_cash_flow} onChange={onChange} onBlur={recalcCashOnCash} placeholder="$50,000" required />
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
            <div className="form-row ap-grid-cols-tenancy">
              <div className="form-group">
                <label># of Tenants</label>
                <input className={`pd-input${form.num_tenants === '' ? ' pd-input-required' : ''}`} name="num_tenants" value={form.num_tenants} onChange={onChange} required />
              </div>
              <div className="form-group">
                <label>Occupancy %</label>
                <input className={`pd-input${!form.occupancy_percent ? ' pd-input-required' : ''}`} name="occupancy_percent" value={form.occupancy_percent} onChange={onChange} required />
              </div>
              <div className="form-group">
                <label>WALT (years)</label>
                <input className={`pd-input${!form.walt ? ' pd-input-required' : ''}`} name="walt" value={form.walt} onChange={onChange} required />
              </div>
            </div>
          </div>

          {[1,2,3].map((n) => (
            <div className="form-section" key={n}>
              <div className="form-row ap-grid-cols-toptenants">
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
            <div className="form-row ap-grid-cols-broker">
              <div className="form-group">
                <label>Broker Name</label>
                <input className={`pd-input${!form.broker_name ? ' pd-input-required' : ''}`} name="broker_name" value={form.broker_name} onChange={onChange} placeholder="John Smith" required />
              </div>
              <div className="form-group">
                <label>Company Name</label>
                <input className={`pd-input${!form.broker_company ? ' pd-input-required' : ''}`} name="broker_company" value={form.broker_company} onChange={onChange} placeholder="ABC Realty" required />
              </div>
              <div className="form-group">
                <label>Broker Cell</label>
                <input className={`pd-input${!form.broker_cell ? ' pd-input-required' : ''}`} name="broker_cell" value={form.broker_cell} onChange={onChange} placeholder="(555) 987-6543" required />
              </div>
              <div className="form-group">
                <label>Broker Email</label>
                <input className={`pd-input${!form.broker_email ? ' pd-input-required' : ''}`} type="email" name="broker_email" value={form.broker_email} onChange={onChange} placeholder="broker@company.com" required />
              </div>
              <div className="form-group">
                <label>Commission %</label>
                <input className="pd-input" name="commission" value={form.commission} onChange={onChange} placeholder="2%" />
              </div>
            </div>
          </div>

          {/* Hero Summary */}
          <div className="hero-generator ap-hero-bg">
            <div className="ap-flex ap-gap-05rem ap-items-center">
              <label className="ap-fs-13px ap-nowrap ap-fw-600 ap-minw-110">Hero Summary</label>
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
            <div className="ap-fs-11px ap-color-666 ap-mt-05rem ap-tac">Fill in fields above, then click Generate to auto-create marketing summary</div>
          </div>

          {/* Image Upload Section */}
          <div className="form-section" style={{ marginTop: '2rem' }}>
            <h1 className="detail-header">Property Images</h1>
            <div className="image-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '1rem',
              marginTop: '1rem',
            }}>
              {[...Array(10)].map((_, idx) => {
                const img = images[idx];
                return (
                  <div key={idx} className="image-box" style={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    minHeight: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fafbfc',
                    position: 'relative',
                    padding: '0.5rem',
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{`Picture ${idx + 1}`}</div>
                    {img ? (
                      <>
                        <img src={img.image_url || img.url || img.image || img} alt={`Property ${idx + 1}`} style={{ maxWidth: '100%', maxHeight: 80, marginBottom: 4, borderRadius: 4 }} />
                        <button
                          type="button"
                          style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            background: '#fff',
                            border: '1px solid #e11d48',
                            color: '#e11d48',
                            borderRadius: 4,
                            padding: '2px 8px',
                            fontSize: 12,
                            cursor: 'pointer',
                            zIndex: 2,
                          }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!img.id) return alert('No image id');
                            if (!window.confirm('Delete this image?')) return;
                            try {
                              await deleteImage(img.id);
                              const data = await propertyService.getPropertyDetail(referenceNumber);
                              setImages(data.images || []);
                            } catch (err) {
                              alert('Failed to delete image: ' + (err?.message || err));
                            }
                          }}
                        >Delete</button>
                      </>
                    ) : (
                      <>
                        <img src="/static/placeholder-property.jpg" alt="placeholder" style={{ maxWidth: '100%', maxHeight: 80, marginBottom: 4, borderRadius: 4, opacity: 0.4 }} />
                        <div style={{ color: '#888', fontSize: 12, textAlign: 'center', marginBottom: 4 }}>
                          Click or drag & drop image here
                        </div>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('image', file);
                        formData.append('order', Number.isInteger(idx) ? idx : 0);
                        let csrftoken = '';
                        try {
                          csrftoken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] || '';
                        } catch {}
                        try {
                          const resp = await fetch(`/api/se/properties/${referenceNumber}/images/`, {
                            method: 'POST',
                            body: formData,
                            credentials: 'include',
                            headers: csrftoken ? { 'X-CSRFToken': csrftoken } : {},
                          });
                          if (!resp.ok) {
                            const errText = await resp.text();
                            alert('Image upload failed: ' + errText);
                            return;
                          }
                          // Refresh images
                          const data = await propertyService.getPropertyDetail(referenceNumber);
                          setImages(data.images || []);
                        } catch (err) {
                          alert('Image upload failed: ' + (err?.message || err));
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pd-actions">
          <button disabled={submitting || publishing} className="pd-btn-submit" type="submit">{submitting ? 'Saving…' : 'Save Changes (Draft)'}</button>
          <button disabled={submitting || publishing} type="button" className="pd-btn-publish" style={{ marginLeft: '.5rem' }} onClick={onPublish}>{publishing ? 'Saving…' : 'Approve & Publish Live'}</button>
          <button type="button" onClick={() => navigate('/SE/PD')} className="pd-btn pd-btn-small" style={{ marginLeft: '.5rem' }}>Cancel</button>
        </div>
        {error && <div style={{ color: '#b91c1c', marginTop: '.75rem', textAlign: 'center' }}>{error}</div>}
      </form>
    </div>
  );
}
