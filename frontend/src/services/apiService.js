import api from './api';

// Property API endpoints
export const propertyService = {
  // Get all active properties with filters
  getProperties: async (params = {}) => {
    const response = await api.get('/properties/', { params });
    return response.data;
  },

  // Get single property detail
  getPropertyDetail: async (referenceNumber) => {
    const response = await api.get(`/properties/${referenceNumber}/`);
    return response.data;
  },

  // Get pipeline properties
  getPipelineProperties: async (params = {}) => {
    const response = await api.get('/pipeline/', { params });
    return response.data;
  },

  // Create new property
  createProperty: async (propertyData) => {
    const response = await api.post('/properties/', propertyData);
    return response.data;
  },

  // Update property
  updateProperty: async (referenceNumber, propertyData) => {
    const response = await api.patch(`/properties/${referenceNumber}/`, propertyData);
    return response.data;
  },

  // Delete property
  deleteProperty: async (referenceNumber) => {
    const response = await api.delete(`/properties/${referenceNumber}/`);
    return response.data;
  },

  // Like a property
  likeProperty: async (referenceNumber) => {
    const response = await api.post(`/properties/${referenceNumber}/like/`);
    return response.data;
  },

  // Unlike a property
  unlikeProperty: async (referenceNumber) => {
    const response = await api.post(`/properties/${referenceNumber}/unlike/`);
    return response.data;
  },

  // Get property filters
  getFilters: async () => {
    const response = await api.get('/property-filters/');
    return response.data;
  },
};

// Exchange ID API endpoints
export const exchangeService = {
  // Get user's exchange IDs
  getExchangeIds: async () => {
    const response = await api.get('/exchange-ids/');
    return response.data;
  },

  // Create new exchange ID
  createExchangeId: async (exchangeData) => {
    const response = await api.post('/exchange-ids/', exchangeData);
    return response.data;
  },

  // Get exchange ID detail
  getExchangeDetail: async (id) => {
    const response = await api.get(`/exchange-ids/${id}/`);
    return response.data;
  },

  // Enroll property to exchange
  enrollProperty: async (propertyReference, exchangeId) => {
    const response = await api.post('/enroll-property/', {
      property_reference: propertyReference,
      exchange_id: exchangeId,
    });
    return response.data;
  },
};

// User profile API endpoints
export const profileService = {
  // Get current user's profile
  getProfile: async () => {
    const response = await api.get('/profile/');
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.patch('/profile/', profileData);
    return response.data;
  },

  // Get user's liked properties
  getUserLikes: async () => {
    const response = await api.get('/user-likes/');
    return response.data;
  },

  // Get dashboard stats (broker only)
  getDashboardStats: async () => {
    const response = await api.get('/dashboard-stats/');
    return response.data;
  },
};

export default {
  propertyService,
  exchangeService,
  profileService,
};
