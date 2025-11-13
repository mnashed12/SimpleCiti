import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/deals.css';

export default function Hub() {
  const [properties, setProperties] = useState([]);
  const [userExchangeIds, setUserExchangeIds] = useState([]);
  const [userLikes, setUserLikes] = useState({});
  const [selectedPropertyForLike, setSelectedPropertyForLike] = useState(null);
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [selectedExchangeId, setSelectedExchangeId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('marketplace-page');
    loadProperties();
    loadUserData();

    return () => {
      document.body.classList.remove('marketplace-page');
    };
  }, []);

  const loadProperties = async () => {
    try {
      const response = await fetch('/api/properties/');
      
      if (!response.ok) {
        const text = await response.text();
        console.error('Properties API error:', response.status, text.substring(0, 500));
        return;
      }
      
      const data = await response.json();
      console.log('Properties loaded:', data);
      
      if (data.properties) {
        setProperties(data.properties);
      } else if (Array.isArray(data)) {
        setProperties(data);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const loadUserData = async () => {
    try {
      // Load exchange IDs (requires auth)
      const exchangeResponse = await fetch('/SE/api/user-exchange-ids/', {
        credentials: 'include'
      });
      
      if (exchangeResponse.ok) {
        const exchangeData = await exchangeResponse.json();
        setUserExchangeIds(exchangeData.exchange_ids || []);
      } else if (exchangeResponse.status === 401 || exchangeResponse.status === 403) {
        // User not authenticated - that's ok
        console.log('User not authenticated, skipping user data');
        return;
      }

      // Load user likes (requires auth)
      const likesResponse = await fetch('/SE/api/user-likes/', {
        credentials: 'include'
      });
      
      if (likesResponse.ok) {
        const likesData = await likesResponse.json();
        setUserLikes(likesData.likes || {});
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const calculateDaysUntilClosing = (closeDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const close = new Date(closeDate);
    close.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((close - today) / (1000 * 3600 * 24)));
  };

  const formatClosingDate = (closeDate) => {
    const date = new Date(closeDate);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const formatLargeNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return num.toString();
  };

  const handlePropertyClick = (propertyId, event) => {
    // Don't navigate if clicking on like button or address link
    if (event.target.closest('.like-button') || event.target.closest('.property-address-link')) {
      return;
    }
    navigate(`/deal-detail/${propertyId}`);
  };

  const showExchangeModal = (propertyId, event) => {
    event.stopPropagation();
    event.preventDefault();
    
    if (userExchangeIds.length === 0) {
      alert('Please create an Exchange ID first at /enrollment/');
      return;
    }
    
    setSelectedPropertyForLike(propertyId);
    setExchangeModalOpen(true);
  };

  const closeExchangeModal = () => {
    setExchangeModalOpen(false);
    setSelectedPropertyForLike(null);
    setSelectedExchangeId('');
  };

  const confirmPropertyLike = async () => {
    if (!selectedExchangeId) {
      alert('Please select an Exchange ID');
      return;
    }

    try {
      const response = await fetch('/SE/api/like-property/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken()
        },
        credentials: 'include',
        body: JSON.stringify({
          property_id: selectedPropertyForLike,
          exchange_id: selectedExchangeId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update local likes
        setUserLikes(prev => ({
          ...prev,
          [selectedPropertyForLike]: [...(prev[selectedPropertyForLike] || []), parseInt(selectedExchangeId)]
        }));
        
        closeExchangeModal();
        showNotification(data.message || 'Property added to your exchange!');
      } else {
        alert(data.error || 'Error adding property');
      }
    } catch (error) {
      console.error('Error liking property:', error);
      alert('Error adding property. Please try again.');
    }
  };

  const getCsrfToken = () => {
    return document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];
  };

  const showNotification = (message) => {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4a7c59;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const isPropertyLiked = (propertyId) => {
    return userLikes[propertyId] && userLikes[propertyId].length > 0;
  };

  const totalAvailable = properties.reduce((sum, p) => {
    const target = p.target_equity || p.targetEquity || 0;
    const current = p.current_funding || p.currentFunding || 0;
    return sum + (target - current);
  }, 0);

  return (
    <>
      <div className="container">
        {/* Hero Banner */}
        <div className="hero-banner">
          <div className="hero-content">
            <div className="totals">
              <h1 className="summary-card-header">Summary Cards</h1>
              <span id="liveDealsTotal">${(totalAvailable / 1000000).toFixed(2)}M Available |</span>
              <span id="liveDealsCount"> {properties.length}</span> Deals
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="properties-grid">
          {properties.map(property => {
            const days = calculateDaysUntilClosing(property.close_date || property.closeDate);
            const closeDate = formatClosingDate(property.close_date || property.closeDate);
            const imageUrl = (property.images && property.images.length > 0) 
              ? property.images[0] 
              : property.image_url || 'https://via.placeholder.com/800x600?text=Property';
            
            const inPlaceNoi = property.current_noi || 0;
            const capRate = property.cap_rate || 0;
            const totalValue = property.purchase_price || 0;
            const projectedIrr = property.projected_irr || 0;
            const cashFlow = property.per_100k || 0;
            const cashOnCash = property.est_cash_on_cash || 0;

            return (
              <div 
                key={property.id || property.reference_number} 
                className="property-card" 
                onClick={(e) => handlePropertyClick(property.reference_number || property.id, e)}
              >
                <div className="property-image-container">
                  <img src={imageUrl} alt={property.title || property.property_name} />
                  
                  {/* Like Button */}
                  <div className="like-button-container">
                    <button 
                      className={`like-button ${isPropertyLiked(property.id || property.reference_number) ? 'liked' : ''}`}
                      data-property-id={property.id || property.reference_number}
                      onClick={(e) => showExchangeModal(property.reference_number || property.id, e)}
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </button>
                  </div>

                  {/* Badges */}
                  <div className="property-badges">
                    <div className="badge-closing">
                      <div className="badge-label">CLOSING DATE</div>
                      <div className="badge-value">{closeDate} IN {days} DAYS</div>
                    </div>
                  </div>

                  {/* KBI Badge */}
                  {(property.kbi_1 || property.kbi_2 || property.kbi_3 || property.kbi_4) && (
                    <div className="badge-kbis">
                      <div className="badge-label">KEY BUSINESS INITIATIVES</div>
                      <div className="badge-value">
                        {property.kbi_1 && <div>{property.kbi_1}</div>}
                        {property.kbi_2 && <div>{property.kbi_2}</div>}
                        {property.kbi_3 && <div>{property.kbi_3}</div>}
                        {property.kbi_4 && <div>{property.kbi_4}</div>}
                      </div>
                    </div>
                  )}

                  {/* Property Info Overlay */}
                  <div className="property-info-overlay">
                    <div className="property-title-row">
                      <div className="property-name">{property.title || property.property_name}</div>
                    </div>
                    
                    <div className="property-stats-container">
                      {/* Row 1: Asset Investment */}
                      <div className="stats-section">
                        <div className="section-header">ASSET INVESTMENT</div>
                        <div className="stats-row">
                          <div className="stat-box">
                            <div className="stat-main">
                              <span className="stat-number">${formatLargeNumber(totalValue)}</span>
                            </div>
                          </div>
                          <div className="stat-box">
                            <div className="stat-main">
                              <span className="stat-number">${formatLargeNumber(inPlaceNoi)}</span>
                            </div>
                          </div>
                          <div className="stat-box">
                            <div className="stat-main">
                              <span className="stat-number">{parseFloat(capRate).toFixed(1)} %</span>
                            </div>
                          </div>
                          <div className="stat-box">
                            <div className="stat-main">
                              <span className="stat-number">{parseFloat(projectedIrr).toFixed(1)} %</span>
                            </div>
                          </div>
                        </div>
                        <div className="stats-labels-row">
                          <div className="stat-label">ACQUISITION</div>
                          <div className="stat-label">IN PLACE NOI</div>
                          <div className="stat-label">CAP RATE</div>
                          <div className="stat-label">PROJ IRR (5YR)</div>
                        </div>
                      </div>

                      {/* Row 2: Owner Cash Flow */}
                      <div className="stats-section">
                        <div className="section-header">
                          OWNER CASH FLOW - PAID {property.distribution_frequency || 'MONTHLY'}
                        </div>
                        <div className="stats-row">
                          <div className="stat-box">
                            <div className="stat-main">
                              <span className="stat-number">
                                ${formatLargeNumber(cashFlow * 1000)} <span className="year">/ YR</span>
                              </span>
                            </div>
                          </div>
                          <div className="stat-box">
                            <div className="stat-main">
                              <span className="stat-number">
                                ${formatLargeNumber(cashFlow)}<span className="year">/ YR</span>
                              </span>
                            </div>
                          </div>
                          <div className="stat-box">
                            <div className="stat-main">
                              <span className="stat-number">{parseFloat(cashOnCash).toFixed(2)} %</span>
                            </div>
                          </div>
                        </div>
                        <div className="stats-labels-row2">
                          <div className="stat-label">EST. COUPON</div>
                          <div className="stat-label">PER 100K</div>
                          <div className="stat-label">CASH ON CASH</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Exchange ID Selection Modal */}
      <div 
        className={`exchange-select-modal ${exchangeModalOpen ? 'active' : ''}`}
        onClick={(e) => e.target.classList.contains('exchange-select-modal') && closeExchangeModal()}
      >
        <div className="exchange-select-content">
          <h3>Select Exchange ID</h3>
          <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Choose which exchange to add this property to:
          </p>
          <select 
            value={selectedExchangeId} 
            onChange={(e) => setSelectedExchangeId(e.target.value)}
          >
            <option value="">Select an Exchange ID...</option>
            {userExchangeIds.map(ex => (
              <option key={ex.id} value={ex.id}>
                {ex.exchange_id}
              </option>
            ))}
          </select>
          <div className="exchange-select-buttons">
            <button className="btn-cancel" onClick={closeExchangeModal}>Cancel</button>
            <button className="btn-confirm" onClick={confirmPropertyLike}>Add Property</button>
          </div>
        </div>
      </div>
    </>
  );
}
