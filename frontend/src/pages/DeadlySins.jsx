import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import '../styles/deadly-sins.css'

export default function DeadlySins() {
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
        <Link to="/SE/Sins" className="tab-button active" onClick={saveScroll}>7 DEADLY SINS</Link>
        <Link to="/SE/DST-Process" className="tab-button" onClick={saveScroll}>DST 721/ UPREIT PROCESS</Link>
        <Link to="/SE/US-v-THEM" className="tab-button" onClick={saveScroll}>US v THEM</Link>
      </div>

      <div className="header-image">
        <img src="/static/deadlyheader.jpg" alt="Header" />
        <h2 className="tab-header">DST 721/UPREIT RISKS: LOCK-INS</h2>
      </div>

      <div className="container">
        <h1>The Seven Deadly Sins of DSTs — And Why "We Don't"<span className="asterisk">*</span></h1>
        
        <div className="header-row">
          <div />
          <div className="logo-cell"><img src='/static/averagedst.png' className="dst-logo" alt="Average DST" /></div>
          <div />
          <div className="logo-cell"><img src='/static/simpleexchangeprocess.svg' className="dst-logo" alt="SimpleExchange Process" /></div>
        </div>

        <div className="sin-row">
          <div className="number-box sin1">1</div>
          <div className="dsts-column">
            <div className="sin-title">Prohibit Refinancing or Loan Modifications.</div>
            <div className="sin-description">Under IRS Revenue Ruling 2004-86, DSTs can't refinance or alter debt terms—even when markets shift or loans mature—locking the trust and investors into outdated financing.</div>
          </div>
          <div className="color-bar bar1"></div>
          <div className="we-dont-column">
            <div className="we-dont-title">We don't.</div>
            <div className="we-dont-description">You can refinance or restructure financing as markets evolve.</div>
          </div>
        </div>

        <div className="sin-row">
          <div className="number-box sin2">2</div>
          <div className="dsts-column">
            <div className="sin-title">Force 721 UPREIT Conversions.</div>
            <div className="sin-description">At loan maturity, many DSTs roll investors into another company's stock, erasing 1031 eligibility and ownership control.</div>
          </div>
          <div className="color-bar bar2"></div>
          <div className="we-dont-column">
            <div className="we-dont-title">We don't.</div>
            <div className="we-dont-description">You stay in direct 1031 ownership—no forced rollovers or stock conversions.</div>
          </div>
        </div>

        <div className="sin-row">
          <div className="number-box sin3">3</div>
          <div className="dsts-column">
            <div className="sin-title">Impose Stock Lock-Ups and Liquidity Limits.</div>
            <div className="sin-description">Investors face six-month REIT restrictions and illiquid shares that are difficult to sell or value.</div>
          </div>
          <div className="color-bar bar3"></div>
          <div className="we-dont-column">
            <div className="we-dont-title">We don't.</div>
            <div className="we-dont-description">You hold deeded real estate with freedom to sell, refinance, or exchange on your timeline.</div>
          </div>
        </div>

        <div className="sin-row">
          <div className="number-box sin4">4</div>
          <div className="dsts-column">
            <div className="sin-title">Centralize Power with the Sponsor.</div>
            <div className="sin-description">Investors have no vote or authority over refinance, sale, or major decisions.</div>
          </div>
          <div className="color-bar bar4"></div>
          <div className="we-dont-column">
            <div className="we-dont-title">We don't.</div>
            <div className="we-dont-description">Sponsors manage—owners decide. You retain control while professionals execute.</div>
          </div>
        </div>

        <div className="sin-row">
          <div className="number-box sin5">5</div>
          <div className="dsts-column">
            <div className="sin-title">Freeze Capital.</div>
            <div className="sin-description">No new equity, reinvestment, or partial cash-outs once the DST is formed.</div>
          </div>
          <div className="color-bar bar5"></div>
          <div className="we-dont-column">
            <div className="we-dont-title">We don't.</div>
            <div className="we-dont-description">You can raise or return capital when strategy demands it.</div>
          </div>
        </div>

        <div className="sin-row">
          <div className="number-box sin6">6</div>
          <div className="dsts-column">
            <div className="sin-title">Strip Investors of Direct Ownership.</div>
            <div className="sin-description">DSTs classify investors as passive beneficiaries, not titled owners.</div>
          </div>
          <div className="color-bar bar6"></div>
          <div className="we-dont-column">
            <div className="we-dont-title">We don't.</div>
            <div className="we-dont-description">You hold real-property title—true ownership, not a beneficial interest.</div>
          </div>
        </div>

        <div className="sin-row">
          <div className="number-box sin7">7</div>
          <div className="dsts-column">
            <div className="sin-title">Limit Transparency and Flexibility.</div>
            <div className="sin-description">Sponsors control information and timing, leaving investors in the dark.</div>
          </div>
          <div className="color-bar bar7"></div>
          <div className="we-dont-column">
            <div className="we-dont-title">We don't.</div>
            <div className="we-dont-description">You receive full property-level reporting, loan visibility, and operational transparency.</div>
          </div>
        </div>

        <div className="footer-note">
          *Every claim here ties directly to DST structural limits under IRS Rev. Rul. 2004-86 and common trust-sponsor practices, keeping the language sharp, factual, and fully compliant.
        </div>
      </div>
    </div>
  )
}
