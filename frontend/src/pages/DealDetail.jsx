import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ImageCarousel from '../components/ImageCarousel';
import Modal from '../components/Modal';
import {
  calculateDaysUntilClosing,
  formatDate,
  formatCurrency,
  formatLargeNumber,
  formatPercentage,
  buildFullAddress,
  getAssetType,
  calculateQuarterlyPer1M,
  getNestedValue,
} from '../utils/propertyHelpers';
import '../styles/deal-detail.css';

export default function DealDetail() {
  const { referenceNumber } = useParams();
  const navigate = useNavigate();
  
  // State Management
  const [property, setProperty] = useState(null);
  const [relatedProperties, setRelatedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [feesModalOpen, setFeesModalOpen] = useState(false);

  // Fetch property details
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
  // Use legacy endpoint that matches production data
  const response = await fetch(`/api/properties/${referenceNumber}/`);
        
        if (!response.ok) {
          throw new Error(`Property not found (${response.status})`);
        }
        
        const data = await response.json();
        setProperty(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching property:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [referenceNumber]);

  // Fetch related/more properties
  useEffect(() => {
    const fetchRelatedProperties = async () => {
      try {
        const response = await fetch('/api/properties/');
        const data = await response.json();
        
        // Get 3 random properties excluding current one
        const list = (data && Array.isArray(data.properties)) ? data.properties : [];
        const others = list
          .filter(p => (p.referenceNumber || p.reference_number) !== referenceNumber)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        
        setRelatedProperties(others);
      } catch (err) {
        console.error('Error fetching related properties:', err);
      }
    };

    if (property) {
      fetchRelatedProperties();
    }
  }, [property, referenceNumber]);

  // Scroll to section with offset for sticky nav
  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 140; // Account for sticky nav
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'white' }}>
        <div style={{ fontSize: '1.5rem' }}>Loading property details...</div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '4rem 1rem', color: 'white' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#FFC107' }}>Property Not Found</h1>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
          {error || 'The requested property could not be found.'}
        </p>
        <button 
          onClick={() => navigate('/hub')} 
          className="cta-button primary"
          style={{ display: 'inline-block' }}
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  // Computed values
  const fullAddress = buildFullAddress(property);
  const assetType = getAssetType(property.type);
  const daysUntilClosing = calculateDaysUntilClosing(property.closeDate);
  const formattedCloseDate = formatDate(property.closeDate);
  const quarterlyPer1M = calculateQuarterlyPer1M(property.financial?.per100k || property.per_100k);

  return (
    <div className="deal-detail-page">
      <div className="container">
        {/* Property Header */}
        <div className="property-title-header">
          <div className="deal-top-bar">
            <div className="deal-left">
              <button 
                className="deal-map-pin" 
                onClick={() => setMapModalOpen(true)}
                title="View on Google Maps"
              >
                <img src="/static/googlepin.png" alt="Map Pin" />
              </button>
              <h1 className="deal-address">{fullAddress}</h1>
            </div>
            <div className="deal-right">
              {property.dealStage && (
                <span className="deal-stage-holder">
                  <span className="property-stage-badge">{property.dealStage}</span>
                </span>
              )}
              <span className="deal-meta-label">CLOSING</span>
              <span className="deal-meta-value">{formattedCloseDate}</span>
              <span className="deal-meta-label">DAYS REMAINING</span>
              <span className="deal-meta-value">{daysUntilClosing}</span>
              <span className="deal-asset-type">{assetType.toUpperCase()}</span>
              <span className="deal-ref">REF: {property.referenceNumber || 'N/A'}</span>
            </div>
          </div>
          {property.propertyHeader && (
            <div className="property-header-subtitle">
              {property.propertyHeader.length > 180 
                ? property.propertyHeader.substring(0, 177) + '...' 
                : property.propertyHeader}
            </div>
          )}
        </div>

        {/* Image Carousel */}
        <ImageCarousel 
          images={property.images || []} 
          title={property.title || 'Property'}
        />

        {/* Section Navigation */}
        <nav className="section-nav">
          <a href="#financials" className="nav-pill" onClick={(e) => scrollToSection(e, 'financials')}>Financials</a>
          <a href="#property" className="nav-pill" onClick={(e) => scrollToSection(e, 'property')}>Property</a>
          <a href="#tenancy" className="nav-pill" onClick={(e) => scrollToSection(e, 'tenancy')}>Tenancy</a>
          <a href="#returns" className="nav-pill" onClick={(e) => scrollToSection(e, 'returns')}>Returns</a>
          <a href="#strategy" className="nav-pill" onClick={(e) => scrollToSection(e, 'strategy')}>Strategy</a>
        </nav>

        {/* Content Layout */}
        <div className="content-layout">
          {/* Main Column */}
          <main className="main-column">
            {/* Financials + Returns */}
            <div className="two-up-grid">
              <FinancialsSection property={property} />
              <ReturnsSection property={property} />
            </div>

            {/* Property Details */}
            <PropertyDetailsSection property={property} />

            {/* Tenancy */}
            <TenancySection property={property} />

            {/* Strategy */}
            <StrategySection property={property} />
          </main>

          {/* Side Rail */}
          <SideRail 
            property={property} 
            daysUntilClosing={daysUntilClosing}
            formattedCloseDate={formattedCloseDate}
            assetType={assetType}
            quarterlyPer1M={quarterlyPer1M}
            onOpenFeesModal={() => setFeesModalOpen(true)}
          />
        </div>

        {/* More Opportunities */}
        <MoreOpportunities 
          properties={relatedProperties} 
          onNavigate={(refNum) => navigate(`/deal-detail/${refNum}`)}
        />
      </div>

      {/* Modals */}
      <MapModal 
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        address={fullAddress}
        title={property.title}
      />

      <FeesModal 
        isOpen={feesModalOpen}
        onClose={() => setFeesModalOpen(false)}
        fees={property.fees || []}
      />
    </div>
  );
}

