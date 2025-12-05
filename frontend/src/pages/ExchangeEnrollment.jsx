// ...existing code...
import React, { useState, useEffect, useRef } from 'react';
import '../styles/ExchangeEnrollment.css';
import exchangePass from '../assets/exchangepassbg.png';


// Inject Chewy, Bubblegum Sans, EB Garamond, Lora, Inter fonts and FontAwesome from Google Fonts
if (typeof document !== 'undefined') {
  const chewyLink = document.createElement('link');
  chewyLink.rel = 'stylesheet';
  chewyLink.href = 'https://fonts.googleapis.com/css2?family=Chewy&display=swap';
  document.head.appendChild(chewyLink);
  const bubblegumLink = document.createElement('link');
  bubblegumLink.rel = 'stylesheet';
  bubblegumLink.href = 'https://fonts.googleapis.com/css2?family=Bubblegum+Sans&display=swap';
  document.head.appendChild(bubblegumLink);
  const garamondLink = document.createElement('link');
  garamondLink.rel = 'stylesheet';
  garamondLink.href = 'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@700&display=swap';
  document.head.appendChild(garamondLink);
  const loraLink = document.createElement('link');
  loraLink.rel = 'stylesheet';
  loraLink.href = 'https://fonts.googleapis.com/css2?family=Lora:wght@400;700&display=swap';
  document.head.appendChild(loraLink);
  const interLink = document.createElement('link');
  interLink.rel = 'stylesheet';
  interLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap';
  document.head.appendChild(interLink);
  const fontAwesome = document.createElement('link');
  fontAwesome.rel = 'stylesheet';
  fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
  document.head.appendChild(fontAwesome);
}

function fmt(v) {
  if (!isFinite(v)) return '0.00';
  return Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function addDays(dateStr, days) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString();
}

// Comma-formatting for detailed calculator fields
function handleDetailedNumberInput(e, setter) {
  let val = e.target.value.replace(/,/g, '');
  if (!/^-?\d*(\.\d{0,2})?$/.test(val)) return;
  if (val) {
    const [intPart, decPart] = val.split('.');
    val = parseInt(intPart, 10).toLocaleString();
    if (decPart !== undefined) val += '.' + decPart;
  }
  setter(val);
}

