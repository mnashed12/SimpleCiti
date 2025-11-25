import { useState, useEffect } from 'react';
import '../styles/contact.css';

function Contact() {
  const [showMapModal, setShowMapModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [suggestionCharCount, setSuggestionCharCount] = useState(0);
  const [suggestionFormValid, setSuggestionFormValid] = useState(false);

  const [suggestionForm, setSuggestionForm] = useState({
    suggestionType: '',
    title: '',
    impact: '',
    urgency: '',
    suggestionMessage: '',
    contactable: false
  });

  useEffect(() => {
    const { suggestionType, title, impact, urgency } = suggestionForm;
    const isValid = suggestionType && title && impact && urgency;
    setSuggestionFormValid(isValid);
  }, [suggestionForm]);

  const handleSuggestionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSuggestionForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'suggestionMessage') {
      setSuggestionCharCount(value.length);
    }
  };

  const handleCalendlySubmit = (e) => {
    e.preventDefault();
    const select = e.target.querySelector('#calendlySelect');
    const selectedUrl = select.value;
    if (selectedUrl) {
      window.location.href = selectedUrl;
    }
  };

  const handleSuggestionSubmit = (e) => {
    e.preventDefault();
    if (!suggestionFormValid) return;

    // In a real app, you'd submit to your backend here
    // For now, show success toast
    setShowToast(true);
    
    // Reset form
    setSuggestionForm({
      suggestionType: '',
      title: '',
      impact: '',
      urgency: '',
      suggestionMessage: '',
      contactable: false
    });
    setSuggestionCharCount(0);
  };

  const resetSuggestionForm = () => {
    setSuggestionForm({
      suggestionType: '',
      title: '',
      impact: '',
      urgency: '',
      suggestionMessage: '',
      contactable: false
    });
    setSuggestionCharCount(0);
  };

  return (
    <div className="contact-page">
      <section id="contact">
        <h1 className="section-header">Talk To Us</h1>
        
        <div className="contact-wrapper">
          {/* LEFT COLUMN: CONTACT FORM */}
          <div className="form-horizontal">
            <div className="header">
              <div className="title">Contact Form</div>
            </div>

            <form id="contact-form" role="form" action="/contact/submit/" method="POST" autoComplete="on">
              <div style={{ display: 'none' }}>
                <label htmlFor="website">Website</label>
                <input type="text" id="website" name="website" autoComplete="off" />
              </div>

              <div className="form-group row">
                <div className="col-sm-6">
                  <input
                    type="text"
                    className="form-control"
                    id="first-name"
                    placeholder="FIRST NAME"
                    name="firstName"
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div className="col-sm-6">
                  <input
                    type="text"
                    className="form-control"
                    id="last-name"
                    placeholder="LAST NAME"
                    name="lastName"
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>

              <div className="form-group row">
                <div className="col-sm-6">
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    placeholder="EMAIL"
                    name="email"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="col-sm-6">
                  <input
                    type="tel"
                    className="form-control"
                    id="phone"
                    placeholder="PHONE"
                    name="phone"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="col-sm-12">
                  <input
                    type="text"
                    className="form-control"
                    id="company"
                    placeholder="YOUR COMPANY"
                    name="company"
                    autoComplete="organization"
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="col-sm-12">
                  <input type="text" className="form-control" value="Simple1031™" readOnly />
                  <input type="hidden" name="simpleCiti" value="SimpleEXCHANGE" />
                </div>
              </div>

              <div className="form-group">
                <div className="col-sm-12">
                  <input
                    type="text"
                    className="form-control"
                    id="contact-person"
                    placeholder="YOUR CONTACT AT SIMPLE1031™ (If Known)"
                    name="contactPerson"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-group">
                <div className="col-sm-12">
                  <textarea
                    className="form-control"
                    rows="10"
                    placeholder="YOUR MESSAGE HERE"
                    name="message"
                    required
                  ></textarea>
                </div>
              </div>

              <button className="btn btn-primary send-button" type="submit">
                <div className="alt-send-button">
                  <span className="send-text">
                    <i className="fa fa-paper-plane"></i> Submit
                  </span>
                  <span className="send-text">Thank you</span>
                </div>
              </button>
            </form>
          </div>

          <div className="divider"></div>

          {/* MIDDLE COLUMN: CONTACT INFO & BOOKING */}
          <div className="direct-contact-container">
            <div className="header">
              <div className="title">Contact</div>
            </div>
            
            <ul className="contact-list">
              <li className="list-item">
                <img src="/static/googlepin.png" alt="Map Pin" style={{ width: 'auto', height: '40px', transform: 'translateY(45px) translateX(-25px)' }} />
                <span className="contact-text place" style={{ cursor: 'pointer' }} onClick={() => setShowMapModal(true)}>
                  900 Stewart Ave, Suite 210,<br />
                  <span className="indent">Garden City, NY 11530</span>
                </span>
              </li>

              <li className="list-item">
                <img src="/static/phone-icon.png" alt="Phone" style={{ width: 'auto', height: '40px', transform: 'translateY(37px) translateX(-7px)' }} />
                <span className="contact-text phone">
                  <a href="tel:516-464-5500" title="Give us a call"><u>(516) 464-5500</u></a>
                </span>
              </li>

              <li className="list-item">
                <img src="/static/email-icon.png" alt="Email" style={{ width: 'auto', height: '40px', transform: 'translateY(37px) translateX(-7px)' }} />
                <span className="contact-text gmail">
                  <a href="mailto:info@simpleciti.com" title="Send us an email"><u>info@simpleciti.com</u></a>
                </span>
              </li>
            </ul>
            
            <hr />

            <div className="calendar-information">
              <p className="book-meeting-text">Book A Meeting</p>
              <form id="calendlyForm" onSubmit={handleCalendlySubmit}>
                <div className="form-group full-width">
                  <select id="calendlySelect" name="simpleCiti" required>
                    <option value="https://outlook.office.com/book/ShervinZadeBookingPage@simpleciti.com/?ismsaljsauthenabled">Shervin Zade (CEO)</option>
                    <option value="https://calendly.com/rody-mehdizadeh">Rody Mehdizadeh (COO)</option>
                    <option value="https://outlook.office.com/bookwithme/user/9101b11958ea4d1e8f95c52040808742%40simpleciti.com?anonymous&ismsaljsauthenabled">Ira Wishe (CIO)</option>
                    <option value="https://outlook.office365.com/book/G9b342a23f7d94403a3941d8e8901032d@simpleciti.com/">Jay Schieber (CFO)</option>
                    <option value="https://calendly.com/sasha-mehdizadeh">Sasha Mehdizadeh (Director of Development)</option>
                    <option value="https://calendly.com/jakemehdizadeh">Jake Mehdizadeh (Director of Operations)</option>
                    <option value="https://calendly.com/jakemehdizadeh">John Pettit (Director of 1031 Exchanges)</option>
                    <option value="https://outlook.office.com/bookwithme/user/481b9ecc63904627b5de7f7e3d395ac3%40simpleciti.com?anonymous&ismsaljsauthenabled">Remy Mehdizadeh (Director of Leasing)</option>
                  </select>
                </div>
                <button className="btn btn-primary send-button" id="submit" type="submit">
                  <div className="alt-send-button">
                    <span className="send-text">
                      <i className="fa fa-paper-plane"></i> Book
                    </span>
                    <span className="send-text">
                      Take Me To Calendly
                    </span>
                  </div>
                </button>
              </form>
            </div>
            <hr />
          </div>

          <div className="divider"></div>

          {/* RIGHT COLUMN: SUGGESTION BOX */}
          <div className="suggestion-box">
            <div className="header">
              <div className="title">Suggest to CEO</div>
              <div className="subtitle">Your ideas drive what we build next. Be specific and actionable.</div>
              <span className="pill">Ideas Welcome</span>
            </div>

            <form id="suggestForm" onSubmit={handleSuggestionSubmit} noValidate>
              <div className="suggestion-row">
                <div className="control">
                  <label htmlFor="type">SUGGESTION TYPE</label>
                  <select 
                    id="type" 
                    name="suggestionType" 
                    value={suggestionForm.suggestionType}
                    onChange={handleSuggestionChange}
                    required
                  >
                    <option value="" disabled>Select a type…</option>
                    <option disabled>──────── General ────────</option>
                    <option>Website Improvements</option>
                    <option>Process / Workflow Improvement</option>
                    <option>Cost Savings or Efficiency</option>
                    <option>Team Culture / Workplace</option>
                    <option disabled>──────── Product / Biz ────────</option>
                    <option>Type of Asset</option>
                    <option>Location</option>
                    <option>New Feature or Tool</option>
                    <option>Partnership / Collaboration Idea</option>
                    <option>Other Idea</option>
                  </select>
                </div>
                <div className="control">
                  <label htmlFor="title">SHORT TITLE</label>
                  <input 
                    id="title" 
                    name="title" 
                    type="text" 
                    maxLength="80" 
                    value={suggestionForm.title}
                    onChange={handleSuggestionChange}
                    placeholder="e.g., Add progress ring to 45/180-day IRS deadlines" 
                    required 
                  />
                </div>
              </div>

              <div className="suggestion-row">
                <div className="control">
                  <label htmlFor="impact">POTENTIAL IMPACT</label>
                  <select 
                    id="impact" 
                    name="impact" 
                    value={suggestionForm.impact}
                    onChange={handleSuggestionChange}
                    required
                  >
                    <option value="" disabled>Select impact…</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                  <div className="hint">Rough estimate of value if implemented.</div>
                </div>
                <div className="control">
                  <label htmlFor="urgency">URGENCY</label>
                  <select 
                    id="urgency" 
                    name="urgency" 
                    value={suggestionForm.urgency}
                    onChange={handleSuggestionChange}
                    required
                  >
                    <option value="" disabled>Select urgency…</option>
                    <option>Critical</option>
                    <option>Important</option>
                    <option>Suggestion</option>
                  </select>
                  <div className="hint">How time-sensitive is this?</div>
                </div>
              </div>

              <div className="control">
                <label htmlFor="details">DETAILS</label>
                <textarea 
                  id="details" 
                  name="suggestionMessage" 
                  maxLength="500" 
                  value={suggestionForm.suggestionMessage}
                  onChange={handleSuggestionChange}
                  placeholder="Describe the problem, proposed solution, and expected outcome. Include links or examples."
                ></textarea>
                <div className="counter">{suggestionCharCount}/500</div>
                <div className="hint">Specifics beat vibes.</div>
              </div>

              <div className="suggestion-divider"></div>

              <div className="checkbox">
                <input 
                  id="contactable" 
                  name="contactable" 
                  type="checkbox"
                  checked={suggestionForm.contactable}
                  onChange={handleSuggestionChange}
                />
                <label htmlFor="contactable">I'm open to being contacted.</label>
              </div>

              <div className="actions">
                <button className="ghost" type="button" onClick={resetSuggestionForm}>Clear</button>
                <button className="btn-suggest" type="submit" disabled={!suggestionFormValid}>SUBMIT IDEA</button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Map Modal */}
      {showMapModal && (
        <div className="map-modal" onClick={() => setShowMapModal(false)}>
          <div className="map-modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="map-modal-close" onClick={() => setShowMapModal(false)}>&times;</span>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3023.2814897023222!2d-73.5983179!3d40.733831200000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c28998733aaaab%3A0x850912a1b9818307!2sSimpleCITI%20Companies!5e0!3m2!1sen!2sus!4v1753282585211!5m2!1sen!2sus"
              width="100%"
              height="100%"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="SimpleCITI Companies Location"
            ></iframe>
          </div>
        </div>
      )}

      {/* Toast / Success Modal */}
      {showToast && (
        <div className="toast" onClick={() => setShowToast(false)}>
          <div className="toast-card" onClick={(e) => e.stopPropagation()}>
            <div className="check">✔</div>
            <h3>Thanks — sent to the CEO Queue</h3>
            <p>Your suggestion has been received. We'll review and circle back if we need details.</p>
            <div className="actions" style={{ justifyContent: 'center', marginTop: '16px' }}>
              <button className="btn" type="button" onClick={() => setShowToast(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Contact;
