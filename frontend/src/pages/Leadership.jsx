import { useEffect } from 'react';
import '../styles/leadership.css';

function Leadership() {
  useEffect(() => {
    // Intersection Observer for slide-in animations
    const slideInElements = document.querySelectorAll('.slide-in, .slide-in-right');

    const callback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    };

    const observer = new IntersectionObserver(callback, {
      threshold: 0.1
    });

    slideInElements.forEach(el => observer.observe(el));

    return () => {
      slideInElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="leadership-page">
        <h3>Leadership</h3>

        <div className="container">
          <div className="info">
            <img src="/static/shervin.png" alt="Photo of Shervin Zade, SimpleCiti CEO" className="team-img slide-in" />

            <div className="info-text slide-in">
              <h1 className="name">SHERVIN ZADE</h1>
              <h2 className="title">Chief Executive Officer</h2>
            </div>
          </div>

          <p className="bio slide-in">
            Shervin is the driving force behind a network of 17 operating and holding companies under the SimpleCITI Companies
            umbrella. As the head of SimpleCITI Holdings, his strategic vision and operational expertise have positioned him
            as an emerging figure in the real estate, advisory, and asset management sectors. He predominantly focuses on
            SimpleEQUITIES, SimpleADVISORY, Real Estate OpCos, while maintaining rigorous oversight of the Family Office
            HoldCos. His leadership is characterized by a relentless pursuit of innovation and uncompromising regulatory
            compliance. At SimpleADVISORY, Shervin shapes the firm's Registered Investment Advisor (RIA) services, managing
            both proprietary portfolios and externally allocated funds. He seamlessly integrates market insights with cutting-edge investment strategies. His profound understanding of economic cycles and regulations enables him to craft
            sophisticated financial products tailored to institutional investors.
        </p>
      </div>

      <div className="container">
        <div className="info">
          <img src="/static/jay.png" alt="Photo of Jay Schieber" className="team-img slide-in" />

          <div className="info-text slide-in">
            <h1 className="name">JAY SCHIEBER</h1>
            <h2 className="title">Chief Financial & Tax Officer</h2>
          </div>
        </div>

        <p className="bio slide-in">
          With over 30 years of expertise in real estate investment structuring, fund finance, tax strategy, and compliance, Jay has advised institutional investors and family offices on fund formations, tax-advantaged
          investment strategies, and capital structuring while ensuring SEC and IRS compliance. Previously, as Director of Finance at Clipper Equity, he led financial planning, treasury, and tax compliance for a multi-billion-dollar
          portfolio, streamlining operations through Yardi Systems. As CFO & Controller at B&L Management, he helped execute the $690 million sale of 24 Manhattan apartment buildings, overseeing tax structuring to optimize investor returns.
          At SimpleCITI, Jay drives fund structuring, tax strategy, and compliance across investment, advisory, and management entities. He leads capital-efficient structuring at SimpleEQUITIES, tax-advantaged investment vehicles at NovelEquities,
          and fiduciary oversight as CCO of SimpleADVISORY, while also managing propety tax compliance and financial automation at SimpleMANAGE. His expertise in fund structuring, investor tax strategy, and capital markets is
          integral to SimpleCITI's growth and efficiency.
        </p>
      </div>

      <div className="container">
        <div className="info">
          <img src="/static/johnpettit.png" alt="Photo of John Pettit" className="team-img slide-in" />

          <div className="info-text slide-in">
            <h1 className="name">JOHN PETTIT</h1>
            <h2 className="title">Head of Simple1031</h2>
          </div>
        </div>

        <p className="bio slide-in">
          Mr. Pettit leads SimpleEXCHANGES' 1031 platform, bringing over 20 years of experience in real estate investment, portfolio strategy, and asset management. He previously served as SVP of Fund Management at Caliber Companies and spent 15+ years as COO and CEO of a high-net-worth family office managing $775M in assets, doubling AUM and navigating two market cycles. Earlier, he directed capital deployment for a European investor in distressed master-planned communities. His expertise spans multifamily, industrial, office, and retail, and he maintains a national network of institutional partners and operators. Mr. Pettit holds a degree in Commercial Real Estate Management from Penn State University.
        </p>
      </div>

      <div className="container">
        <div className="info">
          <img src="/static/jake.png" alt="Photo of Jake Mehdizadeh" className="team-img slide-in" />

          <div className="info-text slide-in">
            <h1 className="name">JAKE MEHDIZADEH</h1>
            <h2 className="title">Head of Capital Markets</h2>
          </div>
        </div>

        <p className="bio slide-in">
          Jake leads the technological advancements and operational efficiencies at SimpleCITI Companies, bringing a fresh and innovative approach to the Commercial Real Estate and Specialty Finance sectors. A graduate of Boston
          University with a degree in Real Estate and Finance, Jake leverages his expertise in acquisitions, equity capital markets, and industrial warehouse solutions to enhance
          SimpleCITI's diverse portfolio. He also heads SimpleREALTYADVISORS, a CRE brokerage company focused on leasing and investment sales, and SimpleAPPRAISAL, futher expanding SimpleCITI's integrated service offerings.
          Previously, Jake contributed to the Equity Capital Markets team at Thor Equities, where he honed his skills in fund formation, capital raising, and deal flow. Based in New York, Jake is focused on building smarter,
          tech-driven solutions that push SimpleCITI forward.
        </p>
      </div>

      <div className="container">
        <div className="info">
          <img src="/static/remy.png" alt="Photo of Sasha Mehdizadeh" className="team-img slide-in" />

          <div className="info-text slide-in">
            <h1 className="name">REMY MEHDIZADEH</h1>
            <h2 className="title">Director of Leasing</h2>
          </div>
        </div>

        <p className="bio slide-in">
          Remy plays a key role in operations, project management, and cross-departmental initiatives at SimpleCITI Companies. A student at the University of Miami, he brings a proactive and detail-oriented approach to supporting the firm's vertically integrated real estate and finance platform. Remy contributes to internal strategy, marketing, leasing coordination, and investor communications, working closely with leadership to streamline workflows and drive execution. He is focused on building a well-rounded foundation in business while actively supporting company growth.
        </p>
      </div>
    </div>
  );
}

export default Leadership;

