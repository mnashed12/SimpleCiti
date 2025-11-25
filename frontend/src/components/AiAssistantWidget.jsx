import React, { useState } from 'react';
import './aiAssistantWidget.css';

export default function AiAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [suggestion, setSuggestion] = useState({
    type: '',
    title: '',
    impact: '',
    urgency: '',
    details: '',
    contactable: false,
  });
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: "Hello! I'm your Simple1031™ AI assistant. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState('');

  function handleSuggestionChange(e) {
    const { name, value, type, checked } = e.target;
    setSuggestion(s => ({
      ...s,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  const [suggestionStatus, setSuggestionStatus] = useState('');

  async function handleSuggestionSubmit(e) {
    e.preventDefault();
    setSuggestionStatus('');
    try {
      const response = await fetch('/api/suggest/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(suggestion)
      });
      const data = await response.json();
      if (data.success) {
        setSuggestionStatus('Thank you! Your suggestion has been sent.');
        setSuggestion({type:'',title:'',impact:'',urgency:'',details:'',contactable:false});
      } else {
        setSuggestionStatus('Sorry, there was an error submitting your suggestion.');
      }
    } catch (error) {
      setSuggestionStatus('Sorry, there was an error connecting to the server.');
    }
  }

  function handleChatSend() {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { sender: 'user', text: chatInput }]);
    setChatInput('');
    // Add bot response logic here
  }

  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  return (
    <div className="ai-assistant-widget-container">
      <button
        className="ai-assistant-toggle-btn"
        aria-label="Toggle AI Assistant"
        onClick={() => setOpen((prev) => !prev)}
      >
        {!open ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" fill="#4f46e5"/>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="#ef4444"/>
          </svg>
        )}
      </button>
      {open && (
        <div className="ai-assistant-panel">
          <div className="ai-assistant-panels">
            {/* Suggestion Box Panel */}
            <div className="suggestion-box-panel">
              <div className="suggestion-header">
                <img className="chat-logo" src="/static/simple1031white.svg" alt="Logo" />
                <div className="suggestion-header-info">
                  <h3>Suggest to CEO</h3>
                  <p>Ideas Welcome</p>
                </div>
              </div>
              <form className="suggestion-box-content" autoComplete="off" onSubmit={handleSuggestionSubmit}>
                <div className="suggestion-row">
                  <div className="control">
                    <label>Suggestion Type</label>
                    <select name="type" value={suggestion.type} onChange={handleSuggestionChange} required>
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
                    <label>Short Title</label>
                    <input name="title" type="text" maxLength={80} placeholder="Brief headline..." value={suggestion.title} onChange={handleSuggestionChange} required />
                  </div>
                </div>
                <div className="suggestion-row">
                  <div className="control">
                    <label>Potential Impact</label>
                    <select name="impact" value={suggestion.impact} onChange={handleSuggestionChange} required>
                      <option value="" disabled>Select impact…</option>
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                  <div className="control">
                    <label>Urgency</label>
                    <select name="urgency" value={suggestion.urgency} onChange={handleSuggestionChange} required>
                      <option value="" disabled>Select urgency…</option>
                      <option>Critical</option>
                      <option>Important</option>
                      <option>Suggestion</option>
                    </select>
                  </div>
                </div>
                <div className="control">
                  <label>Details</label>
                  <textarea name="details" maxLength={500} placeholder="Describe the problem, proposed solution, and expected outcome..." value={suggestion.details} onChange={handleSuggestionChange} />
                  <div className="counter">{suggestion.details.length}/500</div>
                </div>
                <div className="checkbox">
                  <input name="contactable" type="checkbox" checked={suggestion.contactable} onChange={handleSuggestionChange} />
                  <label>I'm open to being contacted.</label>
                </div>
                <div className="actions">
                  <button className="ghost" type="button" onClick={() => setSuggestion({type:'',title:'',impact:'',urgency:'',details:'',contactable:false})}>Clear</button>
                  <button className="btn-suggest" type="submit" disabled={!suggestion.type || !suggestion.title || !suggestion.impact || !suggestion.urgency || !suggestion.details}>SUBMIT IDEA</button>
                </div>
                {suggestionStatus && (
                  <div style={{marginTop:8, color:'#4f46e5', fontWeight:500}}>{suggestionStatus}</div>
                )}
              </form>
            </div>
            {/* Chat Box Panel */}
            <div className="chat-box-panel">
              <div className="chat-header">
                <img className="chat-logo" src="/static/1031_TEO_Logo.svg" alt="Logo" />
                <div className="chat-header-info">
                  <h3>Simple1031™ AI Assistant</h3>
                </div>
              </div>
              <div className="chat-messages">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`chat-message ${msg.sender}`}>
                    <div className="chat-message-avatar">{msg.sender === 'bot' ? 'AI' : 'You'}</div>
                    <div className="chat-message-content">{msg.text}</div>
                  </div>
                ))}
              </div>
              <div className="chat-input-container">
                <div className="chat-input-wrapper">
                  <textarea
                    className="chat-input"
                    placeholder="Type your message..."
                    rows={1}
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                  />
                  <button className="chat-send-btn" type="button" onClick={handleChatSend} aria-label="Send message">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="#4f46e5"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}