export default function ExchangeEnrollment() {
  const [touched, setTouched] = useState({ sale: false, closing: false, debt: false, address: false, closingDate: false });
  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [showResults, setShowResults] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/se/current-user/', {
          credentials: 'include'
        });
        setIsAuthenticated(response.ok);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  // Load Google Places API and initialize autocomplete
  useEffect(() => {
    // Load Google Places API script
    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        initAutocomplete();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDSekL7sUKpBHSeA60dOsL7lf6sflnsPpc&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initAutocomplete;
      document.head.appendChild(script);
    };

    const initAutocomplete = () => {
      if (!addressInputRef.current || !window.google) return;

      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        {
          types: ['address'],
          componentRestrictions: { country: 'us' },
          fields: ['formatted_address', 'address_components', 'geometry']
        }
      );

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.address_components) {
          // Extract address components
          let street = '';
          let city = '';
          let state = '';
          
          place.address_components.forEach(component => {
            const types = component.types;
            
            if (types.includes('street_number')) {
              street = component.long_name + ' ';
            }
            if (types.includes('route')) {
              street += component.long_name;
            }
            if (types.includes('locality')) {
              city = component.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
              state = component.short_name; // Use short_name for state abbreviation
            }
          });
          
          // Format as: Street\nCity, State (excluding ZIP and country)
          const formattedAddr = street + '\n' + city + ', ' + state;
          
          setAddress(formattedAddr);
          setTouched(t => ({ ...t, address: true }));
        }
      });
    };

    loadGoogleMapsScript();

    return () => {
      if (autocompleteRef.current && window.google) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  // Form fields
  const [sale, setSale] = useState('');
  const [closing, setClosing] = useState('');
  const [debt, setDebt] = useState('');
  const [address, setAddress] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [result, setResult] = useState(null);

  // Exchange ID tracking
  const [exchangeId, setExchangeId] = useState(null); // E-1004-01 format
  const [exchangeRecordId, setExchangeRecordId] = useState(null); // Database ID
  const [apiError, setApiError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Account creation fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountCreationError, setAccountCreationError] = useState(null);
  const [accountCreated, setAccountCreated] = useState(false);
  const [clientInfo, setClientInfo] = useState(null); // {client_id, client_alias}

  // Format currency input with commas
  const formatCurrency = (value) => {
    if (!value) return '';
    const num = value.replace(/,/g, '');
    if (!/^\d*\.?\d*$/.test(num)) return value;
    const parts = num.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const handleInput = (value, setter) => {
    const formatted = formatCurrency(value);
    setter(formatted);
  };

  const parseValue = (value) => {
    return parseFloat(value.replace(/,/g, '')) || 0;
  };

  // Calculation logic
  const isValid = sale && closing && debt && address && closingDate;

  async function handleCalculate() {
    setTouched({ sale: true, closing: true, debt: true, address: true, closingDate: true });
    if (!isValid) {
      return;
    }

    const saleNum = parseValue(sale);
    const closingNum = parseValue(closing);
    const debtNum = parseValue(debt);

    const replacementValueRequired = saleNum - closingNum;
    const equityRequired = replacementValueRequired - debtNum;
    const debtRequired = debtNum;

    setResult({
      replacementValueRequired,
      equityRequired,
      debtRequired
    });

    // Generate or Update Exchange ID via backend API
    try {
      // If exchangeRecordId exists, update it; otherwise create new
      const endpoint = exchangeRecordId 
        ? `/api/se/update-exchange-id/${exchangeRecordId}/`
        : '/api/se/generate-exchange-id/';
      
      const response = await fetch(endpoint, {
        method: exchangeRecordId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sale_price: saleNum,
          equity_rollover: equityRequired,
          closing_date: closingDate
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate Exchange ID');
      }

      const data = await response.json();
      setExchangeId(data.exchange_id);
      setExchangeRecordId(data.record_id);
      setApiError(null);

      // If user is authenticated, automatically link the Exchange ID to their account
      if (isAuthenticated) {
        try {
          // Get CSRF token from cookie
          const getCookie = (name) => {
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
          };
          
          const csrftoken = getCookie('csrftoken');
          
          const linkResponse = await fetch('/api/se/link-exchange-to-user/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken
            },
            credentials: 'include',
            body: JSON.stringify({
              exchange_record_id: data.record_id
            })
          });

          if (linkResponse.ok) {
            const linkData = await linkResponse.json();
            setClientInfo({
              client_id: linkData.client_id,
              client_alias: linkData.client_alias,
              exchange_id: linkData.exchange_id
            });
            setAccountCreated(true); // Mark as "linked" to show success
          }
        } catch (linkError) {
          console.error('Error linking Exchange ID:', linkError);
          // Don't show error - user can still use the Exchange ID
        }
      }
    } catch (error) {
      console.error('Error generating Exchange ID:', error);
      setApiError('Failed to generate Exchange ID. Please try again.');
    }
    
    // Show results section with slide animation
    setShowResults(true);
    // Auto-show account section to slide out with exchange-pass
    setShowAccount(true);
  };

  const formatResult = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Account creation handler
  async function handleCreateAccount(e) {
    e.preventDefault();
    setAccountCreationError(null);

    // Validate fields
    if (!email || !firstName || !lastName || !password || !confirmPassword) {
      setAccountCreationError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setAccountCreationError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setAccountCreationError('Password must be at least 8 characters');
      return;
    }

    if (!exchangeRecordId) {
      setAccountCreationError('Exchange ID not found. Please calculate first.');
      return;
    }

    try {
      const response = await fetch('/api/se/create-account-and-link-exchange/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName,
          phone: phone || '',
          password,
          exchange_record_id: exchangeRecordId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }

      // Success! Store client info
      setClientInfo({
        client_id: data.client_id,
        client_alias: data.client_alias,
        exchange_id: data.exchange_id
      });
      setAccountCreated(true);
      setAccountCreationError(null);
    } catch (error) {
      console.error('Error creating account:', error);
      setAccountCreationError(error.message || 'Failed to create account. Please try again.');
    }
  }

  // Render front form component (reusable)
  const renderFrontForm = (isExpanded = false) => (
    <div style={{
      padding: 16,
      background: '#fff',
      color: '#fff',
      borderRadius: 16
    }}>
      {/* Asset Out pill */}
      <span style={{ position: 'absolute', top: 6, right: 6, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dbeafe', color: '#1e40af', padding: '6px 16px', borderRadius: 9999, fontSize: '0.92rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', zIndex: 2 }}>
        Asset Out
        <span style={{ display: 'inline-block', width: 18, height: 18 }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 15V3M9 3L4 8M9 3L14 8" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
      </span>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="10" fill="#fff" stroke="#0f172a" strokeWidth="2"/>
            <path d="M7 7L15 15M15 7L7 15" stroke="#0f172a" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0, fontFamily: 'EB Garamond, Lora, serif', display: 'inline-block' }}>Create 1031 Exchange Plan</h3>
            <div style={{ position: 'absolute', left: 0, right: 0, top: '2.2em', height: '3px', width: '100%' }}>
              <div style={{ width: '100%', height: '3px', background: '#181a2a', borderRadius: '2px' }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: isExpanded ? 9 : 0 }}>
        <span style={{ marginLeft: 180, fontSize: '1rem', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 0, display: 'block', textAlign: 'center', color: 'red', }}>
          Relinquished Property
        </span>
        
        {/* Sale Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <label style={{ minWidth: 160, fontSize: '1rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 0 }}>
            GROSS SALE PRICE
          </label>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 700, fontSize: '1.25rem' }}>$</span>
            <input
              type="text"
              value={sale}
              onChange={(e => { handleInput(e.target.value, setSale); setTouched(t => ({ ...t, sale: true })); })}
              placeholder="0"
              required
              style={{ width: '100%', height: 48, paddingLeft: 48, paddingRight: 16, fontSize: '1.35rem', fontWeight: 700, background: '#fff', color: '#181a2a', border: `2px solid ${touched.sale && !sale ? 'red' : '#cbd5e1'}`, borderRadius: 14, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', boxShadow: 'none', textAlign: 'right' }}
              onFocus={(e => e.target.style.borderColor = '#3b82f6')}
            />
          </div>
        </div>

        {/* Closing Costs */}
        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 16 }}>
          <label style={{ minWidth: 160, fontSize: '1rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 0 }}>
            - CLOSING COSTS
          </label>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 700, fontSize: '1.25rem' }}>$</span>
            <input
              type="text"
              value={closing}
              onChange={(e => { handleInput(e.target.value, setClosing); setTouched(t => ({ ...t, closing: true })); })}
              placeholder="0"
              required
              style={{ width: '100%', height: 48, paddingLeft: 48, paddingRight: 16, fontSize: '1.35rem', fontWeight: 700, background: '#fff', color: '#181a2a', border: `2px solid ${touched.closing && !closing ? 'red' : '#cbd5e1'}`, borderRadius: 14, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', boxShadow: 'none', textAlign: 'right' }}
              onFocus={(e => e.target.style.borderColor = '#3b82f6')}
            />
          </div>
        </div>
        
        {/* Net Sale Price */}
        {result && (
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 14, minWidth: 0, width: '100%', padding: '0', color: '#181a2a', gap: 16, margin: '2px 0', boxSizing: 'border-box', boxShadow: 'none', height: 48, paddingRight: 0 }}>
            <label style={{ minWidth: 160, fontSize: '1rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 0 }}>
              = NET SALE PRICE
            </label>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 700, fontSize: '1.25rem' }}></span>
              <input
                type="text"
                value={formatResult(result.replacementValueRequired)}
                readOnly
                style={{ width: '100%', height: 48, paddingLeft: 48, paddingRight: 16, fontSize: '1.35rem', fontWeight: 700, background: '#fff', color: '#181a2a', borderRadius: 14, outline: 'none', boxSizing: 'border-box', boxShadow: 'none', pointerEvents: 'none', textAlign: 'right' }}
              />
            </div>
          </div>
        )}

        {/* Debt Paid Off */}
        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 16 }}>
          <label style={{ minWidth: 160, fontSize: '1rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 0 }}>
            - DEBT PAID OFF
          </label>
          <div style={{ position: 'relative', flex: 1 }}>
            <span style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 700, fontSize: '1.25rem' }}>$</span>
            <input
              type="text"
              value={debt}
              onChange={(e => { handleInput(e.target.value, setDebt); setTouched(t => ({ ...t, debt: true })); })}
              placeholder="0"
              required
              style={{ width: '100%', height: 48, paddingLeft: 48, paddingRight: 16, fontSize: '1.35rem', fontWeight: 700, background: '#fff', color: '#181a2a', border: `2px solid ${touched.debt && !debt ? 'red' : '#cbd5e1'}`, borderRadius: 14, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', boxShadow: 'none', textAlign: 'right' }}
              onFocus={(e => e.target.style.borderColor = '#3b82f6')}
            />
          </div>
        </div>
        
        {/* Net Equity */}
        {result && (
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 14, minWidth: 0, width: '100%', padding: '0', gap: 16, color: '#181a2a', boxSizing: 'border-box', boxShadow: 'none', height: 48 }}>
            <label style={{ minWidth: 160, fontSize: '1rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 0 }}>
              = NET EQUITY
            </label>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 700, fontSize: '1.25rem' }}></span>
              <input
                type="text"
                value={formatResult(result.equityRequired)}
                readOnly
                style={{ width: '100%', height: 48, paddingLeft: 48, paddingRight: 16, fontSize: '1.35rem', fontWeight: 700, background: '#fff', color: '#181a2a', borderRadius: 14, outline: 'none', boxSizing: 'border-box', boxShadow: 'none', pointerEvents: 'none', textAlign: 'right' }}
              />
            </div>
          </div>
        )}
        
        {/* Red line */}
        <div style={{ width: '100%', height: '4px', background: 'red', margin: '8px 0', borderRadius: '2px' }}></div>
        
        {/* Address Field */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <label style={{ minWidth: 160, fontSize: '1rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 0 }}>
            SOLD ADDRESS
          </label>
          <div style={{ position: 'relative', flex: 1 }}>
            <textarea
              ref={addressInputRef}
              value={address}
              onChange={(e => { 
                let val = e.target.value;
                const firstComma = val.indexOf(',');
                // Check if there's a newline before the comma
                const hasNewlineBeforeComma = firstComma > 0 && val[firstComma - 1] === '\n';
                if (firstComma !== -1 && !hasNewlineBeforeComma) {
                  // Insert newline before the comma
                  val = val.slice(0, firstComma).trimEnd() + '\n' + val.slice(firstComma).trim();
                }
                setAddress(val); 
                setTouched(t => ({ ...t, address: true })); 
              })}
              placeholder="Street Address&#10;City, State ZIP"
              autoComplete="off"
              required
              rows={2}
              maxLength={100}
              style={{
                width: '100%',
                height: 58,
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 2,
                paddingBottom: 4,
                fontSize: '1.15rem',
                fontWeight: 500,
                background: '#fff',
                color: '#181a2a',
                border: `2px solid ${touched.address && !address ? 'red' : '#cbd5e1'}`,
                borderRadius: 14,
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                boxShadow: 'none',
                resize: 'none',
                overflow: 'hidden',
                lineHeight: '1.4',
                whiteSpace: 'pre-wrap'
              }}
              onFocus={(e => e.target.style.borderColor = '#3b82f6')}
            />
          </div>
        </div>
        
        {/* Closing Date Field */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <label style={{ minWidth: 160, fontSize: '1rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 0 }}>
            CLOSING DATE
          </label>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="date"
              value={closingDate}
              onChange={(e => { setClosingDate(e.target.value); setTouched(t => ({ ...t, closingDate: true })); })}
              placeholder="Select closing date..."
              required
              style={{ width: '100%', height: 48, paddingLeft: 16, paddingRight: 16, fontSize: '1.15rem', fontWeight: 500, background: '#fff', color: '#181a2a', border: `2px solid ${touched.closingDate && !closingDate ? 'red' : '#cbd5e1'}`, borderRadius: 14, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box', boxShadow: 'none' }}
              onFocus={(e => e.target.style.borderColor = '#3b82f6')}
            />
          </div>
        </div>

        {/* Calculate Button - always show */}
        <button
          type="button"
          onClick={handleCalculate}
          disabled={!isValid}
          className="s1031-btn"
          style={{
            width: '100%',
            padding: '12px 24px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            transition: 'all 0.2s',
            border: '2px solid #fff',
            cursor: isValid ? 'pointer' : 'not-allowed',
            background: '#0f172a',
            color: '#fff',
            boxShadow: isValid ? '0 4px 12px rgba(15,23,42,0.2)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginTop: 0
          }}
        >
          <span>{showResults ? 'Recalculate' : 'Show My Exchange Plan'}</span>
        </button>
      </div>
    </div>
  );

  // Render back results component (reusable)
  const renderBackResults = () => (
    <div style={{
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      background: 'transparent',
      border: 'none',
      margin: 0,
      width: '100%'
    }}>
      {/* Badge Card */}
      <div style={{
        backgroundImage: `url(${exchangePass})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        width: '100%',
        maxWidth: 700,
        aspectRatio: '1.15/1',
        position: 'relative',
        margin: 0
      }}>
        {/* Header Row with Underline */}
        <div style={{
          position: 'absolute',
          top: '48%',
          left: '15%',
          right: '15%',
          display: 'flex',
          gap: 24,
          paddingBottom: 12,
          borderBottom: '2px solid #cbd5e1'
        }}>
          {/* Left Column Header - SPENDING PLAN */}
          <div style={{ flex: 1, paddingRight: 24 }}>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#1e293b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>SPENDING PLAN</div>
          </div>
          {/* Right Column Header - CRITICAL TIMELINE */}
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#1e293b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginLeft: 40
            }}>CRITICAL TIMELINE</div>
          </div>
        </div>

        {/* Content Row */}
        <div style={{
          position: 'absolute',
          top: 'calc(48% + 40px)',
          left: '15%',
          right: '15%',
          bottom: '15%',
          display: 'flex',
          gap: 24
        }}>
          {/* Left Column - SPENDING PLAN */}
          <div style={{ flex: 1, paddingRight: 24, borderRight: '2px solid #cbd5e1' }}>
            
            {result ? (
              <>
                {/* Acquisition Spend */}
                <div style={{ 
                  marginBottom: 10,
                  paddingBottom: 10,
                  borderBottom: '1px solid #cbd5e1',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8
                }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: '#1e293b',
                    minWidth: 100,
                    textAlign: 'left'
                  }}>AS</div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: '#1e293b',
                      lineHeight: 1
                    }}>{formatResult(result.replacementValueRequired)}+</div>
                    <div style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      marginTop: 1
                    }}>ACQUISITION SPEND -<br/>MINIMUM -OR- MORE</div>
                  </div>
                </div>

                {/* Mandatory Equity */}
                <div style={{ 
                  marginBottom: 10,
                  paddingBottom: 10,
                  borderBottom: '1px solid #cbd5e1',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8
                }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: '#1e293b',
                    minWidth: 100,
                    textAlign: 'left'
                  }}>E</div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: '#1e293b',
                      lineHeight: 1
                    }}>{formatResult(result.equityRequired)}</div>
                    <div style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      marginTop: 1
                    }}>MANDATORY EQUITY</div>
                  </div>
                </div>

                {/* Debt or More Equity */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8
                }}>
                  <div style={{
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: '#1e293b',
                    minWidth: 100,
                    textAlign: 'left'
                  }}>D or E</div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: '#1e293b',
                      lineHeight: 1
                    }}>{formatResult(result.debtRequired)}</div>
                    <div style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: '#64748b',
                      textTransform: 'uppercase',
                      marginTop: 1
                    }}>DEBT -OR- MORE EQUITY</div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                Enter values to calculate
              </div>
            )}
          </div>

          {/* Right Column - CRITICAL TIMELINE */}
          <div style={{ flex: 1 }}>
            {/* Timeline items with circles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Relinquished Date */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, position: 'relative' }}>
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#10b981',
                  flexShrink: 0,
                  marginTop: 1,
                  position: 'relative',
                  zIndex: 1
                }}></div>
                {/* Connecting line */}
                <div style={{
                  position: 'absolute',
                  left: 7,
                  top: 17,
                  width: 2,
                  height: 'calc(100% + 8px)',
                  background: '#cbd5e1'
                }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '.9rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    textTransform: 'uppercase',
                    marginBottom: 1
                  }}>RELINQUISHED</div>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#64748b'
                  }}>DATE: {closingDate || 'TBD'}</div>
                </div>
              </div>

              {/* 45-Day Identification */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, position: 'relative' }}>
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#fff',
                  border: '2px solid #94a3b8',
                  flexShrink: 0,
                  marginTop: 1,
                  position: 'relative',
                  zIndex: 1
                }}></div>
                {/* Connecting line */}
                <div style={{
                  position: 'absolute',
                  left: 7,
                  top: 17,
                  width: 2,
                  height: 'calc(100% + 8px)',
                  background: '#cbd5e1'
                }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    textTransform: 'uppercase',
                    marginBottom: 1
                  }}>45-DAY<br/>IDENTIFICATION</div>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#64748b',
                    lineHeight: 1.2
                  }}>(1-3 Replacements)</div>
                </div>
              </div>

              {/* 180-Day Close */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#fff',
                  border: '2px solid #94a3b8',
                  flexShrink: 0,
                  marginTop: 1,
                  position: 'relative',
                  zIndex: 1
                }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    textTransform: 'uppercase',
                    marginBottom: 1
                  }}>180-DAY CLOSE:</div>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#64748b',
                    lineHeight: 1.2
                  }}>{addDays(closingDate, 180)}<br/>(1-3 Properties)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End of Content Row */}

        {/* Footer note - positioned at bottom */}
        <div style={{
          position: 'absolute',
          bottom: '8%',
          left: '10%',
          right: '10%',
          fontSize: '0.55rem',
          color: '#64748b',
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
        </div>
      </div>
      {/* End of Badge Card */}
    </div>
  );

  // Render account creation section
  const renderAccountSection = () => (
    <div style={{
      padding: 0,
      background: '#ffffff',
      borderRadius: 0,
      border: 'none',
      textAlign: 'center',
      maxWidth: 600,
      margin: 0
    }}>
      {/* API Error */}
      {apiError && (
        <div style={{ 
          background: '#fee', 
          color: '#c00', 
          padding: '12px', 
          borderRadius: 8, 
          marginBottom: 16,
          fontSize: '0.875rem',
          textAlign: 'center'
        }}>
          {apiError}
        </div>
      )}

      {/* Success Message */}
      {accountCreated && clientInfo ? (
        <div style={{ 
          background: '#f0fdf4', 
          borderRadius: 12, 
          padding: '20px', 
          border: '2px solid #10b981',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: 16 }}>
            <svg width="48" height="48" viewBox="0 0 48 48" style={{ margin: '0 auto' }}>
              <circle cx="24" cy="24" r="22" fill="#10b981"/>
              <path d="M14 24L20 30L34 16" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 700, 
            color: '#111', 
            margin: '0 0 12px 0',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>{isAuthenticated ? 'Exchange ID Linked!' : 'Account Created Successfully!'}</h3>
          <div style={{ 
            background: '#fff', 
            padding: '12px', 
            borderRadius: 8, 
            marginTop: 12,
            textAlign: 'left',
            border: '1px solid #d1fae5'
          }}>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#666', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client ID:</span>
              <span style={{ color: '#111', fontSize: '1.1rem', fontWeight: 700, marginLeft: 8 }}>{clientInfo.client_id}</span>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#666', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client Alias:</span>
              <span style={{ color: '#111', fontSize: '1.1rem', fontWeight: 700, marginLeft: 8 }}>{clientInfo.client_alias}</span>
            </div>
            <div>
              <span style={{ color: '#666', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Exchange ID:</span>
              <span style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: 700, marginLeft: 8 }}>{clientInfo.exchange_id}</span>
            </div>
          </div>
          <p style={{ color: '#059669', marginTop: 16, marginBottom: 0, fontSize: '0.875rem' }}>
            You can now log in to start browsing properties!
          </p>
        </div>
      ) : (
        /* Show login prompt for authenticated users, account creation for guests */
        !accountCreated && exchangeId && (
          isAuthenticated ? (
            /* Already logged in - show message */
            <div style={{
              background: '#f8fafc',
              borderRadius: 12,
              padding: '20px',
              textAlign: 'center',
              border: '1px solid #e2e8f0'
            }}>
              <h4 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 700, 
                color: '#111', 
                marginBottom: 12,
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>Already Linked!</h4>
              <p style={{ 
                color: '#666', 
                fontSize: '0.875rem', 
                marginBottom: 0
              }}>
                Your Exchange ID has been automatically linked to your account. You can view your exchanges in your profile.
              </p>
            </div>
          ) : (
            /* Not logged in - show SSO buttons and email form */
            <div style={{ padding: '12px 12px' }}>
              <div style={{ marginBottom: 12 }}>
                <h2 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '1.1rem', 
                  fontWeight: 700, 
                  color: '#111',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  textAlign: 'center'
                }}>Get Detailed Plan + <span style={{ fontFamily: 'Bubblegum Sans, cursive', color: 'red' }}>Exchange-Pass</span><span style={{ fontSize: '0.6rem', color: 'red', verticalAlign: 'super' }}>TM</span></h2>
              </div>

              {/* SSO Button Column - 5 options stacked */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {/* Google */}
                <div 
                  onClick={() => window.location.href = '/accounts/google/login/'}
                  title="Google"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    height: 40,
                    backgroundColor: '#fff',
                    border: '1px solid #dadce0',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                    e.currentTarget.style.borderColor = '#4285F4';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
                    e.currentTarget.style.borderColor = '#dadce0';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
                    <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
                  </svg>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#3c4043' }}>Google</span>
                </div>

                {/* Facebook */}
                <div 
                  onClick={() => window.location.href = '/accounts/facebook/login/'}
                  title="Facebook"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    height: 40,
                    backgroundColor: '#1877F2',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    e.currentTarget.style.backgroundColor = '#166fe5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                    e.currentTarget.style.backgroundColor = '#1877F2';
                  }}
                >
                  <div style={{ fontSize: 20 }}>
                    <i className="fab fa-facebook-f" style={{ color: '#fff' }}></i>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Facebook</span>
                </div>

                {/* Microsoft */}
                <div 
                  onClick={() => window.location.href = '/accounts/microsoft/login/'}
                  title="Microsoft"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    height: 40,
                    backgroundColor: '#fff',
                    border: '1px solid #8c8c8c',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    e.currentTarget.style.borderColor = '#5e5e5e';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                    e.currentTarget.style.borderColor = '#8c8c8c';
                  }}
                >
                  <svg width="21" height="21" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                    <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                    <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                    <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                  </svg>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#5e5e5e' }}>Microsoft</span>
                </div>

                {/* LinkedIn */}
                <div 
                  onClick={() => window.location.href = '/accounts/linkedin_oauth2/login/'}
                  title="LinkedIn"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    height: 40,
                    backgroundColor: '#0077B5',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    e.currentTarget.style.backgroundColor = '#006399';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                    e.currentTarget.style.backgroundColor = '#0077B5';
                  }}
                >
                  <div style={{ fontSize: 20 }}>
                    <i className="fab fa-linkedin-in" style={{ color: '#fff' }}></i>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>LinkedIn</span>
                </div>
              </div>

              {/* -OR- Divider */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                marginBottom: 12
              }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }}></div>
                <span style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#64748b',
                  textTransform: 'uppercase'
                }}>OR</span>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }}></div>
              </div>

              {/* Email/Password Login Form */}
              <form 
                onSubmit={handleCreateAccount}
                style={{
                  textAlign: 'left'
                }}
              >                <div style={{ marginBottom: 8 }}>
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: 8,
                      border: '1px solid #ccc',
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: 8,
                      border: '1px solid #ccc',
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: 'border-box',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  />
                </div>

              {/* Email Form Section (Hidden by default) */}
              {showEmailForm && (
                <div style={{ marginTop: 0 }}>
                  <div style={{ marginBottom: 8 }}>
                    <input
                      type="text"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: 8,
                        border: '1px solid #ccc',
                        borderRadius: 6,
                        fontSize: 14,
                        boxSizing: 'border-box',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <input
                      type="text"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: 8,
                        border: '1px solid #ccc',
                        borderRadius: 6,
                        fontSize: 14,
                        boxSizing: 'border-box',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 8,
                        border: '1px solid #ccc',
                        borderRadius: 6,
                        fontSize: 14,
                        boxSizing: 'border-box',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <input
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: 8,
                        border: '1px solid #ccc',
                        borderRadius: 6,
                        fontSize: 14,
                        boxSizing: 'border-box',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}
                    />
                  </div>
                </div>
              )}

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: 10,
                    background: '#111',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 20,
                    fontSize: 14,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                >
                  {showEmailForm ? 'Create Account' : 'Sign In / Sign Up'}
                </button>
                
                {/* Toggle between Sign In / Sign Up */}
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: 8,
                  fontSize: 12,
                  color: '#64748b'
                }}>
                  <span 
                    onClick={() => setShowEmailForm(!showEmailForm)}
                    style={{ 
                      color: '#3b82f6', 
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                  </span>
                </div>
              </form>

              {/* Legal Text */}
              <p style={{
                marginTop: 12,
                fontSize: 10,
                color: '#666',
                lineHeight: 1.3
              }}>
                By continuing, you agree to our <a href="#" style={{ color: '#111', textDecoration: 'underline' }}>Terms of Service</a> and <a href="#" style={{ color: '#111', textDecoration: 'underline' }}>Privacy Policy</a>.
              </p>
            </div>
          )
        )
      )}

      {/* Error Message */}
      {accountCreationError && (
        <div style={{ 
          background: '#fee', 
          color: '#c00', 
          padding: '12px', 
          borderRadius: 8,
          fontSize: '0.875rem',
          textAlign: 'center',
          marginTop: 12
        }}>
          {accountCreationError}
        </div>
      )}
    </div>
  );

  return (
    <section id="simple1031-calculator" style={{ background: '#f7f8fa', padding: '5px 0' }}>
      <div style={{ maxWidth: showResults ? 1400 : 430, width: '100%', margin: '0 auto', fontFamily: 'Inter, Lora, Arial, sans-serif', transition: 'max-width 0.6s ease' }}>
        
        {/* Top Section: Form, Results, and Account Side by Side */}
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          {/* Left: Input Form */}
          <div style={{
            width: showResults ? '440px' : '100%',
            flexShrink: 0,
            background: '#fff',
            borderRadius: '16px 0 0 16px',
            boxShadow: '0 20px 50px rgba(15,23,42,0.12)',
            border: 'none',
            transition: 'width 0.6s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: showResults ? '16px' : '0'
          }}>
            {renderFrontForm(showResults)}
          </div>

          {/* Middle: Results (Exchange Pass) */}
          <div style={{
            width: showResults ? '700px' : '0',
            flexShrink: 0,
            background: 'transparent',
            borderRadius: 0,
            boxShadow: 'none',
            border: 'none',
            overflow: 'hidden',
            opacity: showResults ? 1 : 0,
            transform: showResults ? 'translateX(0)' : 'translateX(50px)',
            transition: 'all 0.6s ease',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {showResults && renderBackResults()}
          </div>

          {/* Right: Account Creation */}
          <div style={{
            width: showAccount ? '250px' : '0',
            flexShrink: 0,
            background: 'none',
            borderRadius: '0 16px 16px 0',
            boxShadow: showAccount ? '0 20px 50px rgba(15,23,42,0.12)' : 'none',
            overflow: 'hidden',
            opacity: showAccount ? 1 : 0,
            transform: showAccount ? 'translateX(0)' : 'translateX(50px)',
            transition: 'all 0.6s ease 0.3s',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {showAccount && renderAccountSection()}
          </div>
        </div>

      </div>
    </section>
  );
}