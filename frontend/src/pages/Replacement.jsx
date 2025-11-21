import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { profileService, propertyService, exchangeService } from '../services/apiService'

function Replacement() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [likesDetail, setLikesDetail] = useState([]) // [{ property_ref, exchange_id, exchange_id_name }]
  const [propertiesByRef, setPropertiesByRef] = useState({}) // { ref: propertyDetail }
  const [exchanges, setExchanges] = useState([])
  const [selectedExchange, setSelectedExchange] = useState('all')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        // Load likes with exchange details and user exchanges
        const [likes, ex] = await Promise.all([
          profileService.getUserLikes(),
          exchangeService.getExchangeIds().catch(() => ({ results: [] }))
        ])

        const likesDtl = likes?.likes_detail || []
        const exList = Array.isArray(ex?.results) ? ex.results : (Array.isArray(ex) ? ex : [])
        if (cancelled) return
        setLikesDetail(likesDtl)
        setExchanges(exList)

        // Fetch unique property details
        const uniqueRefs = [...new Set(likesDtl.map(l => l.property_ref))]
        const details = {}
        await Promise.all(uniqueRefs.map(async (ref) => {
          try {
            const data = await propertyService.getPropertyDetail(ref)
            details[ref] = data
          } catch (e) {
            // Ignore missing property
          }
        }))
        if (!cancelled) setPropertiesByRef(details)
      } catch (err) {
        console.error('Failed to load replacement candidates', err)
        if (!cancelled) setError('Failed to load your replacement properties')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filteredLikes = likesDetail.filter(l => selectedExchange === 'all' || l.exchange_id === selectedExchange)

  const formatCurrency = (num) => {
    if (num == null) return '$0'
    const n = typeof num === 'number' ? num : parseFloat(num)
    if (Number.isNaN(n)) return '$0'
    return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
  }

  const formatPercent = (num) => {
    if (num == null) return '—'
    const n = parseFloat(num)
    if (Number.isNaN(n)) return '—'
    return `${n}%`
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#003366]">My Replacement Candidates</h1>
        <div className="flex gap-3">
          <Link to="/SE/hub" className="px-4 py-2 rounded bg-[#003366] text-white font-semibold hover:bg-[#004488]">Browse Marketplace</Link>
          <Link to="/SE/enrollment" className="px-4 py-2 rounded border border-[#003366] text-[#003366] font-semibold hover:bg-[#f1f5f9]">Create Exchange ID</Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2">{error}</div>
      )}

      {/* Exchange filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-sm text-gray-600">Filter by Exchange</div>
          <select
            value={selectedExchange}
            onChange={(e) => setSelectedExchange(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="mt-1 w-64 px-3 py-2 border border-gray-300 rounded"
          >
            <option value="all">All Exchanges</option>
            {exchanges.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.exchange_id}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-600">
          Total Liked: <span className="font-semibold text-gray-800">{filteredLikes.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-600">Loading your liked properties…</div>
      ) : filteredLikes.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-2">No properties liked yet.</p>
          <Link to="/SE/hub" className="text-[#003366] underline font-semibold">Go to the marketplace</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredLikes.map(like => {
            const p = propertiesByRef[like.property_ref]
            if (!p) return null
            let imageUrl = 'https://via.placeholder.com/800x600?text=Property';
            if (p.images && p.images.length > 0) {
              // Support both new (object) and legacy (string) formats
              const first = p.images[0];
              if (typeof first === 'string') {
                imageUrl = first;
              } else if (first && (first.image_url || first.url || first.image)) {
                imageUrl = first.image_url || first.url || first.image;
              }
            } else if (p.image_url) {
              imageUrl = p.image_url;
            }
            return (
              <div
                key={`${like.exchange_id}-${like.property_ref}`}
                className="bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer overflow-hidden"
                onClick={() => navigate('/SE/hub')}
                title={`Open Marketplace - ${p.title}`}
              >
                <div className="h-48 w-full overflow-hidden">
                  <img src={imageUrl} alt={p.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-[#003366] truncate">{p.title}</h3>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 whitespace-nowrap">{like.exchange_id_name}</span>
                  </div>
                  <div className="text-sm text-gray-600 truncate mb-3">{p.address}</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Purchase Price</div>
                      <div className="font-semibold">{formatCurrency(p.purchase_price)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Cap Rate</div>
                      <div className="font-semibold">{formatPercent(p.cap_rate)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Total Equity</div>
                      <div className="font-semibold">{formatCurrency(p.total_equity)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Closing Date</div>
                      <div className="font-semibold">{formatDate(p.close_date)}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); navigate('/SE/hub') }}
                      className="px-3 py-2 rounded bg-[#003366] text-white text-sm font-semibold hover:bg-[#004488]"
                    >
                      View on Marketplace
                    </button>
                    <Link
                      to={`/SE/deal-detail/${like.property_ref}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-2 rounded border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                    >
                      Deal Detail
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Replacement
