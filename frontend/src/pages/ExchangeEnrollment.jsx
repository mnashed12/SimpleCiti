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

import React, { useState, useEffect } from 'react';
import '../styles/ExchangeEnrollment.css';

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
  // State for toggling modes and form fields
  const [mode, setMode] = useState('quick');
  // Quick mode
  const [qSalePrice, setQSalePrice] = useState('');
  const [qCosts, setQCosts] = useState('');
  const [qDebt, setQDebt] = useState('');
  const [qDate, setQDate] = useState('');

  // Format input with commas as you type
  function handleNumberInput(e, setter) {
    let val = e.target.value.replace(/,/g, '');
    // Only allow numbers and decimals
    if (!/^\d*(\.\d{0,2})?$/.test(val)) return;
    // Format with commas
    if (val) {
      const [intPart, decPart] = val.split('.');
      val = parseInt(intPart, 10).toLocaleString();
      if (decPart !== undefined) val += '.' + decPart;
    }
    setter(val);
  }
  const [qError, setQError] = useState('');
  // Detailed mode
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
  // Output
  const [exchangeId, setExchangeId] = useState('');
  const [exchangeIdMsg, setExchangeIdMsg] = useState('');

  // Quick calculations
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

  // Detailed calculations
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

  // Mode toggle
  function handleModeChange(newMode) {
    setMode(newMode);
    if (newMode === 'detailed') {
      // Prefill detailed from quick if available
      if (quick.sale) setDNetSale(quickNetSale.toFixed(2));
      if (quick.debt) setDDebt(quick.debt.toFixed(2));
    }
  }

  // Exchange ID generation
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

  return (
    <section id="simple1031-calculator">
      <div id="s1031-wrap">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
          <img src="/static/1031_TEO_Logo.svg" alt="Simple1031 Logo" style={{ height: 80, width: 'auto', borderRadius: 8, padding: 4 }} />
          <div id="s1031-title">Simple1031™ Deferred Tax & Replacement Planner</div>
        </div>
        <div id="s1031-subtitle">
          Two modes. Quick uses sale, costs, and debt to set your §1031 replacement targets. Detailed adds full basis and tax layers for CPAs and advisors. All results bind to your Exchange ID for downstream replacement tracking.
        </div>
        <div className="s1031-toggle">
          <button id="btnQuick" className={mode === 'quick' ? 'active' : ''} type="button" onClick={() => handleModeChange('quick')}>Quick Calculator</button>
          <button id="btnDetailed" className={mode === 'detailed' ? 'active' : ''} type="button" onClick={() => handleModeChange('detailed')}>Detailed Calculator</button>
        </div>
        {/* QUICK MODE */}
        {mode === 'quick' && (
          <div id="s1031-quick" style={{ display: 'flex', gap: 32 }}>
            <div style={{ flex: 1 }}>
              <div className="s1031-section">
                <div className="s1031-section-title">Sale summary</div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px 18px',
                  marginBottom: 4
                }}>
                  <div>
                    <div className="s1031-label">Sale Price (Relinquished Asset)</div>
                    <div className="s1031-input-wrap">
                      <input className="s1031-input" id="q-salePrice" type="text" placeholder="Total contract price" value={qSalePrice} onChange={e => handleNumberInput(e, setQSalePrice)} />
                    </div>
                  </div>
                  <div>
                    <div className="s1031-label">Closing Costs</div>
                    <div className="s1031-input-wrap">
                      <input className="s1031-input" id="q-costs" type="text" placeholder="Commissions, title, etc." value={qCosts} onChange={e => handleNumberInput(e, setQCosts)} />
                    </div>
                  </div>
                  <div>
                    <div className="s1031-label">Debt Payoff at Closing</div>
                    <div className="s1031-input-wrap">
                      <input className="s1031-input" id="q-debt" type="text" placeholder="Mortgage payoff" value={qDebt} onChange={e => handleNumberInput(e, setQDebt)} />
                    </div>
                  </div>
                  <div>
                    <div className="s1031-label">Relinquished Closing Date</div>
                    <div className="s1031-input-wrap">
                      <input className="s1031-input s1031-input-date" id="q-date" type="date" value={qDate} onChange={e => setQDate(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div id="q-error" className="s1031-error" style={{ display: qError ? 'block' : 'none' }}>{qError}</div>
                <div className="s1031-inline">
                  Full deferral baseline: reinvest all net equity and acquire replacement property(ies) with total value at least equal to your net selling price. Unreinvested equity or unreplaced debt is potential taxable boot.
                </div>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 320, display: 'flex', alignItems: 'flex-start' }}>
              <div id="q-summary" className="s1031-summary s1031-summary-quick">
                <div className="s1031-summary-title">Quick Calculation</div>
                <div className="s1031-summary-grid-quick">
                  <div className="s1031-summary-label-quick">Net Selling Price</div>
                  <div className="s1031-summary-value-quick">${fmt(quickNetSale)}</div>
                  <div className="s1031-summary-label-quick">Net Equity</div>
                  <div className="s1031-summary-value-quick">${fmt(quickNetEquity)}</div>
                  <div className="s1031-summary-label-quick">Debt to Replace</div>
                  <div className="s1031-summary-value-quick">${fmt(quickDebtToReplace)}</div>
                  <div className="s1031-summary-label-quick">Minimum Replacement Value</div>
                  <div className="s1031-summary-value-quick s1031-summary-highlight-quick">${fmt(quickMinReplacement)}</div>
                </div>
                {(quickId45 && quickId180) && (
                  <div className="s1031-summary-deadlines-quick">
                    <span>45-Day ID Deadline: <b>{quickId45}</b></span>
                    <span>180-Day Closing Deadline: <b>{quickId180}</b></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* DETAILED MODE */}
        {mode === 'detailed' && (
          <div id="s1031-detailed" style={{ display: 'block' }}>
            <div className="s1031-section">
              <div className="s1031-section-title">Detailed 1031 tax analysis</div>
              <div className="s1031-row-grid">
                {/* Net sale and debt */}
                <div className="s1031-row" style={{ marginBottom: '14px' }}>
                  <div className="s1031-label">Net Selling Price (Sale − Costs)</div>
                  <div className="s1031-input-wrap">
                    <input className="s1031-input" id="d-netSale" type="text" placeholder="Prefilled from Quick" value={dNetSale} onChange={e => handleDetailedNumberInput(e, setDNetSale)} />
                  </div>
                  <div className="s1031-detail-output" id="d-netSale-out">{dNetSale ? `Net sale: $${Number(dNetSale.replace(/,/g, '')).toLocaleString()}` : ''}</div>
                </div>
                <div className="s1031-row" style={{ marginBottom: '14px' }}>
                  <div className="s1031-label">Debt Payoff at Closing</div>
                  <div className="s1031-input-wrap">
                    <input className="s1031-input" id="d-debt" type="text" value={dDebt} onChange={e => handleDetailedNumberInput(e, setDDebt)} />
                  </div>
                  <div className="s1031-detail-output" id="d-debt-out">{dDebt ? `Debt payoff: $${Number(dDebt.replace(/,/g, '')).toLocaleString()}` : ''}</div>
                </div>
                {/* Basis inputs */}
                <div className="s1031-row" style={{ marginBottom: '14px' }}>
                  <div className="s1031-label">Original Purchase Price</div>
                  <div className="s1031-input-wrap">
                    <input className="s1031-input" id="d-orig" type="text" value={dOrig} onChange={e => handleDetailedNumberInput(e, setDOrig)} />
                  </div>
                </div>
                <div className="s1031-row" style={{ marginBottom: '14px' }}>
                  <div className="s1031-label">Capital Improvements</div>
                  <div className="s1031-input-wrap">
                    <input className="s1031-input" id="d-improv" type="text" value={dImprov} onChange={e => handleDetailedNumberInput(e, setDImprov)} />
                  </div>
                </div>
                <div className="s1031-row" style={{ marginBottom: '14px' }}>
                  <div className="s1031-label">Straight-Line Depreciation</div>
                  <div className="s1031-input-wrap">
                    <input className="s1031-input" id="d-deprSL" type="text" value={dDeprSL} onChange={e => handleDetailedNumberInput(e, setDDeprSL)} />
                  </div>
                </div>
                <div className="s1031-row" style={{ marginBottom: '14px' }}>
                  <div className="s1031-label">Bonus / Accelerated Depreciation</div>
                  <div className="s1031-input-wrap">
                    <input className="s1031-input" id="d-deprAcc" type="text" value={dDeprAcc} onChange={e => handleDetailedNumberInput(e, setDDeprAcc)} />
                  </div>
                </div>
                <div className="s1031-row" style={{ marginBottom: '14px' }}>
                  <div className="s1031-label">Deferred Gain from Prior 1031</div>
                  <div className="s1031-input-wrap">
                    <input className="s1031-input" id="d-defGain" type="text" value={dDefGain} onChange={e => handleDetailedNumberInput(e, setDDefGain)} />
                  </div>
                </div>
                {/* Rates */}
                <div className="s1031-row" style={{ marginBottom: '14px' }}>
                  <div className="s1031-label">Depreciation Recapture Rate (%)</div>
                  <div className="s1031-input-wrap">
                    <input className="s1031-input" id="d-recapRate" type="text" value={dRecapRate} onChange={e => handleDetailedNumberInput(e, setDRecapRate)} />
                  </div>
                </div>
                <div className="s1031-row" style={{ marginBottom: '14px' }}>
                  <div className="s1031-label">Federal Capital Gains Rate (%)</div>
                  <div className="s1031-input-wrap">
                    <input className="s1031-input" id="d-fedRate" type="text" value={dFedRate} onChange={e => handleDetailedNumberInput(e, setDFedRate)} />
                  </div>
                </div>
                <div className="s1031-row" style={{ marginBottom: '14px' }}>
                  <div className="s1031-label">Net Investment / Medicare Rate (%)</div>
                  <div className="s1031-input-wrap">
                    <input className="s1031-input" id="d-medRate" type="text" value={dMedRate} onChange={e => handleDetailedNumberInput(e, setDMedRate)} />
                  </div>
                </div>
                <div className="s1031-row" style={{ marginBottom: '14px' }}>
                  <div className="s1031-label">State Capital Gains Rate (%)</div>
                  <div className="s1031-input-wrap">
                    <input className="s1031-input" id="d-stateRate" type="text" value={dStateRate} onChange={e => handleDetailedNumberInput(e, setDStateRate)} />
                  </div>
                </div>
              </div>
              <div id="d-error" className="s1031-error" style={{ display: dError ? 'block' : 'none' }}>{dError}</div>
              <div id="s1031-adv-summary" className="s1031-summary s1031-summary-detailed" style={{ display: (!dError && (dNetSale || dDebt)) ? 'flex' : 'none', flexDirection: 'column' }}>
                <div className="s1031-summary-title">Detailed Calculation</div>
                <div className="s1031-summary-split-row">
                  <div className="s1031-summary-split-col">
                    <div className="s1031-summary-pair"><span className="s1031-summary-label">Adjusted Basis</span><span className="s1031-summary-value">${Number(dAdjBasis).toLocaleString()}</span></div>
                    <div className="s1031-summary-pair"><span className="s1031-summary-label">Realized Gain</span><span className="s1031-summary-value">${Number(dRealGain).toLocaleString()}</span></div>
                    <div className="s1031-summary-pair"><span className="s1031-summary-label">Recapture Base</span><span className="s1031-summary-value">${Number(dRecapBase).toLocaleString()}</span></div>
                    <div className="s1031-summary-pair"><span className="s1031-summary-label">Recapture Tax</span><span className="s1031-summary-value">${Number(dRecapTax).toLocaleString()}</span></div>
                  </div>
                  <div className="s1031-summary-split-col">
                    <div className="s1031-summary-pair"><span className="s1031-summary-label">Fed CG Tax</span><span className="s1031-summary-value">${Number(dFedTax).toLocaleString()}</span></div>
                    <div className="s1031-summary-pair"><span className="s1031-summary-label">Medicare</span><span className="s1031-summary-value">${Number(dMedTax).toLocaleString()}</span></div>
                    <div className="s1031-summary-pair"><span className="s1031-summary-label">State</span><span className="s1031-summary-value">${Number(dStTax).toLocaleString()}</span></div>
                  </div>
                </div>
                <div className="s1031-summary-detailed-bottom-row">
                  <div className="s1031-summary-highlight-detailed">
                    Total Estimated Capital Gains Tax: ${Number(dTotalTax).toLocaleString()}<br />
                    Estimated After-Tax Equity (no 1031): ${Number(dAfterTaxEq).toLocaleString()}
                  </div>
                  <div className="s1031-summary-deadlines-detailed">
                    <strong>§1031 Targets:</strong>
                    <div className="s1031-deadline-item">Min Replacement ≈ ${Number(dMinRepl).toLocaleString()}</div>
                    <div className="s1031-deadline-item">Equity to Reinvest ≈ ${Number(dEqReinvest).toLocaleString()}</div>
                    <div className="s1031-deadline-item">Debt to Replace or cash-substitute ≈ ${Number(dDebtRepl).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* ACTIONS */}
        <div className="s1031-btn-row">
          <div style={{ fontSize: 10, color: 'var(--s1031-text-soft)' }}>
            Outputs are planning estimates only. Simple1031™ and SimpleADVISORY recommend validation with tax counsel.
          </div>
          <button className="s1031-btn" type="button" onClick={handleGenerateExchangeId}>Generate Exchange ID</button>
        </div>
        <div id="s1031-exchange-id" style={{ display: exchangeIdMsg ? 'block' : 'none', background: exchangeId ? '#ecfdf5' : '#fef2f2', borderColor: exchangeId ? '#bbf7d0' : '#fecaca', color: exchangeId ? '#065f46' : '#991b1b' }}>{exchangeIdMsg}</div>
      </div>
    </section>
  );
}