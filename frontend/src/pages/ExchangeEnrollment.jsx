import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function ExchangeEnrollment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  const [formData, setFormData] = useState({
    sale_price: '',
    equity_rollover: '',
    closing_date: ''
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('/whoami/');
      if (response.data.authenticated) {
        setUser(response.data.user);
      } else {
        // Redirect to login if not authenticated
        navigate('/SE/login');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      navigate('/SE/login');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatCurrency = (value) => {
    // Remove non-numeric characters except decimal
    const num = value.replace(/[^\d.]/g, '');
    if (!num) return '';
    
    // Format with commas
    const parts = num.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return '$' + parts.join('.');
  };

  const handleCurrencyChange = (e) => {
    const { name, value } = e.target;
    const formatted = formatCurrency(value);
    setFormData(prev => ({
      ...prev,
      [name]: formatted
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Clean currency values before sending
      const cleanCurrency = (val) => val.replace(/[$,]/g, '');

      const payload = {
        sale_price: cleanCurrency(formData.sale_price),
        equity_rollover: cleanCurrency(formData.equity_rollover),
        closing_date: formData.closing_date
      };

      const response = await api.post('/exchange-ids/', payload);

      if (response.data && response.data.exchange_id) {
        // Success - show exchange ID and redirect to profile
        alert(`Success! Your Exchange ID is: ${response.data.exchange_id}\n\nYou can now like properties on the marketplace.`);
        navigate('/SE/profile');
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      setError(err.response?.data?.error || 'Failed to create exchange ID. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-[#003366] mb-2">Create Exchange ID</h1>
        <p className="text-gray-600 mb-8">
          Enter your 1031 exchange details to get started. You can create multiple exchange IDs to track different exchanges.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="sale_price" className="block text-sm font-medium text-gray-700 mb-2">
              Sale Price of Relinquished Property *
            </label>
            <input
              type="text"
              id="sale_price"
              name="sale_price"
              value={formData.sale_price}
              onChange={handleCurrencyChange}
              placeholder="$1,000,000"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="equity_rollover" className="block text-sm font-medium text-gray-700 mb-2">
              Equity to Rollover *
            </label>
            <input
              type="text"
              id="equity_rollover"
              name="equity_rollover"
              value={formData.equity_rollover}
              onChange={handleCurrencyChange}
              placeholder="$400,000"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="closing_date" className="block text-sm font-medium text-gray-700 mb-2">
              Expected Closing Date *
            </label>
            <input
              type="date"
              id="closing_date"
              name="closing_date"
              value={formData.closing_date}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] focus:border-transparent"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Once you create an Exchange ID, you can use it to like properties on the marketplace 
              and track your replacement candidates for this specific 1031 exchange.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#003366] text-white py-3 px-6 rounded-lg font-semibold 
                       hover:bg-[#004488] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Exchange ID'}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/SE/profile')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold 
                       hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-3">What happens next?</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>You'll receive a unique Exchange ID (format: E-1004-01)</li>
          <li>Browse properties on the marketplace at <span className="font-mono text-sm">/SE/hub</span></li>
          <li>Click the heart icon on properties to add them to your replacement candidates</li>
          <li>View your liked properties organized by Exchange ID in your profile</li>
        </ol>
      </div>
    </div>
  );
}

export default ExchangeEnrollment;
