import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState([]);
  const [messages, setMessages] = useState([]);
  const [csrfToken, setCsrfToken] = useState('');

  // Fetch CSRF token on component mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch('/user/login/', {
          credentials: 'include'
        });
        const token = getCookie('csrftoken');
        if (token) {
          setCsrfToken(token);
        }
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
      }
    };
    fetchCsrfToken();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setMessages([]);

    try {
      const response = await fetch('/user/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: new URLSearchParams({
          username: formData.username,
          password: formData.password,
          csrfmiddlewaretoken: csrfToken
        })
      });

  if (response.ok) {
        // Login successful - redirect to Hub
        setMessages([{ text: 'Login successful!', type: 'success' }]);
        // Use window.location to force full page reload and update navigation state
        setTimeout(() => {
          window.location.href = '/SE/Hub';
        }, 300);
      } else {
        setErrors(['Invalid username or password']);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors(['An error occurred. Please try again.']);
    }
  };

  // Get CSRF token from cookies
  const getCookie = (name) => {
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
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-content">
          {messages.length > 0 && (
            <div className="messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.type}`}>
                  {msg.text}
                </div>
              ))}
            </div>
          )}

          {errors.length > 0 && (
            <div className="messages">
              {errors.map((error, idx) => (
                <div key={idx} className="message error">
                  {error}
                </div>
              ))}
            </div>
          )}

          <div className="social-buttons">
            <a href="/accounts/google/login/" className="social-btn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </a>

            <a href="/accounts/microsoft/login/" className="social-btn">
              <svg viewBox="0 0 23 23" fill="currentColor">
                <path fill="#f25022" d="M0 0h11v11H0z"/>
                <path fill="#00a4ef" d="M12 0h11v11H12z"/>
                <path fill="#7fba00" d="M0 12h11v11H0z"/>
                <path fill="#ffb900" d="M12 12h11v11H12z"/>
              </svg>
              <span>Continue with Microsoft</span>
            </a>
          </div>

          <div className="social-divider">
            <span>Or sign in with email or username</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">Email or Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="submit-btn">Login</button>
          </form>

          <div className="form-footer">
            <p>Don't have an account? <a href="/user/register/">Register here</a></p>
          </div>

          <div className="back-link">
            <a href="/SE/">← Back to SimpleEXCHANGE</a>
          </div>
        </div>
      </div>
    </div>
  );
}
