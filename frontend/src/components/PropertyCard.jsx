
import { Link } from 'react-router-dom';
import styles from './PropertyCard.module.css';

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
      className={styles['mpc-card']}
    >
      {/* Property Image */}
      <div className={styles['mpc-image']} style={{ position: 'relative' }}>
        {primary_image ? (
          <img
            src={primary_image}
            alt={property_name}
            className={styles['mpc-image']}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b0b0b0' }}>
            <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}
        {/* Property Type Badge */}
        <div className={styles['mpc-badge']}>
          {property_type || 'Property'}
        </div>
      </div>

      {/* Property Info */}
      <div className={styles['mpc-content']}>
        <h3 className={styles['mpc-title']} title={property_name}>
          {property_name}
        </h3>
        <div className={styles['mpc-address']} title={address ? `${address}, ${city}, ${state}` : `${city}, ${state}`}>
          {address && `${address}, `}{city}, {state}
        </div>
        <div className={styles['mpc-price']}>
          {formatPrice(price)}
        </div>
        <div className={styles['mpc-metrics']}>
          <div className={styles['mpc-metric']}>
            <div className={styles['mpc-metric-label']}>Cap Rate</div>
            <div className={styles['mpc-metric-value']}>{formatPercentage(cap_rate)}</div>
          </div>
          <div className={styles['mpc-metric']}>
            <div className={styles['mpc-metric-label']}>CoC Return</div>
            <div className={styles['mpc-metric-value']}>{formatPercentage(cash_on_cash)}</div>
          </div>
        </div>
        {close_date && (
          <div className={styles['mpc-close-date']}>
            Closing Date: {new Date(close_date).toLocaleDateString()}
          </div>
        )}
        <div className={styles['mpc-view-details']}>
          View Details →
        </div>
      </div>
    </Link>
  );
}

export default PropertyCard;
