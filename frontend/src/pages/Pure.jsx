import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import '../styles/pure.css'

export default function Pure() {
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
    <div className="pure-root">
      {/* Tabs Navigation */}
      <div className="tabs-container">
        <Link to="/Pure" className="tab-button active" onClick={saveScroll}>Pure Play 1031</Link>
        <Link to="/OwnDeed" className="tab-button" onClick={saveScroll}>Own The Deed</Link>
      </div>

      <div className="container">
        <div className="content-section">
          <h1>The Simple1031™ Advantage – Solving DST Limitations</h1>
          <p className="subtitle">Educational Overview – For Informational Purposes Only</p>

          <h2>Flexible Structure and Active Management</h2>
          <p>Traditional DSTs forbid refinancing or raising new capital once the trust is formed. Simple1031™ addresses this by offering more dynamic deal structures. For example, we may use joint-venture or co-ownership funds that allow sponsors to refinance existing loans or accept additional equity when warranted. This flexibility enables property upgrades or debt reduction over time, rather than locking the asset in a fixed configuration. In practice, investors gain the potential upside of active management (e.g. renovations, expanded amenities, lease-up) that DSTs' "maintenance-only" rules would otherwise prohibit.</p>

          <h2>Investor Oversight and Transparency</h2>
          <p>DST investors typically have no voting rights and very limited visibility into operations. In contrast, Simple1031™ provides robust reporting and communication channels. Every offering comes with an online investor portal where participants can view financial statements, occupancy rates, and property updates in real time. Sponsors on our platform are selected for their communication practices and often involve investor advisory committees. This ensures that major decisions (like large lease deals or sale timing) are shared with investors in advance, giving them transparency and a voice that DST structures legally exclude.</p>

          <h2>Proactive Financing and Value Creation</h2>
          <p>Because DSTs must obey the IRS's "seven deadly sins," they cannot renegotiate debt terms or reinvest proceeds. By contrast, Simple1031™ vehicles permit strategic financing moves. For instance, we can refinance to secure lower interest rates or free up cash for improvements. We also pursue value-add projects (such as property renovations or redevelopment) that DST trusts are not allowed to undertake. In effect, our platform enables a more opportunistic asset-management approach. Instead of passively collecting rent, our sponsors proactively enhance income and asset value – helping investors capture growth that rigid DST rules would miss.</p>

          <h2>Improved Liquidity and Exit Strategies</h2>
          <p>Standard DST interests are generally illiquid and must be held until a sale (often 5–10 years). Simple1031™ structures offer additional exit options. For example, we can stagger properties so that not all assets need to be sold simultaneously, or we can facilitate limited secondary-market transfers among qualified investors. When the time comes to cash out, each investor on our platform has full choice of exit path, such as:</p>
          <ul>
            <li><strong>1031 Exchange:</strong> Reinvest into another qualifying property (maintaining tax deferral).</li>
            <li><strong>Cash Sale:</strong> Take proceeds (ending the deferral and recognizing gains).</li>
            <li><strong>Section 721 Exchange:</strong> Roll into a REIT-like entity for ongoing tax deferral and diversification.</li>
          </ul>
          <p>By contrast to some DST deals that effectively force a single outcome, Simple1031™ lets investors select the best option for their goals. This tiered exit planning gives much more control over timing and tax treatment than a typical DST "forced sale at loan maturity" scenario.</p>

          <h2>Transparent Fees and Sponsor Alignment</h2>
          <p>DST offerings often include upfront sales commissions and ongoing fees (management, disposition, etc.) that can exceed 10% of invested capital, which erode early returns. On Simple1031™, fee structures are made explicit from the outset. Our online platform's efficiencies typically yield lower dealer costs, and sponsors are encouraged to align their interests with investors (for example, by tying a portion of their compensation to performance milestones or net asset value targets). The result is that more of your money goes to work in the real estate, not to hidden commissions. In short, Simple1031™ aims to minimize layers of fees and to make any compensation clear, helping protect investor yields.</p>

          <h2>Suitable Investor Profile</h2>
          <p>Simple1031™ is designed for accredited investors who seek 1031 tax deferral plus greater involvement or flexibility than a DST allows. It remains best for those who want a mostly passive, income-focused real estate investment, but with the peace of mind that comes from detailed oversight. Investors who value transparency, regular updates, and the ability to adjust strategy or exit timing will find our platform more fitting. As always, investors should review each sponsor's track record, financing terms, and exit plan carefully. Working with tax and legal advisors is recommended to ensure that any Simple1031™ investment matches one's goals and compliance needs.</p>

          <h3>Key Takeaway</h3>
          <p>Simple1031™ combines the tax-deferral benefits of 1031 exchanges with modern flexibility and transparency. By structuring deals for strategic financing, enhanced reporting, and multiple exit routes, our platform overcomes many of the limitations inherent in DSTs. Investors still get access to large, institutional-quality properties, but with far more adaptability. Prospective users should examine the details of each offering and consult advisors, as with any complex investment.</p>

          <div className="disclaimer-box">
            <p><strong>Disclaimer:</strong> This summary is for educational purposes only and does not constitute legal, tax, or investment advice. Investors should seek independent counsel regarding the suitability of any 1031 exchange, DST, TIC, 721 or other real estate investment strategy.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
