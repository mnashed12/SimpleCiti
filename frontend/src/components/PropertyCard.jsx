import { Link } from 'react-router-dom';

function PropertyCard({ property }) {
  const {
    reference_number,
    property_name,
    property_type,
    address,
    city,
    state,
    price,
    cap_rate,
    cash_on_cash,
    primary_image,
    close_date,
  } = property;

  const formatPrice = (price) => {
    if (!price) return 'Price on Request';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatPercentage = (value) => {
    if (!value) return 'N/A';
    return `${value}%`;
  };

  return (
    <Link 
      to={`/deal-detail/${reference_number}`}
      className="block bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
    >
      {/* Property Image */}
      <div className="relative h-48 bg-gray-200">
        {primary_image ? (
          <img 
            src={primary_image} 
            alt={property_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
        
        {/* Property Type Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-primary-blue text-white px-3 py-1 rounded-full text-sm font-semibold">
            {property_type || 'Property'}
          </span>
        </div>
      </div>

      {/* Property Info */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-primary-blue mb-2 line-clamp-1">
          {property_name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-1">
          {address && `${address}, `}{city}, {state}
        </p>

        <div className="border-t border-gray-200 pt-3 mb-3">
          <div className="text-2xl font-bold text-primary-blue mb-1">
            {formatPrice(price)}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-500">Cap Rate</div>
            <div className="font-semibold text-primary-blue">{formatPercentage(cap_rate)}</div>
          </div>
          <div>
            <div className="text-gray-500">CoC Return</div>
            <div className="font-semibold text-primary-blue">{formatPercentage(cash_on_cash)}</div>
          </div>
        </div>

        {close_date && (
          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
            Close Date: {new Date(close_date).toLocaleDateString()}
          </div>
        )}

        {/* View Details Button */}
        <div className="mt-4">
          <span className="text-primary-blue font-semibold text-sm hover:underline">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default PropertyCard;
