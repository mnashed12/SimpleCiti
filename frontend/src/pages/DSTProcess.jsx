import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import '../styles/deadly-sins.css'

export default function DSTProcess() {
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
        <Link to="/SE/DST-Process" className="tab-button active" onClick={saveScroll}>DST 721/ UPREIT PROCESS</Link>
        <Link to="/SE/US-v-THEM" className="tab-button" onClick={saveScroll}>US v THEM</Link>
      </div>

      <div className="header-image">
        <img src="/static/deadlyheader.jpg" alt="Header" />
        <h2 className="tab-header">DST 721/UPREIT RISKS: LOCK-INS</h2>
      </div>

      <div className="container">
        <div className="comparison-section">
          <h2 className="their-header">Their Process – The DST Sponsor Model</h2>
          <div className="two-column-grid">
            <div className="left-column">
              <h3>Passive, Opaque, and Sponsor-Controlled</h3>
              <p>DSTs were designed to create passivity, not performance. Sponsors sell "hands-free investing," but what investors actually get is hands-off control and hands-tied capital.</p>
              <ul>
                <li>No voting rights.</li>
                <li>No voice on refinancing or sale.</li>
                <li>No liquidity.</li>
                <li>No control over your own money.</li>
              </ul>
              <p>Your capital becomes captive. Your future is managed by someone else.</p>
              
              <h3>The Sponsor's Advantage, Your Loss</h3>
              <ul>
                <li>6–9% stacked fees before you see a dollar.</li>
                <li>Forced REIT conversions to avoid refinancing pressure.</li>
                <li>Fee structures that reward delay, not performance.</li>
              </ul>
              <p>DST investors often emerge years later with REIT shares worth less than their principal — unable to 1031 again.</p>
              <p><strong>They don't defer taxes; they defer freedom.</strong></p>
            </div>
            
            <div className="right-column">
              <h3>Refinance Failure & The UPREIT Trap</h3>
              <p>Banks are reluctant to refinance DSTs. With hundreds of fractional investors and no controlling owner, refinancing risk is extreme. When the loan matures, sponsors roll properties into REITs under Section 721 — a move that changes everything:</p>
              <ul>
                <li>Your deed becomes REIT stock.</li>
                <li>You lose 1031 eligibility forever.</li>
                <li>You're locked out of liquidity for six months.</li>
                <li>When you can sell, your shares are illiquid, discounted, and minority-valued.</li>
              </ul>
              <p><strong>It's not deferral. It's detention.</strong></p>
              
              <h3>The Handcuff Clause</h3>
              <p>DSTs legally prohibit investors from participating in management or material decisions. The longer a sponsor holds, the more fees they collect. Investors wait — and pay — while value erodes quietly.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
