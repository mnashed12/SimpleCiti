import '../styles/irs.css'

export default function IRS() {
  return (
    <div className="irs-root">
      <div className="header-image"><img src="/static/irsprocess.jpg" alt="IRS Process" /></div>
      <div className="irs-education-container">
        <h1 className="page-title">IRS Guidelines & 1031 Education</h1>

        <div className="section">
          <h2 className="section-title">The Regulatory Baseline — and How Others Abuse It</h2>
          <p className="section-intro">The IRS created Section 1031 to encourage reinvestment—not entrapment. Yet many sponsors weaponize it to trap capital indefinitely. Understanding the rules is how you avoid the traps.</p>

          <h3 className="subsection-title">The IRS Foundation</h3>
          <ul>
            <li><strong>Like-Kind Property:</strong> Real estate held for investment or business use. Personal residences don't qualify.</li>
            <li><strong>45-Day Identification:</strong> Replacement properties must be identified in writing within 45 days.</li>
            <li><strong>180-Day Closing:</strong> The acquisition must close within 180 days of sale.</li>
            <li><strong>Qualified Intermediary:</strong> A third-party custodian must hold proceeds.</li>
            <li><strong>Equal or Greater Value:</strong> All proceeds and debt must be reinvested to defer full tax.</li>
          </ul>

          <p className="section-intro">The IRS defines compliance—not execution. It doesn't manage the quality of your deal, your governance, or your control. That's where we step in.</p>
        </div>

        <div className="section">
          <h2 className="section-title">Benefits of a Proper 1031 Exchange</h2>
          <ul>
            <li><strong>Full Tax Deferral</strong> – Keep your capital compounding, not paying the IRS.</li>
            <li><strong>Portfolio Growth</strong> – Trade up to larger assets or multiple properties.</li>
            <li><strong>Diversification</strong> – Expand into new markets and sectors.</li>
            <li><strong>Leverage Optimization</strong> – Use pre-tax equity to secure institutional financing.</li>
            <li><strong>Estate Planning Efficiency</strong> – Step-up in basis can eliminate deferred taxes for heirs.</li>
          </ul>
        </div>

        <div className="section tic-section">
          <h2 className="section-title">Tenant-in-Common (TIC): The Smarter Path</h2>

          <div className="tic-content">
            <div className="tic-logo">
              <div className="logo-box">
                <img src="/static/simpleexchangeprocess.png" alt="Simple1031" />
              </div>
            </div>

            <div className="tic-text">
              <p><strong>Simple1031™</strong> structures IRS-qualified TICs under Revenue Procedure 2002-22. It's not a new idea—it's the correct one.</p>
              <ul>
                <li>You hold direct title—not trust units.</li>
                <li>You vote on every major decision.</li>
                <li>You can exit without sponsor permission.</li>
              </ul>
              <p className="highlight-text">TICs, when managed institutionally, combine autonomy and scale—what DSTs pretend to offer but legally can't deliver.</p>
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">DST & UPREIT Risks</h2>
          <p className="section-intro">The hidden truth: most DST sponsors design the exit, not for you, but for themselves.</p>
          <ul>
            <li><strong>721 UPREIT Conversions</strong> turn your property into illiquid REIT shares.</li>
            <li><strong>Refinancing Games</strong> let managers extract equity and fees while you remain frozen.</li>
            <li><strong>No Improvement Clauses</strong> block appreciation potential.</li>
          </ul>
          <p className="closing-statement">A DST investor can spend a decade "deferred," yet earn less than inflation, watching fees eat returns.</p>
        </div>

        <div className="section">
          <h2 className="section-title">The Simple1031™ Alternative</h2>
          <p className="section-intro">We rebuilt 1031 investing around transparency, governance, and control. The IRS provides the law; we provide the system that keeps it working for you.</p>
          <p className="section-intro"><strong>If you're going to play the 1031 game—play to win.</strong></p>
        </div>
      </div>
    </div>
  )
}
