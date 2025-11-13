import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../styles/sebase.css';

export default function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [latestExchange, setLatestExchange] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exchangeDropdownOpen, setExchangeDropdownOpen] = useState(false);
  const [holdingsDropdownOpen, setHoldingsDropdownOpen] = useState(false);
  const [aboutDropdownOpen, setAboutDropdownOpen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/se/current-user/', {
          credentials: 'include'
        });
        if (response.ok) {
          // User is authenticated
          const userData = await response.json();
          setIsAuthenticated(true);
          setUser(userData);

          // Fetch latest exchange ID, but don't let failures flip auth state
          try {
            const exchangeResponse = await fetch('/SE/api/user-exchange-ids/', {
              credentials: 'include'
            });
            if (exchangeResponse.ok) {
              const ct = exchangeResponse.headers.get('content-type') || '';
              if (ct.includes('application/json')) {
                const exchanges = await exchangeResponse.json();
                const exchangeIds = exchanges.exchange_ids || [];
                if (exchangeIds.length > 0) {
                  setLatestExchange(exchangeIds[0]);
                }
              }
            }
          } catch (e) {
            // ignore exchange id errors
            console.debug('exchange ids fetch skipped/failed');
          }
        } else if (response.status === 401 || response.status === 403) {
          // User not authenticated
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Do not forcibly set to logged out on transient errors; keep prior state
      }
    };
    checkAuth();
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (!mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
  };

  const toggleMobileDropdown = (dropdown) => {
    switch(dropdown) {
      case 'exchange':
        setExchangeDropdownOpen(!exchangeDropdownOpen);
        break;
      case 'holdings':
        setHoldingsDropdownOpen(!holdingsDropdownOpen);
        break;
      case 'about':
        setAboutDropdownOpen(!aboutDropdownOpen);
        break;
    }
  };

  const isStaff = user?.is_staff || user?.user_type === 'admin' || 
                  user?.user_type === 'staff' || user?.user_type === 'property_broker';

  const getFirstName = () => {
    return user?.first_name || user?.username || 'User';
  };

  const getPossessiveHoldings = () => {
    const firstName = getFirstName();
    return firstName.endsWith('s') ? `${firstName}' Holdings` : `${firstName}'s Holdings`;
  };

  return (
    <>
      {/* Top Banner */}
      <div className="top-banner">
        <span>
          <img src="/static/yellowphone.png" className="nav-phone" alt="Phone" />
          1031 Emergency Hotline: 
          <strong>
            <a href="tel:+15164645550">(516) 464-5550</a>
          </strong>
        </span>
        <span>
          <img src="/static/lock.webp" className="nav-lock" alt="Lock" />
          Advisor Login | Financial Professional Support
        </span>
      </div>

      {/* Main Navigation */}
      <nav id="navbar">
        <div className="nav-left">
          <Link to="/SE/" className="logo">
            <img src="/static/simple1031white.svg" alt="Simple1031™" className="logo-img" />
          </Link>
        </div>

        <div className="nav-right">
          {/* Marketplace Link */}
          <Link to="/SE/Hub" className="nav-link" id="marketplace-btn">
            <span className="nav-number">
              <img src="/static/IC_MarketHub.svg" alt="Market" />
            </span>
            Marketplace
          </Link>

          {/* My Exchange Dropdown */}
          <div className="dropdown">
            <span className="nav-text">
              <span className="nav-number">
                <img src="/static/IC_MyExchange.svg" alt="Exchange" />
              </span>
              My Exchange
            </span>
            <div className="dropdown-content">
              {isAuthenticated && latestExchange && (
                <div style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  padding: '0.75rem 1rem', 
                  borderBottom: '1px solid rgba(255,255,255,0.2)' 
                }}>
                  <div style={{ 
                    fontSize: '0.65rem', 
                    color: '#A39CE1', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px', 
                    marginBottom: '0.25rem' 
                  }}>
                    Active Exchange ID
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFC107' }}>
                    {latestExchange.exchange_id}
                  </div>
                </div>
              )}
              <Link to="/SE/replacement">Replacement Candidates</Link>
              <Link to="/SE/identified">45 Day Identified</Link>
              <Link to="/SE/Dashboard">My Dashboard</Link>
              <Link to="/SE/Dashboard">The TICShelf<sup>™</sup></Link>
            </div>
          </div>

          {/* My Holdings Dropdown */}
          <div className="dropdown">
            <span className="nav-text">
              <span className="nav-number">
                <img src="/static/IC_MyHoldings.svg" alt="Holdings" />
              </span>
              {isAuthenticated ? getPossessiveHoldings() : 'My Holdings'}
            </span>
            <div className="dropdown-content">
              <Link to="/SE/Assets">My Assets</Link>
              <Link to="/SE/Profile">My Profile</Link>
            </div>
          </div>

          {/* About Dropdown */}
          <div className="dropdown">
            <span className="nav-text">About</span>
            <div className="dropdown-content third">
              <div className="dropdown-header">Process Overview</div>
              <Link to="/SE/Pure">
                <span className="dropdown-pronouns">Us:</span> PurePlay: OwnDeed<sup>™</sup>
              </Link>
              <Link to="/SE/Sins">
                <span className="dropdown-pronouns">Them:</span> DST Handcuffs<sup>™</sup>
              </Link>
              <Link to="/SE/IRS">
                <span className="dropdown-pronouns">They:</span> IRS Process
              </Link>
              <Link to="/SE/Newsletter">Newsletter | Blogs</Link>
              
              <div className="dropdown-header about-us-header">About Us</div>
              <a href="/SE/">Discover SimpleCITI<sup>™</sup></a>
              <Link to="/SE/Alpha">AlphaWinners<sup>™</sup></Link>
              <Link to="/SE/leadership">Leadership</Link>
              <a href="https://apply.workable.com/simpleciti/" target="_blank" rel="noopener noreferrer">
                Careers
              </a>
              <Link to="/SE/contact">Talk To Us</Link>
            </div>
          </div>

          {/* Admin/Auth Section */}
          {isAuthenticated ? (
            isStaff ? (
              <div className="dropdown admin-dropdown">
                <div className="admin-btn">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span>Admin</span>
                    <span className="admin-user">{getFirstName()}</span>
                  </div>
                </div>
                <div className="dropdown-content">
                  <Link to="/SE/PD">Property Database</Link>
                  <Link to="/SE/Clients">Client CRM</Link>
                </div>
              </div>
            ) : null
          ) : (
            <Link to="/SE/login" className="nav-link">Sign Up | Login</Link>
          )}
        </div>
      </nav>

      {/* Mobile Menu Toggle Button */}
      <button 
        className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`} 
        id="mobileMenuToggle" 
        aria-label="Toggle menu"
        onClick={toggleMobileMenu}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile Navigation Overlay */}
      <div 
        className={`mobile-nav-overlay ${mobileMenuOpen ? 'active' : ''}`} 
        id="mobileNavOverlay"
        onClick={closeMobileMenu}
      ></div>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-nav-menu ${mobileMenuOpen ? 'active' : ''}`} id="mobileNavMenu">
        {/* Mobile Nav Header */}
        <div className="mobile-nav-header">
          <img src="/static/simpleexchangewhite.svg" alt="Simple1031™" />
          <button className="mobile-nav-close" id="mobileNavClose" onClick={closeMobileMenu}>
            &times;
          </button>
        </div>

        {/* User Section */}
        {isAuthenticated && (
          <div className="mobile-nav-user">
            <div className="user-avatar-letter">
              {getFirstName().charAt(0).toUpperCase()}
            </div>
            <div className="mobile-nav-user-info">
              <h4>{getFirstName()}</h4>
              <p>{user?.email}</p>
            </div>
          </div>
        )}

        {/* Emergency Hotline */}
        <div className="mobile-emergency-banner">
          <strong>1031 Emergency Hotline</strong>
          <a href="tel:+15164645550">
            <img src="/static/yellowphone.png" style={{ height: '1.5rem', width: 'auto' }} alt="Phone" />
            (516) 464-5550
          </a>
        </div>

        {/* Navigation Links */}
        <div className="mobile-nav-links">
          {/* MarketHub */}
          <div className="mobile-nav-section">
            <div className="mobile-nav-section-title">
              <span className="nav-number">1</span> MARKETPLACE
            </div>
            <Link to="/SE/Hub" className="mobile-nav-link" onClick={closeMobileMenu}>
              MarketHub
            </Link>
          </div>

          {/* My Exchange */}
          <div className="mobile-nav-section">
            <div className="mobile-nav-section-title">
              <span className="nav-number">2</span> MY EXCHANGE
            </div>
            <div className="mobile-nav-dropdown">
              <button 
                className={`mobile-nav-dropdown-toggle ${exchangeDropdownOpen ? 'active' : ''}`}
                onClick={() => toggleMobileDropdown('exchange')}
              >
                <span>My Exchange</span>
                <span className="mobile-nav-dropdown-arrow">▼</span>
              </button>
              <div className={`mobile-nav-dropdown-content ${exchangeDropdownOpen ? 'active' : ''}`}>
                {isAuthenticated && latestExchange && (
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '0.75rem 1rem 0.75rem 3.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{
                      fontSize: '0.65rem',
                      color: '#A39CE1',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '0.25rem'
                    }}>
                      Active Exchange ID
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFC107' }}>
                      {latestExchange.exchange_id}
                    </div>
                  </div>
                )}
                <Link to="/SE/replacement" onClick={closeMobileMenu}>Replacement Candidates</Link>
                <Link to="/SE/identified" onClick={closeMobileMenu}>45 Day Identified</Link>
                <Link to="/SE/Dashboard" onClick={closeMobileMenu}>My Dashboard</Link>
                <Link to="/SE/Dashboard" onClick={closeMobileMenu}>1031 Shelf<sup>™</sup></Link>
              </div>
            </div>
          </div>

          {/* My Holdings */}
          <div className="mobile-nav-section">
            <div className="mobile-nav-section-title">
              <span className="nav-number">3</span> MY HOLDINGS
            </div>
            <div className="mobile-nav-dropdown">
              <button 
                className={`mobile-nav-dropdown-toggle ${holdingsDropdownOpen ? 'active' : ''}`}
                onClick={() => toggleMobileDropdown('holdings')}
              >
                <span>{isAuthenticated ? getPossessiveHoldings() : 'My Holdings'}</span>
                <span className="mobile-nav-dropdown-arrow">▼</span>
              </button>
              <div className={`mobile-nav-dropdown-content ${holdingsDropdownOpen ? 'active' : ''}`}>
                <Link to="/SE/Assets" onClick={closeMobileMenu}>My Assets</Link>
                <Link to="/SE/Profile" onClick={closeMobileMenu}>My Profile</Link>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="mobile-nav-section">
            <div className="mobile-nav-section-title">ABOUT</div>
            <div className="mobile-nav-dropdown">
              <button 
                className={`mobile-nav-dropdown-toggle ${aboutDropdownOpen ? 'active' : ''}`}
                onClick={() => toggleMobileDropdown('about')}
              >
                <span>About Simple1031™</span>
                <span className="mobile-nav-dropdown-arrow">▼</span>
              </button>
              <div className={`mobile-nav-dropdown-content ${aboutDropdownOpen ? 'active' : ''}`}>
                <Link to="/SE/Sins" onClick={closeMobileMenu}>DST Risks</Link>
                <Link to="/SE/IRS" onClick={closeMobileMenu}>IRS Process</Link>
                <Link to="/SE/Alpha" onClick={closeMobileMenu}>Alpha Winners</Link>
                <Link to="/SE/Pure" onClick={closeMobileMenu}>Pure Play Newsletter</Link>
                <Link to="/SE/leadership" onClick={closeMobileMenu}>Leadership</Link>
                <Link to="/SE/contact" onClick={closeMobileMenu}>Talk To Us</Link>
              </div>
            </div>
          </div>

          {/* Admin Section (staff only) */}
          {isAuthenticated && isStaff && (
            <div className="mobile-admin-section">
              <h4>Admin Panel</h4>
              <Link to="/SE/PD" onClick={closeMobileMenu}>Property Database</Link>
              <Link to="/SE/Clients" onClick={closeMobileMenu}>Client CRM</Link>
            </div>
          )}

          {/* Guest Login */}
          {!isAuthenticated && (
            <div className="mobile-nav-section">
              <Link to="/SE/login" className="mobile-nav-link" onClick={closeMobileMenu}>Sign Up | Login</Link>
            </div>
          )}
        </div>

        {/* SimpleCITI Footer */}
        <div className="mobile-simpleciti-footer">
          <p>Meet SimpleCITI Ecosystem</p>
          <a href="/">
            <img src="/static/scclogo.png" alt="SimpleCITI" />
          </a>
        </div>
      </div>
    </>
  );
}

