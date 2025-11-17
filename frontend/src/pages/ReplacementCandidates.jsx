import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function ReplacementCandidates() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exchangeIds, setExchangeIds] = useState([]);
  const [likesGrouped, setLikesGrouped] = useState({});
  const [propertyDetails, setPropertyDetails] = useState({});
  const [selectedExchange, setSelectedExchange] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load user's exchange IDs
      const exchangeResponse = await api.get('/exchange-ids/');
      const exchanges = exchangeResponse.data;
      setExchangeIds(Array.isArray(exchanges) ? exchanges : []);

      // Load user likes with exchange ID details
      const likesResponse = await api.get('/user-likes/');
      const likesData = likesResponse.data;
      const likesDetail = likesData.likes_detail || [];

      // Group likes by exchange ID
      const grouped = {};
      likesDetail.forEach(like => {
        const exId = like.exchange_id;
        if (!grouped[exId]) {
          grouped[exId] = {
            exchange_id_name: like.exchange_id_name,
            properties: []
          };
        }
        grouped[exId].properties.push(like);
      });
      setLikesGrouped(grouped);

      // Load full property details for all liked properties
      const uniqueRefs = [...new Set(likesDetail.map(l => l.property_ref))];
      const details = {};
      await Promise.all(
        uniqueRefs.map(async (ref) => {
          try {
            const response = await fetch(`/api/properties/${ref}/`);
            if (response.ok) {
              const data = await response.json();
              details[ref] = data;
            }
          } catch (err) {
            console.error(`Failed to load property ${ref}:`, err);
          }
        })
      );
      setPropertyDetails(details);

      // Auto-select first exchange if exists
      if (exchanges.length > 0) {
        setSelectedExchange(exchanges[0].id);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlike = async (propertyRef, exchangeId) => {
    if (!confirm('Remove this property from your replacement candidates?')) {
      return;
    }

    try {
      const response = await api.post('/unlike-property/', {
        property_id: propertyRef,
        exchange_id: exchangeId
      });

      if (response.data.success) {
        // Reload data to update UI
        loadData();
      } else {
        alert(response.data.error || 'Failed to remove property');
      }
    } catch (error) {
      console.error('Error unliking property:', error);
      alert('Failed to remove property. Please try again.');
    }
  };

  const formatCurrency = (num) => {
    if (!num) return '$0';
    return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <p className="text-gray-600">Loading your replacement candidates...</p>
      </div>
    );
  }

  if (exchangeIds.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-[#003366] mb-4">Replacement Candidates</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-blue-800 mb-4">
            You haven't created any Exchange IDs yet.
          </p>
          <Link
            to="/SE/enrollment"
            className="inline-block bg-[#003366] text-white py-2 px-6 rounded-lg font-semibold hover:bg-[#004488]"
          >
            Create Exchange ID
          </Link>
        </div>
      </div>
    );
  }

  const selectedExchangeData = exchangeIds.find(ex => ex.id === selectedExchange);
  const selectedLikes = likesGrouped[selectedExchange] || { properties: [] };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-[#003366]">Replacement Candidates</h1>
        <Link
          to="/SE/hub"
          className="bg-[#003366] text-white py-2 px-6 rounded-lg font-semibold hover:bg-[#004488]"
        >
          Browse Properties
        </Link>
      </div>

      {/* Exchange ID Selector */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Exchange ID
        </label>
        <select
          value={selectedExchange || ''}
          onChange={(e) => setSelectedExchange(parseInt(e.target.value))}
          className="w-full md:w-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366]"
        >
          {exchangeIds.map(ex => (
            <option key={ex.id} value={ex.id}>
              {ex.exchange_id} - Sale: {formatCurrency(ex.sale_price)} | Equity: {formatCurrency(ex.equity_rollover)}
            </option>
          ))}
        </select>

        {selectedExchangeData && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Sale Price:</span>
              <span className="ml-2 font-semibold">{formatCurrency(selectedExchangeData.sale_price)}</span>
            </div>
            <div>
              <span className="text-gray-600">Equity Rollover:</span>
              <span className="ml-2 font-semibold">{formatCurrency(selectedExchangeData.equity_rollover)}</span>
            </div>
            <div>
              <span className="text-gray-600">Closing Date:</span>
              <span className="ml-2 font-semibold">{formatDate(selectedExchangeData.closing_date)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Properties List */}
      {selectedLikes.properties.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">
            No properties added to this exchange yet.
          </p>
          <Link
            to="/SE/hub"
            className="inline-block text-[#003366] underline font-semibold"
          >
            Browse properties and click the heart icon to add them
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {selectedLikes.properties.length} {selectedLikes.properties.length === 1 ? 'Property' : 'Properties'} Added
          </h2>

          <div className="grid grid-cols-1 gap-6">
            {selectedLikes.properties.map(like => {
              const property = propertyDetails[like.property_ref];
              if (!property) return null;

              const imageUrl = (property.images && property.images.length > 0)
                ? property.images[0]
                : property.image_url || 'https://via.placeholder.com/800x400?text=Property';

              return (
                <div key={like.property_ref} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row">
                  {/* Property Image */}
                  <div className="md:w-1/3">
                    <img
                      src={imageUrl}
                      alt={property.title}
                      className="w-full h-64 md:h-full object-cover"
                    />
                  </div>

                  {/* Property Details */}
                  <div className="md:w-2/3 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-[#003366] mb-1">
                          {property.title}
                        </h3>
                        <p className="text-gray-600">{property.address}</p>
                      </div>
                      <button
                        onClick={() => handleUnlike(like.property_ref, selectedExchange)}
                        className="text-red-600 hover:text-red-800 font-semibold text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-gray-600">Purchase Price</div>
                        <div className="font-bold text-lg">{formatCurrency(property.purchase_price)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Cap Rate</div>
                        <div className="font-bold text-lg">{property.cap_rate}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Total Equity</div>
                        <div className="font-bold text-lg">{formatCurrency(property.total_equity)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Closing Date</div>
                        <div className="font-bold text-lg">{formatDate(property.close_date)}</div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Link
                        to={`/SE/deal-detail/${like.property_ref}`}
                        className="bg-[#003366] text-white py-2 px-6 rounded-lg font-semibold hover:bg-[#004488]"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReplacementCandidates;
