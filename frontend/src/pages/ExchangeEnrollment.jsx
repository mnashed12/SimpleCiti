import React, { useState, useEffect } from 'react';

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

  // Layout: output to the right of inputs
  return (
    <section id="simple1031-calculator" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif', background: '#f5f6fb', padding: 24, color: '#111827' }}>
      <div id="s1031-wrap" style={{ maxWidth: 980, margin: '0 auto', background: '#fff', padding: 18, borderRadius: 16, border: '1px solid #dde2f0', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
              <div id="s1031-title" style={{ fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#10174a', fontWeight: 700, marginBottom: 4 }}>Simple1031™ Deferred Tax & Replacement Planner</div>
              <div id="s1031-subtitle" style={{ fontSize: 11, color: '#6b7280', marginBottom: 14 }}>
                Two modes. Quick uses sale, costs, and debt to set your §1031 replacement targets. Detailed adds full basis and tax layers for CPAs and advisors. All results bind to your Exchange ID for downstream replacement tracking.
              </div>
              <div className="s1031-toggle" style={{ display: 'inline-flex', borderRadius: 999, border: '1px solid #dde2f0', overflow: 'hidden', marginBottom: 14, background: '#fff' }}>
                <button className={mode === 'quick' ? 'active' : ''} style={{ padding: '6px 16px', border: 'none', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', cursor: 'pointer', background: mode === 'quick' ? '#10174a' : 'transparent', color: mode === 'quick' ? '#fff' : '#6b7280', fontWeight: 600 }} onClick={() => handleModeChange('quick')}>Quick Calculator</button>
                <button className={mode === 'detailed' ? 'active' : ''} style={{ padding: '6px 16px', border: 'none', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', cursor: 'pointer', background: mode === 'detailed' ? '#10174a' : 'transparent', color: mode === 'detailed' ? '#fff' : '#6b7280', fontWeight: 600 }} onClick={() => handleModeChange('detailed')}>Detailed Calculator</button>
              </div>
              <div style={{ display: 'flex', gap: 32 }}>
                <div style={{ flex: 1 }}>
                  {mode === 'quick' && (
                    <div className="s1031-section" style={{ marginTop: 8, padding: '10px 10px 8px', borderRadius: 10, border: '1px solid #dde2f0', background: '#fff' }}>
                      <div className="s1031-section-title" style={{ fontSize: 10, fontWeight: 700, color: '#10174a', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>Sale summary</div>
                      <div className="s1031-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                        <div className="s1031-label" style={{ flex: '0 0 210px', fontSize: 10, color: '#6b7280' }}>Sale Price (Relinquished Asset)</div>
                        <div className="s1031-input-wrap" style={{ flex: "0 0 220px" }}>
                          <input className="s1031-input" type="number" placeholder="Total contract price" value={qSalePrice} onChange={e => setQSalePrice(e.target.value)} style={{ width: '100%', padding: '5px 7px', borderRadius: 6, border: '1px solid #dde2f0', fontSize: 11, textAlign: 'right', color: '#111827', background: '#f9fafb' }} />
                        </div>
                      </div>
                      <div className="s1031-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                        <div className="s1031-label" style={{ flex: '0 0 210px', fontSize: 10, color: '#6b7280' }}>Closing Costs</div>
                        <div className="s1031-input-wrap" style={{ flex: "0 0 220px" }}>
                          <input className="s1031-input" type="number" placeholder="Commissions, title, etc." value={qCosts} onChange={e => setQCosts(e.target.value)} style={{ width: '100%', padding: '5px 7px', borderRadius: 6, border: '1px solid #dde2f0', fontSize: 11, textAlign: 'right', color: '#111827', background: '#f9fafb' }} />
                        </div>
                      </div>
                      <div className="s1031-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                        <div className="s1031-label" style={{ flex: '0 0 210px', fontSize: 10, color: '#6b7280' }}>Debt Payoff at Closing</div>
                        <div className="s1031-input-wrap" style={{ flex: "0 0 220px" }}>
                          <input className="s1031-input" type="number" placeholder="Mortgage payoff" value={qDebt} onChange={e => setQDebt(e.target.value)} style={{ width: '100%', padding: '5px 7px', borderRadius: 6, border: '1px solid #dde2f0', fontSize: 11, textAlign: 'right', color: '#111827', background: '#f9fafb' }} />
                        </div>
                      </div>
                      <div className="s1031-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                        <div className="s1031-label" style={{ flex: '0 0 210px', fontSize: 10, color: '#6b7280' }}>Relinquished Closing Date</div>
                        <div className="s1031-input-wrap" style={{ flex: "0 0 220px" }}>
                          <input className="s1031-input s1031-input-date" type="date" value={qDate} onChange={e => setQDate(e.target.value)} style={{ width: '100%', padding: '5px 7px', borderRadius: 6, border: '1px solid #dde2f0', fontSize: 11, textAlign: 'left', color: '#111827', background: '#f9fafb' }} />
                        </div>
                      </div>
                      {qError && <div className="s1031-error" style={{ marginLeft: 210, fontSize: 9, color: '#b91c1c', marginBottom: 4 }}>{qError}</div>}
                      <div className="s1031-inline" style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>
                        Full deferral baseline: reinvest all net equity and acquire replacement property(ies) with total value at least equal to your net selling price. Unreinvested equity or unreplaced debt is potential taxable boot.
                      </div>
                    </div>
                  )}
                  {mode === 'detailed' && (
                    <div className="s1031-section" style={{ marginTop: 8, padding: '10px 10px 8px', borderRadius: 10, border: '1px solid #dde2f0', background: '#fff' }}>
                      <div className="s1031-section-title" style={{ fontSize: 10, fontWeight: 700, color: '#10174a', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>Detailed 1031 tax analysis</div>
                      <div className="s1031-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                        <div className="s1031-label" style={{ flex: '0 0 210px', fontSize: 10, color: '#6b7280' }}>Net Selling Price (Sale − Costs)</div>
                        <div className="s1031-input-wrap" style={{ flex: "0 0 220px" }}>
                          <input className="s1031-input" type="number" placeholder="Prefilled from Quick" value={dNetSale} onChange={e => setDNetSale(e.target.value)} style={{ width: '100%', padding: '5px 7px', borderRadius: 6, border: '1px solid #dde2f0', fontSize: 11, textAlign: 'right', color: '#111827', background: '#f9fafb' }} />
                        </div>
                        <div className="s1031-detail-output" style={{ fontSize: 9, color: '#10174a', textAlign: 'right', minWidth: 80 }}>{dNetSaleNum ? `Net sale: $${fmt(dNetSaleNum)}` : ''}</div>
                      </div>
                      <div className="s1031-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                        <div className="s1031-label" style={{ flex: '0 0 210px', fontSize: 10, color: '#6b7280' }}>Debt Payoff at Closing</div>
                        <div className="s1031-input-wrap" style={{ flex: "0 0 220px" }}>
                          <input className="s1031-input" type="number" value={dDebt} onChange={e => setDDebt(e.target.value)} style={{ width: '100%', padding: '5px 7px', borderRadius: 6, border: '1px solid #dde2f0', fontSize: 11, textAlign: 'right', color: '#111827', background: '#f9fafb' }} />
                        </div>
                        <div className="s1031-detail-output" style={{ fontSize: 9, color: '#10174a', textAlign: 'right', minWidth: 80 }}>{dDebtNum ? `Debt payoff: $${fmt(dDebtNum)}` : ''}</div>
                      </div>
                      <div className="s1031-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                        <div className="s1031-label" style={{ flex: '0 0 210px', fontSize: 10, color: '#6b7280' }}>Original Purchase Price</div>
                        <div className="s1031-input-wrap" style={{ flex: "0 0 220px" }}>
                          <input className="s1031-input" type="number" value={dOrig} onChange={e => setDOrig(e.target.value)} style={{ width: '100%', padding: '5px 7px', borderRadius: 6, border: '1px solid #dde2f0', fontSize: 11, textAlign: 'right', color: '#111827', background: '#f9fafb' }} />
                        </div>
                      </div>
                      <div className="s1031-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                        <div className="s1031-label" style={{ flex: '0 0 210px', fontSize: 10, color: '#6b7280' }}>Capital Improvements</div>
                        <div className="s1031-input-wrap" style={{ flex: "0 0 220px" }}>
                          <input className="s1031-input" type="number" value={dImprov} onChange={e => setDImprov(e.target.value)} style={{ width: '100%', padding: '5px 7px', borderRadius: 6, border: '1px solid #dde2f0', fontSize: 11, textAlign: 'right', color: '#111827', background: '#f9fafb' }} />
                        </div>
                      </div>
                      <div className="s1031-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                        <div className="s1031-label" style={{ flex: '0 0 210px', fontSize: 10, color: '#6b7280' }}>Straight-Line Depreciation</div>
                        <div className="s1031-input-wrap" style={{ flex: "0 0 220px" }}>
                          <input className="s1031-input" type="number" value={dDeprSL} onChange={e => setDDeprSL(e.target.value)} style={{ width: '100%', padding: '5px 7px', borderRadius: 6, border: '1px solid #dde2f0', fontSize: 11, textAlign: 'right', color: '#111827', background: '#f9fafb' }} />
                        </div>
                      </div>
                      <div className="s1031-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                        <div className="s1031-label" style={{ flex: '0 0 210px', fontSize: 10, color: '#6b7280' }}>Bonus / Accelerated Depreciation</div>
                        <div className="s1031-input-wrap" style={{ flex: "0 0 220px" }}>
                          <input className="s1031-input" type="number" value={dDeprAcc} onChange={e => setDDeprAcc(e.target.value)} style={{ width: '100%', padding: '5px 7px', borderRadius: 6, border: '1px solid #dde2f0', fontSize: 11, textAlign: 'right', color: '#111827', background: '#f9fafb' }} />
                        </div>
                      </div>
                      <div className="s1031-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                        <div className="s1031-label" style={{ flex: '0 0 210px', fontSize: 10, color: '#6b7280' }}>Deferred Gain from Prior 1031</div>
                        <div className="s1031-input-wrap" style={{ flex: "0 0 220px" }}>
                          <input className="s1031-input" type="number" value={dDefGain} onChange={e => setDDefGain(e.target.value)} style={{ width: '100%', padding: '5px 7px', borderRadius: 6, border: '1px solid #dde2f0', fontSize: 11, textAlign: 'right', color: '#111827', background: '#f9fafb' }} />
                        </div>
                      </div>
                      <div className="s1031-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                        <div className="s1031-label" style={{ flex: '0 0 210px', fontSize: 10, color: '#6b7280' }}>Depreciation Recapture Rate (%)</div>
                        <div className="s1031-input-wrap" style={{ flex: "0 0 220px" }}>
                          <input className="s1031-input" type="number" value={dRecapRate} onChange={e => setDRecapRate(e.target.value)} style={{ width: '100%', padding: '5px 7px', borderRadius: 6, border: '1px solid #dde2f0', fontSize: 11, textAlign: 'right', color: '#111827', background: '#f9fafb' }} />
                        </div>
                      </div>
                      <div className="s1031-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                        <div className="s1031-label" style={{ flex: '0 0 210px', fontSize: 10, color: '#6b7280' }}>Federal Capital Gains Rate (%)</div>
                        <div className="s1031-input-wrap" style={{ flex: "0 0 220px" }}>
                          <input className="s1031-input" type="number" value={dFedRate} onChange={e => setDFedRate(e.target.value)} style={{ width: '100%', padding: '5px 7px', borderRadius: 6, border: '1px solid #dde2f0', fontSize: 11, textAlign: 'right', color: '#111827', background: '#f9fafb' }} />
                        </div>
                      </div>
                      <div className="s1031-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                        <div className="s1031-label" style={{ flex: '0 0 210px', fontSize: 10, color: '#6b7280' }}>Net Investment / Medicare Rate (%)</div>
                        <div className="s1031-input-wrap" style={{ flex: "0 0 220px" }}>
                          <input className="s1031-input" type="number" value={dMedRate} onChange={e => setDMedRate(e.target.value)} style={{ width: '100%', padding: '5px 7px', borderRadius: 6, border: '1px solid #dde2f0', fontSize: 11, textAlign: 'right', color: '#111827', background: '#f9fafb' }} />
                        </div>
                      </div>
                      <div className="s1031-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 4, gap: 8 }}>
                        <div className="s1031-label" style={{ flex: '0 0 210px', fontSize: 10, color: '#6b7280' }}>State Capital Gains Rate (%)</div>
                        <div className="s1031-input-wrap" style={{ flex: "0 0 220px" }}>
                          <input className="s1031-input" type="number" value={dStateRate} onChange={e => setDStateRate(e.target.value)} style={{ width: '100%', padding: '5px 7px', borderRadius: 6, border: '1px solid #dde2f0', fontSize: 11, textAlign: 'right', color: '#111827', background: '#f9fafb' }} />
                        </div>
                      </div>
                      {dError && <div className="s1031-error" style={{ marginLeft: 210, fontSize: 9, color: '#b91c1c', marginBottom: 4 }}>{dError}</div>}
                    </div>
                  )}
                  <div className="s1031-btn-row" style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center' }}>
                    <div style={{ fontSize: 8, color: '#6b7280' }}>
                      Outputs are planning estimates only. Simple1031™ and SimpleADVISORY recommend validation with tax counsel.
                    </div>
                    <button className="s1031-btn" type="button" onClick={handleGenerateExchangeId} style={{ padding: '7px 16px', borderRadius: 999, border: 'none', background: '#fcd300', color: '#111827', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.16)' }}>Generate Exchange ID</button>
                  </div>
                  {exchangeIdMsg && (
                    <div id="s1031-exchange-id" style={{ marginTop: 6, padding: '6px 9px', borderRadius: 8, background: exchangeId ? '#ecfdf5' : '#fef2f2', border: `1px solid ${exchangeId ? '#bbf7d0' : '#fecaca'}`, fontSize: 9, color: exchangeId ? '#065f46' : '#991b1b' }}>{exchangeIdMsg}</div>
                  )}
                </div>
                {/* Output summary to the right */}
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
                  {mode === 'detailed' && !dError && (dNetSale || dDebt) && (
                    <div id="s1031-adv-summary" style={{
                      marginTop: 12,
                      padding: '18px 20px',
                      borderRadius: 14,
                      background: '#f3f4ff',
                      border: '1.5px solid #2563eb',
                      fontSize: 12,
                      color: '#2563eb',
                      boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
                      lineHeight: 1.7,
                      minHeight: 200
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#2563eb', marginBottom: 8, letterSpacing: '0.04em' }}>Detailed Tax Analysis</div>
                      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                        <tbody>
                          <tr>
                            <td style={{ fontWeight: 600, color: '#6b7280', padding: '4px 0' }}>Adjusted Basis</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb', fontSize: 16 }}>${fmt(dAdjBasis)}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 600, color: '#6b7280', padding: '4px 0' }}>Realized Gain</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb', fontSize: 16 }}>${fmt(dRealGain)}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 600, color: '#6b7280', padding: '4px 0' }}>Recapture Tax</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb', fontSize: 16 }}>${fmt(dRecapTax)}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 600, color: '#6b7280', padding: '4px 0' }}>Fed CG Tax</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb', fontSize: 16 }}>${fmt(dFedTax)}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 600, color: '#6b7280', padding: '4px 0' }}>Medicare</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb', fontSize: 16 }}>${fmt(dMedTax)}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 600, color: '#6b7280', padding: '4px 0' }}>State Tax</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb', fontSize: 16 }}>${fmt(dStTax)}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#2563eb', padding: '8px 0 0 0', fontSize: 13 }}>Total Cap Gains Tax</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb', fontSize: 17, paddingTop: 8 }}>${fmt(dTotalTax)}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 700, color: '#2563eb', padding: '4px 0', fontSize: 13 }}>After-Tax Equity (no 1031)</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: '#2563eb', fontSize: 17 }}>${fmt(dAfterTaxEq)}</td>
                          </tr>
                        </tbody>
                      </table>
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
                        <div style={{ fontWeight: 700, marginBottom: 2 }}>§1031 Targets:</div>
                        <div>
                          Min Replacement ≈ <span style={{ color: '#2563eb', fontWeight: 700 }}>${fmt(dMinRepl)}</span>, Equity to Reinvest ≈ <span style={{ color: '#2563eb', fontWeight: 700 }}>${fmt(dEqReinvest)}</span>, Debt to Replace ≈ <span style={{ color: '#2563eb', fontWeight: 700 }}>${fmt(dDebtRepl)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
        </section>
    );
}
