import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../styles/homepage.css'

export default function HomePage() {
  useEffect(() => {
    const storageKey = 'tooltipShown'
    
    function showTooltip() {
      const overlay = document.getElementById('tooltip-overlay')
      const btn = document.getElementById('marketplace-btn')
      if (!overlay || !btn) return
      
      const highlight = overlay.querySelector('.tooltip-highlight')
      const text = overlay.querySelector('.tooltip-text')

      overlay.style.display = 'block'
      const rect = btn.getBoundingClientRect()

      if (highlight) {
        highlight.style.top = rect.top + 'px'
        highlight.style.left = rect.left + 'px'
        highlight.style.width = rect.width + 'px'
        highlight.style.height = rect.height + 'px'
      }

      if (text) {
        text.style.top = (rect.bottom + 8 + window.scrollY) + 'px'
        text.style.left = (rect.left + rect.width / 2 - text.offsetWidth / 2 + window.scrollX) + 'px'
      }

      overlay.classList.add('show')
      overlay.addEventListener('click', () => {
        overlay.style.display = 'none'
        localStorage.setItem(storageKey, 'true')
      })
    }

    if (!localStorage.getItem(storageKey)) {
      showTooltip()
    }
  }, [])

  return (
    <div className="homepage-root">
      <div style={{ position: 'relative' }}>
        <div className="header-image">
          <img src="/static/processlogoheader.png" alt="Process Header" />
        </div>
        <Link to="/enrollment" style={{ textDecoration: 'none' }}>
          <div className="enrollment-btn" id="marketplace-btn">
            <h1>Start new 1031 Exchange</h1>
          </div>
        </Link>
      </div>

      <div className="header">
        <h1>America's most complete 1031 ecosystem. One platform. A symphony of solutions.</h1>
      </div>

      <div className="ecosystem-main-container">
        <div className="ecosystem-sidebar-tabs">
          <img src="/static/usvsthem.svg" alt="Us vs Them" />
        </div>

        <div className="ecosystem-content-wrapper">
          <div className="ecosystem-rows-container">
            <div className="ecosystem-comparison-row">
              <div className="ecosystem-logo-container">
                <img src="/static/simpleexchangeprocess.svg" alt="Simple1031" />
              </div>
              <div className="ecosystem-text-content">
                <h2>Welcome to Simple1031™ - The Exchange Orchestra™ — The Pure-Play 1031™ Platform.</h2>
                <p>
                  We rebuilt 1031 investing from the ground up—Wrapper-Free™ and direct by design. This is Own the Deed™ ownership, not fractional interests buried inside DSTs, REITs, UPREITs, or pooled LLCs. At Simple1031 Exchange™, you stay on title, preserve refinance flexibility, and maintain full tax deferral while accessing professional services across the SimpleCITI™ Ecosystem as needed.
                  <br /><br />
                  Simple1031 Exchange™ serves as the coordinating hub—helping investors select, engage, and oversee affiliated entities that operate under separate service agreements. SimpleADVISORY™, a registered investment adviser, provides higher-level asset management and fiduciary oversight only when formally retained through a written Investment Management Agreement (IMA). SimpleMANAGE™ handles property operations and reporting, SimpleBRICKS™ manages construction and renovations, and SimpleREALTY™ oversees leasing and sales. You choose the scope, we synchronize the execution—direct, deed-based ownership with institutional infrastructure on demand.
                  <br /><br />
                  We are not a DST, REIT, UPREIT, or pooled Fund. We don't use Trusts or stacked LLCs that separate you from your property. No wrapper entities, no forced rollovers, no capital lockups. Simple1031 Exchange™ keeps ownership transparent and under your control—Pure-Play 1031™. Wrapper-Free™. Own the Deed™. Exchange Orchestra™.
                </p>
              </div>
            </div>

            <div className="ecosystem-comparison-row">
              <div className="ecosystem-logo-container">
                <div className="dst-company-logo-wrapper">
                  <img src="/static/averagedst.png" alt="Average DST" />
                </div>
              </div>
              <div className="ecosystem-text-content">
                <h2>No DST Handcuffs™ — The Seven Deadly Sins of "Hands-Free" Investing.</h2>
                <p>
                  DSTs and similar pooled structures sell passivity at the cost of control. Investor capital flows through Trusts and LLCs that often convert into REITs via 721 UPREIT transactions, eliminating 1031 eligibility and liquidity. Refinancing is prohibited. Capital calls are blocked. Voting rights disappear. Sponsors control timing, fees, and exits while investors wait.
                  <br /><br />
                  The Seven Deadly Sins of DSTs: no refinance rights, no liquidity, no improvement authority, no voting power, frozen capital, stacked sponsor fees, and opaque reporting. DSTs promise simplicity but deliver restriction. We don't. Simple1031 Exchange™ restores ownership and autonomy—Wrapper-Free™, title-based, and investor-directed—so governance, capital, and performance move in harmony with you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="platform-section">
        <h2>Our 1031 Platform as an Orchestra</h2>
        <p className="platform-description">
          At the center stands Simple1031EXCHANGE, orchestrating every 1031 deal — from sourcing, to legal and tax, to revenue and management.
        </p>

        <div className="platform-orchestration">
          <div className="features-grid">
            <div className="feature-card logo-card">
              <div className="feature-icon">
                <img src="/static/simpleexchangeprocess.svg" alt="Simple1031" />
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <img src="/static/citilogo.svg" alt="SimpleCITI" />
              </div>
              <div className="feature-content">
                <p>Sponsors equity, aligns capital, and co-invests for long-term partnership.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <img src="/static/creditlogo.svg" alt="SimpleCREDIT feature" />
              </div>
              <div className="feature-content">
                <p>Delivers bridge financing to accelerate transactions.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <img src="/static/salogo.svg" alt="SimpleADVISORY" />
              </div>
              <div className="feature-content">
                <p>Provides fiduciary peace of mind through SEC-registered oversight and governance.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <img src="/static/managelogo.svg" alt="SimpleMANAGE" />
              </div>
              <div className="feature-content">
                <p>Oversees property and tenant management, powered by Yardi Voyager automation.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <img src="/static/brickslogo.svg" alt="SimpleBRICKS" />
              </div>
              <div className="feature-content">
                <p>Upgrades and modernizes assets through institutional construction management.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <img src="/static/brokerlogo.svg" alt="SimpleBROKER" />
              </div>
              <div className="feature-content">
                <p>Delivers leasing and sales strategies for maximum performance.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <img src="/static/spaceslogo.svg" alt="SimpleSPACES" />
              </div>
              <div className="feature-content">
                <p>Protects occupancy and reduces vacancy risk through demand insurance programs.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="two-column">
          <div className="section">
            <h2>Strategy & Structuring</h2>
            <p className="section-intro">
              Every client relationship begins with a personalized plan — tax defense, yield optimization,<br />and liquidity planning.
            </p>

            <div className="service-item">
              <img src="/static/salogo.svg" alt="SimpleADVISORY" />
              <div className="service-content">
                <p>Establishes governance and fiduciary protocols.</p>
              </div>
            </div>

            <div className="service-item">
              <img src="/static/creditlogo.svg" alt="SimpleCREDIT feature" />
              <div className="service-content">
                <p>Designs financing structures for maximum leverage efficiency.</p>
              </div>
            </div>

            <div className="service-item">
              <img src="/static/simpleexchangeprocess.png" alt="SimpleEXCHANGE service" />
              <div className="service-content">
                <p>Structures the deal to preserve autonomy while maximizing full IRS compliance. We are America's first "passive-with-power" 1031 platform — delegating execution, never control, in a single, easy while delegating execution.</p>
              </div>
            </div>
          </div>

          <div className="section">
            <h2>Identification & Acquisition</h2>
            <p className="section-intro">
              Where others scramble into the Big 45 day rule, we provide pre-underwritten, off-market deals in supply-constrained, multifamily, self-storage, marina, and manufactured housing communities.
            </p>

            <div className="service-item">
              <img src="/static/brokerlogo.svg" alt="SimpleBROKER" />
              <div className="service-content">
                <p>Identifies and negotiates for deal flow efficiency.</p>
              </div>
            </div>

            <div className="service-item">
              <img src="/static/salogo.svg" alt="SimpleADVISORY" />
              <div className="service-content">
                <p>Validates compliance and governance.</p>
              </div>
            </div>

            <div className="service-item">
              <img src="/static/creditlogo.svg" alt="SimpleCREDIT feature" />
              <div className="service-content">
                <p>Ensures capital readiness and financing efficiency. Our platform sources, underwrites, and co-invests — not just sells.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="two-column">
          <div className="section">
            <h2>Integration & Oversight</h2>
            <p className="section-intro">
              After closing, we shift seamlessly from acquisition to active performance management.
            </p>

            <div className="service-item">
              <img src="/static/managelogo.svg" alt="SimpleMANAGE" />
              <div className="service-content">
                <p>Maximizes NOI and maintains compliance.</p>
              </div>
            </div>

            <div className="service-item">
              <img src="/static/brokerlogo.svg" alt="SimpleBROKER" />
              <div className="service-content">
                <p>Manages leasing strategies and market repositioning. You get institutional operations without institutional friction.</p>
              </div>
            </div>

            <div className="service-item">
              <img src="/static/brickslogo.svg" alt="SimpleBRICKS" />
              <div className="service-content">
                <p>Executes CapEx plans and value-add improvements.</p>
              </div>
            </div>
          </div>

          <div className="section">
            <h2>Exit Strategy</h2>
            <p className="section-intro">
              You decide when to sell, refinance, or re-exchange.
            </p>

            <div className="service-item">
              <img src="/static/brokerlogo.svg" alt="SimpleBROKER" />
              <div className="service-content">
                <p>Runs the sale process.</p>
              </div>
            </div>

            <div className="service-item">
              <img src="/static/creditlogo.svg" alt="SimpleCREDIT feature" />
              <div className="service-content">
                <p>Handles debt and liquidity events.</p>
              </div>
            </div>

            <div className="service-item">
              <img src="/static/salogo.svg" alt="SimpleADVISORY" />
              <div className="service-content">
                <p>Prepares for your next conquest exchange.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="governance-section">
          <h2>Governance & Lifecycle Control - Your Building, Your Decision!</h2>
          <p>
            All major decisions — refinancing, sale, or capital improvements — require investor approval. Simple1031EXCHANGE orchestrates this governance framework. You get passive returns with passive management and active decision making.
          </p>
        </div>

        <div className="quote-section">
          <blockquote>
            "The IRS wrote the rules. DST sponsors built traps. Simple1031EXCHANGE built freedom. America's only full-service 1031 platform — institutional execution with personal control."
          </blockquote>
        </div>
      </div>

      <div id="tooltip-overlay" style={{ display: 'none' }}>
        <div className="tooltip-highlight"></div>
        <div className="tooltip-text">
          Start here
          <div className="tooltip-arrow"></div>
        </div>
      </div>
    </div>
  )
}
