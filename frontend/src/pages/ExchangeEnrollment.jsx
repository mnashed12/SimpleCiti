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
  // Quick calculator fields (now part of main form)
  const [salePrice, setSalePrice] = useState('');
  const [costs, setCosts] = useState('');
  const [debtPayoff, setDebtPayoff] = useState('');
  const [closingDate, setClosingDate] = useState('');

  // Detailed calculator fields
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

  // Parse values
  const salePriceNum = parseFloat(salePrice.replace(/,/g, '')) || 0;
  const costsNum = parseFloat(costs.replace(/,/g, '')) || 0;
  const debtPayoffNum = parseFloat(debtPayoff.replace(/,/g, '')) || 0;
  
  const quickNetSale = Math.max(0, salePriceNum - costsNum);
  const quickNetEquity = Math.max(0, quickNetSale - debtPayoffNum);
  const quickId45 = addDays(closingDate, 45);
  const quickId180 = addDays(closingDate, 180);

  // Detailed calculations
  const dNetSaleNum = parseFloat(dNetSale.replace(/,/g, '')) || 0;
  const dDebtNum = parseFloat(dDebt.replace(/,/g, '')) || 0;
  const dOrigNum = parseFloat(dOrig.replace(/,/g, '')) || 0;
  const dImprovNum = parseFloat(dImprov.replace(/,/g, '')) || 0;
  const dDeprSLNum = parseFloat(dDeprSL.replace(/,/g, '')) || 0;
  const dDeprAccNum = parseFloat(dDeprAcc.replace(/,/g, '')) || 0;
  const dDefGainNum = parseFloat(dDefGain.replace(/,/g, '')) || 0;
  const dRecapRateNum = (parseFloat(dRecapRate.replace(/,/g, '')) || 0) / 100;
  const dFedRateNum = (parseFloat(dFedRate.replace(/,/g, '')) || 0) / 100;
  const dMedRateNum = (parseFloat(dMedRate.replace(/,/g, '')) || 0) / 100;
  const dStateRateNum = (parseFloat(dStateRate.replace(/,/g, '')) || 0) / 100;
  
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

  // Auto-fill net sale when sale price and costs change
  useEffect(() => {
    if (salePriceNum > 0 && costsNum >= 0) {
      setDNetSale(quickNetSale.toFixed(2));
    }
  }, [salePrice, costs]);

  // Auto-fill debt when debt payoff changes
  useEffect(() => {
    if (debtPayoffNum > 0) {
      setDDebt(debtPayoffNum.toFixed(2));
    }
  }, [debtPayoff]);

  // Exchange ID generation
  function handleGenerateExchangeId() {
    const sale = dNetSaleNum || quickNetSale;
    const debt = dDebtNum || debtPayoffNum;
    
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
    if (!dNetSaleNum && !dDebtNum) {
      setDError('');
      return;
    }
    if (!dNetSaleNum || dDebtNum > dNetSaleNum) {
      setDError(dDebtNum > dNetSaleNum ? 'Debt payoff cannot exceed net selling price.' : 'Enter a valid net selling price and debt payoff.');
    } else {
      setDError('');
    }
  }, [dNetSale, dDebt]);

  return (
    <section id="simple1031-calculator">
      <div id="s1031-wrap">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 4 }}>
          <img src="/static/1031_TEO_Logo.svg" alt="Simple1031 Logo" style={{ height: 80, width: 'auto', borderRadius: 8, padding: 4 }} />
          <div id="s1031-title">Exchange Enrollment Form</div>
        </div>
        
        <div id="s1031-detailed" style={{ display: 'block' }}>
          <div className="s1031-section">
            <div className="s1031-row-grid">
              {/* Quick calculator fields */}
              <div className="s1031-row" style={{ marginBottom: '14px' }}>
                <div className="s1031-label">Sale Price (Relinquished Asset)</div>
                <div className="s1031-input-wrap">
                  <input className="s1031-input" id="salePrice" type="text" placeholder="Total contract price" value={salePrice} onChange={e => handleDetailedNumberInput(e, setSalePrice)} />
                </div>
              </div>
              <div className="s1031-row" style={{ marginBottom: '14px' }}>
                <div className="s1031-label">Closing Costs</div>
                <div className="s1031-input-wrap">
                  <input className="s1031-input" id="costs" type="text" placeholder="Commissions, title, etc." value={costs} onChange={e => handleDetailedNumberInput(e, setCosts)} />
                </div>
              </div>
              <div className="s1031-row" style={{ marginBottom: '14px' }}>
                <div className="s1031-label">Debt Payoff at Closing</div>
                <div className="s1031-input-wrap">
                  <input className="s1031-input" id="debtPayoff" type="text" placeholder="Mortgage payoff" value={debtPayoff} onChange={e => handleDetailedNumberInput(e, setDebtPayoff)} />
                </div>
              </div>
              <div className="s1031-row" style={{ marginBottom: '14px' }}>
                <div className="s1031-label">Relinquished Closing Date</div>
                <div className="s1031-input-wrap">
                  <input className="s1031-input s1031-input-date" id="closingDate" type="date" value={closingDate} onChange={e => setClosingDate(e.target.value)} />
                </div>
              </div>
              
              {/* Net sale and debt */}
              <div className="s1031-row" style={{ marginBottom: '14px' }}>
                <div className="s1031-label">Net Selling Price (Sale − Costs)</div>
                <div className="s1031-input-wrap">
                  <input className="s1031-input" id="d-netSale" type="text" placeholder="Auto-filled from above" value={dNetSale} onChange={e => handleDetailedNumberInput(e, setDNetSale)} />
                </div>
                <div className="s1031-detail-output" id="d-netSale-out">{dNetSale ? `Net sale: $${Number(dNetSale.replace(/,/g, '')).toLocaleString()}` : ''}</div>
              </div>
              <div className="s1031-row" style={{ marginBottom: '14px' }}>
                <div className="s1031-label">Debt Payoff at Closing</div>
                <div className="s1031-input-wrap">
                  <input className="s1031-input" id="d-debt" type="text" placeholder="Auto-filled from above" value={dDebt} onChange={e => handleDetailedNumberInput(e, setDDebt)} />
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
                  <div className="s1031-summary-pair"><span className="s1031-summary-label">Adjusted Basis</span><span className="s1031-summary-value">${fmt(dAdjBasis)}</span></div>
                  <div className="s1031-summary-pair"><span className="s1031-summary-label">Realized Gain</span><span className="s1031-summary-value">${fmt(dRealGain)}</span></div>
                  <div className="s1031-summary-pair"><span className="s1031-summary-label">Recapture Base</span><span className="s1031-summary-value">${fmt(dRecapBase)}</span></div>
                  <div className="s1031-summary-pair"><span className="s1031-summary-label">Recapture Tax</span><span className="s1031-summary-value">${fmt(dRecapTax)}</span></div>
                </div>
                <div className="s1031-summary-split-col">
                  <div className="s1031-summary-pair"><span className="s1031-summary-label">Fed CG Tax</span><span className="s1031-summary-value">${fmt(dFedTax)}</span></div>
                  <div className="s1031-summary-pair"><span className="s1031-summary-label">Medicare</span><span className="s1031-summary-value">${fmt(dMedTax)}</span></div>
                  <div className="s1031-summary-pair"><span className="s1031-summary-label">State</span><span className="s1031-summary-value">${fmt(dStTax)}</span></div>
                </div>
              </div>
              <div className="s1031-summary-detailed-bottom-row">
                <div className="s1031-summary-highlight-detailed">
                  Total Estimated Capital Gains Tax: ${fmt(dTotalTax)}<br />
                  Estimated After-Tax Equity (no 1031): ${fmt(dAfterTaxEq)}
                </div>
                <div className="s1031-summary-deadlines-detailed">
                  <strong>§1031 Targets:</strong>
                  <div className="s1031-deadline-item">Min Replacement ≈ ${fmt(dMinRepl)}</div>
                  <div className="s1031-deadline-item">Equity to Reinvest ≈ ${fmt(dEqReinvest)}</div>
                  <div className="s1031-deadline-item">Debt to Replace or cash-substitute ≈ ${fmt(dDebtRepl)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
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