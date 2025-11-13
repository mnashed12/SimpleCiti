import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import '../styles/sebase.css';

export default function Layout() {
  return (
    <div>
      <Navigation />
      
      {/* Main Content Area */}
      <div className="main-content">
        <Outlet />
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-content">
          <ul className="footer-links">
            <li><a href="/privacy/">Privacy Policy</a></li>
            <li><a href="/cookies/">Cookie Settings</a></li>
            <li><a href="/termsofuse/">Terms of Use</a></li>
            <li><a href="https://adviserinfo.sec.gov/firm/summary/334785/" className="adv-link">Form ADV - SimpleADVISORY SEC Filing</a></li>
            <li><a href="/personalinfo/">Do Not Sell or Share My Personal Information</a></li>
            <li><a href="/accessibility/">Accessibility Statement</a></li>
            <li><a href="/contact/">Contact Us</a></li>
          </ul>

          <div className="footer-legal">
            <p>
              By continuing, you acknowledge and agree to the Terms & Conditions governing the use of Simple1031™ and its affiliates (the "SimpleCITI Affiliates"). Each SimpleCITI Affiliate is a separate legal entity. Investor recourse is limited solely to the specific entity with which you contract, and no liability shall extend to any other affiliate, owner, or manager. SimpleADVISORY is an SEC-registered investment adviser. Its fiduciary duties apply only when a written advisory agreement is executed. Neither Simple1031™ nor any affiliate provides tax or legal advice. You are solely responsible for consulting your own advisors regarding 1031 exchange eligibility, compliance, and investment suitability. All investments require accredited investor status (self-attested). Minimum investment $1M. Maximum 5 investors per TIC structure. LTV financing available 50-70%. Quarterly distributions (adjustable per deal). All disputes shall be resolved by binding arbitration in New York County, New York, under AAA rules.
            </p>
            <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
              ©2025 SimpleCITI Companies. Includes SEC-registered entities where applicable. All rights reserved. Compliant with CCPA, CPRA, GDPR, and applicable U.S. financial regulations.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

