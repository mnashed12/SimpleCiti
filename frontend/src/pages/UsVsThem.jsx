import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import '../styles/deadly-sins.css'

export default function UsVsThem() {
  useEffect(() => {
    const saved = sessionStorage.getItem('scrollPosition')
    if (saved !== null) {
      window.scrollTo(0, parseInt(saved, 10) || 0)
      sessionStorage.removeItem('scrollPosition')
    }
  }, [])

  const saveScroll = () => {
    sessionStorage.setItem('scrollPosition', String(window.scrollY))
  }
  
  return (
    <div className="deadly-sins-root">
      {/* Tabs Navigation */}
      <div className="tabs-container">
        <Link to="/SE/Sins" className="tab-button" onClick={saveScroll}>7 DEADLY SINS</Link>
        <Link to="/SE/DST-Process" className="tab-button" onClick={saveScroll}>DST 721/ UPREIT PROCESS</Link>
        <Link to="/SE/US-v-THEM" className="tab-button active" onClick={saveScroll}>US v THEM</Link>
      </div>

      <div className="header-image">
        <img src="/static/deadlyheader.jpg" alt="Header" />
        <h2 className="tab-header">DST 721/UPREIT RISKS: LOCK-INS</h2>
      </div>

      <div className="container">
        <div className="platform-tagline">
          <p>We are America's only platform that merges full-service management with investor governance.</p>
        </div>
        
        <h2 className="comparison-title">Comparison – Us vs Them</h2>
        
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>DST Sponsor</th>
              <th>Simple1031™</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Ownership Type</strong></td>
              <td>Beneficial trust interest</td>
              <td>Deeded fractional title (TIC)</td>
            </tr>
            <tr>
              <td><strong>Decision Rights</strong></td>
              <td>None – sponsor controls</td>
              <td>Investor voting authority</td>
            </tr>
            <tr>
              <td><strong>Liquidity</strong></td>
              <td>None</td>
              <td>Structured resale or refinance options</td>
            </tr>
            <tr>
              <td><strong>Tax Continuity</strong></td>
              <td>Ends after REIT conversion</td>
              <td>Indefinite 1031 eligibility</td>
            </tr>
            <tr>
              <td><strong>Capital Alignment</strong></td>
              <td>Sponsor profits by holding</td>
              <td>Platform co-invests alongside investors</td>
            </tr>
            <tr>
              <td><strong>Transparency</strong></td>
              <td>Limited PDFs</td>
              <td>Real-time dashboards + audits</td>
            </tr>
            <tr>
              <td><strong>Fees</strong></td>
              <td>6–9% stacked</td>
              <td>3.0–3.5% all-in</td>
            </tr>
            <tr>
              <td><strong>Control Over Sale/Refi</strong></td>
              <td>Sponsor only</td>
              <td>Investor vote required</td>
            </tr>
            <tr>
              <td><strong>Improvements</strong></td>
              <td>Prohibited</td>
              <td>Managed via SimpleBRICKS</td>
            </tr>
            <tr>
              <td><strong>Exit Timing</strong></td>
              <td>Sponsor decides</td>
              <td>Investor decides</td>
            </tr>
          </tbody>
        </table>
        
        <h3 className="bottom-line-title">Bottom Line</h3>
        <p className="bottom-line-text">DSTs promise peace of mind — by taking yours away. <strong>Simple1031™</strong> gives investors all the comfort of passive ownership with the confidence of active control.</p>
      </div>
    </div>
  )
}
