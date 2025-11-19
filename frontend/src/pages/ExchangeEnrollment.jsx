import React, { useState, useEffect } from 'react';
import '../styles/ExchangeEnrollment.css';
import LogoTitle from '../components/LogoTitle';

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


export default function ExchangeEnrollment() {
  // Enrollment form state
  const [salePrice, setSalePrice] = useState('');
  const [equityRollover, setEquityRollover] = useState('');
  const [relinquishClosingDate, setRelinquishClosingDate] = useState('');
  const [hasQi, setHasQi] = useState(false);
  const [qiCompanyName, setQiCompanyName] = useState('');
  const [needQiReferral, setNeedQiReferral] = useState(false);
  const [forward1031, setForward1031] = useState(false);
  const [reverse1031, setReverse1031] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [enrollSuccess, setEnrollSuccess] = useState('');
  const [enrollExchangeId, setEnrollExchangeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState('quick');
  // Quick mode state
  const [qSalePrice, setQSalePrice] = useState('');
  const [qCosts, setQCosts] = useState('');
  const [qDebt, setQDebt] = useState('');
  const [qDate, setQDate] = useState('');
  const [qError, setQError] = useState('');

  // Detailed mode state
  const [dNetSale, setDNetSale] = useState('');
  const [dDebt, setDDebt] = useState('');
  const [dOrig, setDOrig] = useState('');
  const [dImprov, setDImprov] = useState('');
  const [dDeprSL, setDDeprSL] = useState('');
  const [dDeprAcc, setDDeprAcc] = useState('');
  const [dDefGain, setDDefGain] = useState('');
  const [dRecapRate, setDRecapRate] = useState('25');
  const [dFedRate, setDFedRate] = useState('15');
  const [dMedRate, setDMedRate] = useState('3.8');
  const [dStateRate, setDStateRate] = useState('0');
  const [dError, setDError] = useState('');

  // Output state
  const [exchangeId, setExchangeId] = useState('');
  const [exchangeIdMsg, setExchangeIdMsg] = useState('');

  // Quick calculation
  const quick = {
    sale: parseFloat(qSalePrice) || 0,
    cost: parseFloat(qCosts) || 0,
    debt: parseFloat(qDebt) || 0,
    date: qDate,
  };
  const quickNetSale = Math.max(0, quick.sale - quick.cost);
  const quickNetEquity = Math.max(0, quickNetSale - quick.debt);
  const quickMinReplacement = quickNetSale;
  const quickDebtToReplace = quick.debt;
  const quickId45 = addDays(quick.date, 45);
  const quickId180 = addDays(quick.date, 180);

  // Detailed calculation
  const dNetSaleNum = parseFloat(dNetSale) || 0;
  const dDebtNum = parseFloat(dDebt) || 0;
  const dOrigNum = parseFloat(dOrig) || 0;
  const dImprovNum = parseFloat(dImprov) || 0;
  const dDeprSLNum = parseFloat(dDeprSL) || 0;
  const dDeprAccNum = parseFloat(dDeprAcc) || 0;
  const dDefGainNum = parseFloat(dDefGain) || 0;
  const dRecapRateNum = (parseFloat(dRecapRate) || 0) / 100;
  const dFedRateNum = (parseFloat(dFedRate) || 0) / 100;
  const dMedRateNum = (parseFloat(dMedRate) || 0) / 100;
  const dStateRateNum = (parseFloat(dStateRate) || 0) / 100;
  const dDeprTot = dDeprSLNum + dDeprAccNum;
  const dAdjBasis = dOrigNum + dImprovNum - dDeprTot - dDefGainNum;
  const dRealGain = dNetSaleNum - dAdjBasis;
  const dGainPos = Math.max(0, dRealGain);
  const dRecapBase = Math.max(0, Math.min(dDeprTot, dGainPos));
  const dRecapTax = dRecapBase * dRecapRateNum;
  const dCapGainBase = Math.max(0, dGainPos - dRecapBase);
  const dFedTax = dCapGainBase * dFedRateNum;
  const dMedTax = dGainPos * dMedRateNum;
  const dStTax = dGainPos * dStateRateNum;
  const dTotalTax = dRecapTax + dFedTax + dMedTax + dStTax;
  const dAfterTaxEq = dNetSaleNum - dDebtNum - dTotalTax;
  const dMinRepl = dNetSaleNum;
  const dEqReinvest = dNetSaleNum - dDebtNum;
  const dDebtRepl = dDebtNum;

  // Handlers
  function handleModeChange(newMode) {
    setMode(newMode);
    if (newMode === 'detailed') {
      // Prefill detailed from quick if available
      if (quick.sale) setDNetSale(quickNetSale.toFixed(2));
      if (quick.debt) setDDebt(quick.debt.toFixed(2));
    }
  }

  function handleGenerateExchangeId() {
    let sale = 0, debt = 0;
    if (mode === 'quick') {
      sale = quick.sale;
      debt = quick.debt;
    } else {
      sale = dNetSaleNum;
      debt = dDebtNum;
    }
    if (!sale || !debt || debt > sale) {
      setExchangeIdMsg('Incomplete or invalid inputs. Provide valid sale price/net sale and debt payoff before generating an Exchange ID.');
      setExchangeId('');
      return;
    }
    const now = new Date();
    const y = String(now.getFullYear()).slice(-2);
    const m = ('0' + (now.getMonth() + 1)).slice(-2);
    const rand = Math.floor(1000 + Math.random() * 9000);
    const id = 'SCX-' + y + m + '-' + rand;
    setExchangeId(id);
    setExchangeIdMsg('Exchange ID created: ' + id + '  |  Attach up to three Replacement Property IDs under this record inside the Simple1031™ Exchange Orchestration portal.');
  }

  // Error handling
  useEffect(() => {
    if (mode === 'quick') {
      if (!quick.sale && !quick.cost && !quick.debt && !quick.date) {
        setQError('');
        return;
      }
      if (!quick.sale || !quick.debt || quick.debt > quick.sale) {
        setQError(quick.debt > quick.sale ? 'Debt payoff cannot exceed sale price.' : 'Enter sale price and debt payoff.');
      } else {
        setQError('');
      }
    }
  }, [mode, qSalePrice, qCosts, qDebt, qDate]);

  useEffect(() => {
    if (mode === 'detailed') {
      if (!dNetSaleNum && !dDebtNum) {
        setDError('');
        return;
      }
      if (!dNetSaleNum || dDebtNum > dNetSaleNum) {
        setDError(dDebtNum > dNetSaleNum ? 'Debt payoff cannot exceed net selling price.' : 'Enter a valid net selling price and debt payoff.');
      } else {
        setDError('');
      }
    }
  }, [mode, dNetSale, dDebt]);

  // Enrollment form submit handler
  async function handleEnrollmentSubmit(e) {
    e.preventDefault();
    setEnrollError('');
    setEnrollSuccess('');
    setSubmitting(true);
    // Validation
    if (!salePrice || !equityRollover || !relinquishClosingDate) {
      setEnrollError('Please fill out all required fields.');
      setSubmitting(false);
      return;
    }
    if (parseFloat(equityRollover) > parseFloat(salePrice)) {
      setEnrollError('Equity rollover cannot exceed sale price.');
      setSubmitting(false);
      return;
    }
    if (!agreeTerms) {
      setEnrollError('You must agree to the terms to proceed.');
      setSubmitting(false);
      return;
    }
    if (!needQiReferral && hasQi && !qiCompanyName.trim()) {
      setEnrollError('Please enter your QI company name.');
      setSubmitting(false);
      return;
    }
    // API call (replace with your backend endpoint)
    try {
      const resp = await fetch('/SE/Exchange/Create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale_price: salePrice,
          equity_rollover: equityRollover,
          relinquish_closing_date: relinquishClosingDate,
          has_qi: hasQi,
          qi_company_name: qiCompanyName,
        })
      });
      const data = await resp.json();
      if (data.success) {
        setEnrollSuccess('✓ Exchange Created Successfully!');
        setEnrollExchangeId(data.exchange_id);
        setTimeout(() => {
          window.location.href = `/SE/Exchange/${data.exchange_pk}/`;
        }, 2000);
      } else {
        setEnrollError(data.error || 'An error occurred.');
      }
    } catch (err) {
      setEnrollError('Network error. Please try again.');
    }
    setSubmitting(false);
  }


  return (
    <section id="simple1031-enrollment" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif', background: '#f5f6fb', padding: 24, color: '#111827' }}>
      <div className="s1031-section" style={{ maxWidth: 600, margin: '0 auto', background: '#fff', borderRadius: 18, boxShadow: '0 2px 16px rgba(37,99,235,0.07)', padding: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
          <img src={"/static/1031_TEO_Logo.svg"} alt="Simple1031 Logo" style={{ height: 48, marginRight: 18 }} />
          <div style={{ fontWeight: 800, fontSize: 28, color: '#10174a', letterSpacing: '0.01em', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
            Simple1031™ Deferred Tax & Replacement Planner
          </div>
        </div>
        <div className="s1031-section-title" style={{ fontSize: 18, fontWeight: 700, color: '#2563eb', marginBottom: 18, letterSpacing: '0.04em' }}>SALE SUMMARY</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 18,
          marginBottom: 8
        }}>
          <div>
            <label>Sale Price (Relinquished Asset)</label>
            <input className="s1031-input" type="number" placeholder="Total contract price" value={qSalePrice} onChange={e => setQSalePrice(e.target.value)} />
          </div>
          <div>
            <label>Debt Payoff at Closing</label>
            <input className="s1031-input" type="number" placeholder="Mortgage payoff" value={qDebt} onChange={e => setQDebt(e.target.value)} />
          </div>
          <div>
            <label>Closing Costs</label>
            <input className="s1031-input" type="number" placeholder="Commissions, title, etc." value={qCosts} onChange={e => setQCosts(e.target.value)} />
          </div>
          <div>
            <label>Relinquished Closing Date</label>
            <input className="s1031-input s1031-input-date" type="date" placeholder="mm/dd/yyyy" value={qDate} onChange={e => setQDate(e.target.value)} />
          </div>
        </div>
        {qError && <div className="s1031-error">{qError}</div>}
        <div className="s1031-inline">Full deferral baseline: reinvest all net equity and acquire replacement property(ies) with total value at least equal to your net selling price. Unreinvested equity or unreplaced debt is potential taxable boot.</div>
        <div className="s1031-btn-row s1031-btn-row-compact">
          <div className="s1031-disclaimer">Outputs are planning estimates only. Simple1031™ and SimpleADVISORY recommend validation with tax counsel.</div>
          <button className="s1031-btn s1031-btn-compact" type="button" style={{ padding: '6px 18px', fontSize: 13, minWidth: 0, height: 32, borderRadius: 7 }} onClick={handleGenerateExchangeId}>Generate Exchange ID</button>
        </div>
        {exchangeIdMsg && (
          <div id="s1031-exchange-id" style={{ marginTop: 6, padding: '6px 9px', borderRadius: 8, background: exchangeId ? '#ecfdf5' : '#fef2f2', border: `1px solid ${exchangeId ? '#bbf7d0' : '#fecaca'}`, fontSize: 9, color: exchangeId ? '#065f46' : '#991b1b' }}>{exchangeIdMsg}</div>
        )}
        <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
          <div style={{ flex: 1, minWidth: 340 }}>
            {mode === 'quick' && !qError && (qSalePrice || qCosts || qDebt || qDate) && (
              <div className="s1031-summary" style={{
                marginTop: 12,
                padding: '18px 20px',
                borderRadius: 14,
                background: '#fffbe8',
                border: '1.5px solid #f6e3a1',
                fontSize: 13,
                color: '#2563eb',
                boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
                lineHeight: 1.7,
                minHeight: 180
              }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#2563eb', marginBottom: 8, letterSpacing: '0.04em' }}>Quick Summary</div>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600, color: '#6b7280', padding: '4px 0' }}>Net Selling Price</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb', fontSize: 16 }}>${fmt(quickNetSale)}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: '#6b7280', padding: '4px 0' }}>Net Equity</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb', fontSize: 16 }}>${fmt(quickNetEquity)}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: '#6b7280', padding: '4px 0' }}>Debt to Replace</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb', fontSize: 16 }}>${fmt(quickDebtToReplace)}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: '#6b7280', padding: '4px 0' }}>Min Replacement Value</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb', fontSize: 16 }}>${fmt(quickMinReplacement)}</td>
                    </tr>
                  </tbody>
                </table>
                {(quickId45 && quickId180) && (
                  <div style={{
                    marginTop: 18,
                    fontSize: 12,
                    color: '#2563eb',
                    background: '#e0e7ff',
                    borderRadius: 8,
                    padding: '12px 14px',
                    border: '1.5px solid #2563eb',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 6
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>45-Day ID Deadline:</span>
                      <span style={{ fontWeight: 700, color: '#2563eb', fontSize: 15 }}>{quickId45}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <span style={{ fontWeight: 600 }}>180-Day Closing Deadline:</span>
                      <span style={{ fontWeight: 700, color: '#2563eb', fontSize: 15 }}>{quickId180}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}