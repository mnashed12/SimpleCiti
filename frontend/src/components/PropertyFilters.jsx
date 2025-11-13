import { useState, useEffect } from 'react';
import { propertyService } from '../services/apiService';

function PropertyFilters({ onFilterChange }) {
  const [filters, setFilters] = useState({
    property_type: '',
    state: '',
    min_price: '',
    max_price: '',
    search: '',
  });
  const [availableFilters, setAvailableFilters] = useState({});

  useEffect(() => {
    loadAvailableFilters();
  }, []);

  const loadAvailableFilters = async () => {
    try {
      const data = await propertyService.getFilters();
      setAvailableFilters(data);
    } catch (err) {
      console.error('Error loading filters:', err);
    }
  };

  const handleChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const emptyFilters = {
      property_type: '',
      state: '',
      min_price: '',
      max_price: '',
      search: '',
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-primary-blue">Filter Properties</h2>
        <button
          onClick={handleReset}
          className="text-sm text-gray-600 hover:text-primary-blue transition"
        >
          Reset Filters
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            placeholder="Property name or location..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
          />
        </div>

        {/* Property Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Type
          </label>
          <select
            value={filters.property_type}
            onChange={(e) => handleChange('property_type', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
          >
            <option value="">All Types</option>
            {availableFilters.property_types?.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* State */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State
          </label>
          <select
            value={filters.state}
            onChange={(e) => handleChange('state', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
          >
            <option value="">All States</option>
            {availableFilters.states?.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range
          </label>
          <select
            onChange={(e) => {
              const range = availableFilters.price_ranges?.[e.target.value];
              if (range) {
                handleChange('min_price', range.min);
                handleChange('max_price', range.max || '');
              } else {
                handleChange('min_price', '');
                handleChange('max_price', '');
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
          >
            <option value="">All Prices</option>
            {availableFilters.price_ranges?.map((range, idx) => (
              <option key={idx} value={idx}>{range.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default PropertyFilters;
