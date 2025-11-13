import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import '../styles/sins.css'

export default function Sins() {
  useEffect(() => {
    const saved = sessionStorage.getItem('scrollPosition')
    if (saved !== null) {
      window.scrollTo(0, parseInt(saved, 10) || 0)
      sessionStorage.removeItem('scrollPosition')
    }
  }, [])

  const saveScroll = () => sessionStorage.setItem('scrollPosition', String(window.scrollY))

  return (
    <div className="sins-root">
      {/* Tabs Navigation */}
      <div className="tabs-container">
        <Link to="/Sins" className="tab-button active" onClick={saveScroll}>7 DEADLY SINS</Link>
        <Link to="/DST-Process" className="tab-button" onClick={saveScroll}>DST 721/ UPREIT PROCESS</Link>
        <Link to="/US-v-THEM" className="tab-button" onClick={saveScroll}>US v THEM</Link>
      </div>

      <div className="header-image">
        <img src="/static/deadlyheader.jpg" alt="Header" />
        <h2 className="tab-header">DST 721/UPREIT RISKS: LOCK-INS</h2>
      </div>

      <div className="container">
        <h1>The Seven Deadly Sins of DSTs — And Why "We Don't"<span className="asterisk">*</span></h1>

        <div className="header-row">
          <div><img src="/static/averagedst.png" className="theydo" alt="They do" /></div>
          <div className="header-dsts"></div>
          <div><img src="/static/simpleexchangeprocess.svg" className="wedo" alt="We do" /></div>
          <div className="header-we-dont"></div>
        </div>

        {/* Sins 1-7 */}
        {[1,2,3,4,5,6,7].map((n) => (
          <div className="sin-row" key={n}>
            <div className={`number-box sin${n}`}>{n}</div>
            <div className="dsts-column">
              <div className="sin-title">{sinTitle[n]}</div>
              <div className="sin-description">{sinDesc[n]}</div>
            </div>
            <div className={`color-bar bar${n}`}></div>
            <div className="we-dont-column">
              <div className="we-dont-title">We don't.</div>
              <div className="we-dont-description">{weDont[n]}</div>
            </div>
          </div>
        ))}

        <div className="footer-note">
          *Every claim here ties directly to DST structural limits under IRS Rev. Rul. 2004-86 and common trust-sponsor practices, keeping the language sharp, factual, and fully compliant.
        </div>
      </div>
    </div>
  )
}

const sinTitle = {
  1: 'Prohibit Refinancing or Loan Modifications.',
  2: 'Force 721 UPREIT Conversions.',
  3: 'Impose Stock Lock-Ups and Liquidity Limits.',
  4: 'Centralize Power with the Sponsor.',
  5: 'Freeze Capital.',
  6: 'Strip Investors of Direct Ownership.',
  7: 'Limit Transparency and Flexibility.'
}

const sinDesc = {
  1: "Under IRS Revenue Ruling 2004-86, DSTs can't refinance or alter debt terms—even when markets shift or loans mature—locking the trust and investors into outdated financing.",
  2: 'At loan maturity, many DSTs roll investors into another company\'s stock, erasing 1031 eligibility and ownership control.',
  3: 'Investors face six-month REIT restrictions and illiquid shares that are difficult to sell or value.',
  4: 'Investors have no vote or authority over refinance, sale, or major decisions.',
  5: 'No new equity, reinvestment, or partial cash-outs once the DST is formed.',
  6: 'DSTs classify investors as passive beneficiaries, not titled owners.',
  7: 'Sponsors control information and timing, leaving investors in the dark.'
}

const weDont = {
  1: 'You can refinance or restructure financing as markets evolve.',
  2: 'You stay in direct 1031 ownership—no forced rollovers or stock conversions.',
  3: 'You hold deeded real estate with freedom to sell, refinance, or exchange on your timeline.',
  4: 'Sponsors manage—owners decide. You retain control while professionals execute.',
  5: 'You can raise or return capital when strategy demands it.',
  6: 'You hold real-property title—true ownership, not a beneficial interest.',
  7: 'You receive full property-level reporting, loan visibility, and operational transparency.'
}
