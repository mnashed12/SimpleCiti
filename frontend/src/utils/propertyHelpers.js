// Utility functions for property data formatting and calculations

/**
 * Calculate days remaining until closing date
 * @param {string} closeDate - ISO date string
 * @returns {number} - Days until closing (minimum 0)
 */
export const calculateDaysUntilClosing = (closeDate) => {
  if (!closeDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const close = new Date(closeDate);
  close.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((close - today) / (1000 * 3600 * 24)));
};

/**
 * Format date to M/D/YYYY
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

/**
 * Format number as currency with optional decimals
 * @param {number} value - Numeric value
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (value, decimals = 2) => {
  if (value === null || value === undefined) return 'N/A';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format large numbers with M/K suffixes
 * @param {number} value - Numeric value
 * @param {number} decimals - Decimal places for M/K values
 * @returns {string} - Formatted string
 */
export const formatLargeNumber = (value, decimals = 1) => {
  if (value === null || value === undefined) return 'N/A';
  
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(decimals)}M`;
  }
  
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(decimals)}K`;
  }
  
  return `$${formatCurrency(value, 0)}`;
};

/**
 * Format percentage with optional decimals
 * @param {number} value - Percentage value
 * @param {number} decimals - Decimal places
 * @returns {string} - Formatted percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Build full address string from property location
 * @param {object} property - Property object
 * @returns {string} - Full address
 */
export const buildFullAddress = (property) => {
  if (!property) return '';
  
  const parts = [
    property.address,
    property.location?.city || property.city,
    property.location?.state || property.state,
  ].filter(Boolean);
  
  return parts.join(', ').toUpperCase();
};

/**
 * Get asset type display name
 * @param {string} type - Property type
 * @returns {string} - Formatted asset type
 */
export const getAssetType = (type) => {
  if (!type) return 'Asset';
  
  const typeMap = {
    multifamily: 'Multifamily',
    office: 'Office',
    retail: 'Retail',
    industrial: 'Industrial',
    'mixed-use': 'Mixed Use',
  };
  
  return typeMap[type.toLowerCase()] || type;
};

/**
 * Calculate quarterly distribution per $1M invested
 * @param {number} per100k - Annual distribution per 100K
 * @returns {number} - Quarterly amount per 1M
 */
export const calculateQuarterlyPer1M = (per100k) => {
  if (!per100k) return 0;
  return per100k * 10 * 3; // (per100k * 10 = per 1M) * 3 months
};

/**
 * Safely get nested property value
 * @param {object} obj - Object to query
 * @param {string} path - Dot-notation path (e.g., 'financial.purchasePrice')
 * @param {any} defaultValue - Default if not found
 * @returns {any} - Value or default
 */
export const getNestedValue = (obj, path, defaultValue = null) => {
  return path.split('.').reduce((acc, part) => acc?.[part], obj) ?? defaultValue;
};