// Sub-components for better organization
function FinancialsSection({ property }) {
  // Single metric per row to match design
  const metrics = [
    { label: 'Purchase Price', value: formatLargeNumber(property.financial?.purchasePrice || property.totalValue) },
    { label: 'Current NOI', value: formatLargeNumber(property.financial?.currentNOI || property.current_noi) },
    { label: 'LTV', value: formatPercentage(property.financial?.ltv || property.ltvPercent) },
    { label: 'Cash-on-Cash', value: formatPercentage(property.financial?.estCashOnCash || property.est_cash_on_cash) },
    { label: 'Cap Rate', value: formatPercentage(property.financial?.capRate || property.cap_rate) },
    { label: 'Debt Amount', value: formatLargeNumber(property.financial?.debtAmount) },
    { label: 'DSCR', value: property.financial?.dscr ? property.financial.dscr.toFixed(2) : 'N/A' },
    { label: 'IRR', value: formatPercentage(property.returns?.projectedIRR || property.projected_irr) },
  ];

  return (
    <section id="financials" className="section-card">
      <div className="section-header">Financial Metrics</div>
      <div className="metrics-table">
        {metrics.map((row, idx) => (
          <div key={idx} className="metrics-row">
            <span className="label">{row.label}</span>
            <span className="value">{row.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReturnsSection({ property }) {
  const per100k = property.financial?.per100k || property.per_100k || 0;
  const monthlyPer1M = calculateQuarterlyPer1M(per100k) / 3;
  const quarterlyPer1M = calculateQuarterlyPer1M(per100k);

  return (
    <section id="returns" className="section-card">
      <div className="section-header">Investment Returns</div>
      <div className="investor-disclaimer">
        *Cash Flow is defined as cash to investor after operating costs, fee sets, and debt.
      </div>
      <div className="returns-display">
        <div className="return-item">
          <div className="return-value">${formatCurrency(monthlyPer1M, 0)}</div>
          <div className="return-label">Monthly</div>
          <div className="return-sublabel">Per $1M Investment</div>
        </div>
        <div className="return-item">
          <div className="return-value">${formatCurrency(quarterlyPer1M, 0)}</div>
          <div className="return-label">Quarterly</div>
          <div className="return-sublabel">Per $1M Investment</div>
        </div>
      </div>
    </section>
  );
}

function PropertyDetailsSection({ property }) {
  const keyDates = [
  { label: 'LOI Date', value: formatDate(property.loiDate) },
  { label: 'PSA Date', value: formatDate(property.psaDate) },
  { label: 'DD End', value: formatDate(property.ddEndDate) },
  { label: 'Closing', value: formatDate(property.closeDate) },
  ];

  const location = [
    { label: 'City', value: property.location?.city || property.city || 'N/A' },
    { label: 'State', value: property.location?.state || property.state || 'N/A' },
  { label: 'ZIP', value: property.location?.zipCode || property.zip_code || 'N/A' },
  { label: 'Submarket', value: property.location?.submarket || 'N/A' },
  ];

  const building = [
  { label: 'Total SF', value: property.building?.totalSF ? property.building.totalSF.toLocaleString() : 'N/A' },
  { label: 'Acres', value: property.building?.acres != null ? property.building.acres.toFixed(2) : 'N/A' },
  { label: 'Vacancy', value: property.building?.vacancy != null ? `${property.building.vacancy.toFixed(1)}%` : 'N/A' },
  { label: 'WALT', value: property.building?.walt != null ? `${property.building.walt.toFixed(1)} Yrs` : 'N/A' },
  ];

  return (
    <section id="property" className="section-card">
      <div className="section-header">Property Details</div>
      <div className="property-details-grid">
  <DetailColumn items={keyDates} columnTitle="Key Dates" />
  <DetailColumn items={location} columnTitle="Location" />
  <DetailColumn items={building} columnTitle="Building" />
      </div>
    </section>
  );
}

function DetailColumn({ items, columnTitle }) {
  return (
    <div className="detail-column">
      <h3 style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {columnTitle}
      </h3>
      {items.map((item, idx) => (
        <div key={idx} className="detail-item">
          <span className="detail-label">{item.label}</span>
          <span className="detail-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function TenancySection({ property }) {
  const tenants = [
    property.tenancy?.tenant1,
    property.tenancy?.tenant2,
    property.tenancy?.tenant3
  ].filter(t => t && t.name);
  
  const numTenants = property.tenancy?.numTenants || tenants.length || 0;
  const occupancyPercent = property.tenancy?.occupancyPercent || 0;
  const leaseStructure = property.tenancy?.leaseStructure || 'N/A';

  return (
    <section id="tenancy" className="section-card">
      <div className="section-header">Tenancy</div>
      <div className="tenancy-overview">
        <div className="tenancy-stat">
          <div className="tenancy-stat-value">{numTenants}</div>
          <div className="tenancy-stat-label">Tenants</div>
        </div>
        <div className="tenancy-stat">
          <div className="tenancy-stat-value">{occupancyPercent.toFixed(1)}%</div>
          <div className="tenancy-stat-label">Occupancy</div>
        </div>
        <div className="tenancy-stat">
          <div className="tenancy-stat-value">{leaseStructure}</div>
          <div className="tenancy-stat-label">Lease Type</div>
        </div>
      </div>
      <div className="tenant-cards">
        {tenants.map((tenant, idx) => (
          <div key={idx} className="tenant-card">
            <div className="tenant-name">{tenant.name || 'Tenant'}</div>
            <div className="tenant-card-content">
              <div className="tenant-detail">
                <span className="tenant-detail-label">SF Leased</span>
                <span className="tenant-detail-value">{tenant.sf ? tenant.sf.toLocaleString() : 'N/A'}</span>
              </div>
              <div className="tenant-detail">
                <span className="tenant-detail-label">% of NRA</span>
                <span className="tenant-detail-value">{tenant.percent ? `${tenant.percent.toFixed(1)}%` : 'N/A'}</span>
              </div>
              <div className="tenant-detail">
                <span className="tenant-detail-label">Expiry</span>
                <span className="tenant-detail-value">{formatDate(tenant.expiry)}</span>
              </div>
              <div className="tenant-detail">
                <span className="tenant-detail-label">Guarantee</span>
                <span className="tenant-detail-value">{tenant.guarantee || 'N/A'}</span>
              </div>
              <div className="tenant-detail">
                <span className="tenant-detail-label">Structure</span>
                <span className="tenant-detail-value">{tenant.leaseStructure || 'N/A'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StrategySection({ property }) {
  const kbis = [
    property.kbi_1,
    property.kbi_2,
    property.kbi_3,
    property.kbi_4,
  ].filter(Boolean);

  return (
    <section id="strategy" className="section-card">
      <div className="section-header">Strategy</div>
      <div className="strategy-grid">
        <div>
          <h3 className="subsection-title">Business Plan</h3>
          <div className="strategy-content">
            {property.businessPlan || property.heroSummary || 'Business plan details coming soon.'}
          </div>
        </div>
        <div>
          <h3 className="subsection-title">Key Initiatives</h3>
          <div className="kbi-list">
            {kbis.length > 0 ? (
              kbis.map((kbi, idx) => (
                <div key={idx} className="kbi-item">{kbi}</div>
              ))
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                No key initiatives specified.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function SideRail({ property, daysUntilClosing, formattedCloseDate, assetType, quarterlyPer1M, onOpenFeesModal }) {
  return (
    <aside className="side-rail">
      <div className="side-card">
        <div className="side-card-header">Deal Summary</div>
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-label">Purchase Price</div>
            <div className="summary-value">{formatLargeNumber(property.financial?.purchasePrice || property.totalValue)}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Cap Rate</div>
            <div className="summary-value">{formatPercentage(property.financial?.capRate || property.cap_rate)}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Projected IRR</div>
            <div className="summary-value">{formatPercentage(property.returns?.projectedIRR || property.projected_irr)}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Quarterly / $1M</div>
            <div className="summary-value">${formatCurrency(quarterlyPer1M, 0)}</div>
          </div>
        </div>

        <div className="summary-chips">
          <span className="chip">
            <span className="chip-label">Closing</span>
            <span className="chip-value">{formattedCloseDate}</span>
          </span>
          <span className="chip">
            <span className="chip-label">Days Left</span>
            <span className="chip-value">{daysUntilClosing}</span>
          </span>
        </div>

        <div className="summary-tags">
          {property.dealStage && <span className="property-stage-badge">{property.dealStage}</span>}
          <span className="tag">{assetType.toUpperCase()}</span>
          <span className="tag">REF: {property.referenceNumber || 'N/A'}</span>
        </div>

        <div className="cta-group">
          <a href="/hub" className="cta-button primary">Back to Marketplace</a>
          <button onClick={onOpenFeesModal} className="cta-button secondary">View Service Fees</button>
        </div>
      </div>

      <div className="side-card">
        <div className="side-card-header">Overview</div>
        <div className="side-description">
          {property.heroSummary || property.propertyHeader || 'Property description coming soon.'}
        </div>
      </div>
    </aside>
  );
}

function MoreOpportunities({ properties, onNavigate }) {
  if (properties.length === 0) return null;

  return (
    <section className="opportunities-section">
      <div className="section-header">More Opportunities</div>
      <div className="opportunities-grid">
        {properties.map((prop) => (
          <div 
            key={prop.referenceNumber} 
            className="opportunity-card"
            onClick={() => onNavigate(prop.referenceNumber)}
          >
            <img 
              src={prop.images?.[0] || prop.image || 'https://via.placeholder.com/400x240?text=Property'} 
              alt={prop.title} 
              className="opportunity-image"
            />
            <div className="opportunity-content">
              <h3 className="opportunity-title">{prop.title || prop.property_name || 'Property'}</h3>
              <span className="opportunity-type">{getAssetType(prop.type)}</span>
              <div className="opportunity-metrics">
                <div className="opportunity-metric">
                  <div className="opportunity-metric-label">Cap Rate</div>
                  <div className="opportunity-metric-value">{formatPercentage(prop.cap_rate || 0)}</div>
                </div>
                <div className="opportunity-metric">
                  <div className="opportunity-metric-label">Price</div>
                  <div className="opportunity-metric-value">{formatLargeNumber(prop.totalValue || prop.purchase_price)}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MapModal({ isOpen, onClose, address, title }) {
  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(address)}&zoom=15&maptype=satellite`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Property Location'} maxWidth="1200px">
      <div className="map-container">
        {isOpen && (
          <iframe 
            src={mapSrc}
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy"
            title="Property Map"
          />
        )}
      </div>
    </Modal>
  );
}

function FeesModal({ isOpen, onClose, fees }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Service Fees" maxWidth="640px">
      <div className="fees-modal-body">
        {fees.length > 0 ? (
          fees.map((fee, idx) => (
            <div key={idx} className="fee-item">
              {fee.company_logo_url && (
                <div className="fee-icon">
                  <img src={fee.company_logo_url} alt={fee.company_name} />
                </div>
              )}
              <div className="fee-details">
                <div className="fee-name">{fee.company_name || 'Service Provider'}</div>
                {fee.acquisition_fee && <div className="fee-rate">Acquisition: {formatPercentage(fee.acquisition_fee, 2)}</div>}
                {fee.asset_management_fee && <div className="fee-rate">Asset Management: {formatPercentage(fee.asset_management_fee, 2)}</div>}
                {fee.property_management_fee && <div className="fee-rate">Property Management: {formatPercentage(fee.property_management_fee, 2)}</div>}
                {fee.disposition_fee && <div className="fee-rate">Disposition: {formatPercentage(fee.disposition_fee, 2)}</div>}
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            No fee information available.
          </div>
        )}
      </div>
      <div className="fees-modal-disclaimer">Fees subject to change; see offering docs.</div>
    </Modal>
  );
}
