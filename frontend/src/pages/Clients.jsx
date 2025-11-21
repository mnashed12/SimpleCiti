import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'

function Clients() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clients, setClients] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [count, setCount] = useState(0)
  const [search, setSearch] = useState('')
  const [risk, setRisk] = useState('')
  const [typingTimeout, setTypingTimeout] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState(null)

  const loadClients = useCallback(async (opts = {}) => {
    setLoading(true)
    setError('')
    try {
      const params = {
        page: opts.page || page,
        page_size: pageSize,
      }
      if (search) params.search = search
      if (risk) params.risk_reward = risk
      const resp = await api.get('/client-profiles/', { params })
      // DRF paginated response
      const results = resp.data.results || []
      setClients(results)
      setCount(resp.data.count || results.length)
    } catch (e) {
      console.error(e)
      setError('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, risk])

  useEffect(() => { loadClients() }, [loadClients])

  // Debounced search
  const onSearchChange = (e) => {
    const val = e.target.value
    setSearch(val)
    if (typingTimeout) clearTimeout(typingTimeout)
    const t = setTimeout(() => {
      setPage(1)
      loadClients({ page: 1 })
    }, 400)
    setTypingTimeout(t)
  }

  const onRiskChange = (e) => {
    setRisk(e.target.value)
    setPage(1)
    setTimeout(() => loadClients({ page: 1 }), 0)
  }

  const totalPages = Math.ceil(count / pageSize) || 1
  const goPage = (p) => {
    if (p < 1 || p > totalPages) return
    setPage(p)
    loadClients({ page: p })
  }

  const openDetail = async (id) => {
    setShowDetail(true)
    setDetail(null)
    setDetailLoading(true)
    try {
      const r = await api.get(`/client-profiles/${id}/`)
      setDetail(r.data)
    } catch (e) {
      console.error(e)
      setDetail({ error: 'Failed to load profile' })
    } finally {
      setDetailLoading(false)
    }
  }

  const formatPhone = (phone) => {
    if (!phone) return ''
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 10) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
    return phone
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[#003366]">Client CRM</h1>
        <div className="text-sm text-gray-600">Total: {count}</div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6 grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-xs font-semibold text-gray-600">Search</label>
          <input
            value={search}
            onChange={onSearchChange}
            placeholder="Name, email, ID..."
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#003366]"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600">Risk Preference</label>
          <select
            value={risk}
            onChange={onRiskChange}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#003366]"
          >
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => { setSearch(''); setRisk(''); setPage(1); loadClients({ page: 1 }) }}
            className="w-full px-3 py-2 rounded bg-gray-100 text-sm font-semibold hover:bg-gray-200"
          >Reset Filters</button>
        </div>
      </div>

      {error && <div className="mb-4 rounded bg-red-50 border border-red-200 text-red-700 px-3 py-2">{error}</div>}

      {loading ? (
        <div className="text-gray-600">Loading clients…</div>
      ) : clients.length === 0 ? (
        <div className="text-gray-600">No clients found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
          {clients.map(c => {
            const u = c.user || {}
            return (
              <div key={c.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="font-semibold text-[#003366] text-lg truncate">
                    {c.client_alias || (
                      ((c.user_first_name || '') + ' ' + (c.user_last_name || '')).trim()
                      ? ((c.user_first_name || '') + ' ' + (c.user_last_name || '')) + (c.user_username ? ` (@${c.user_username})` : '')
                      : (c.user_name || c.user_email || 'Client')
                    )}
                  </h2>
                  <span className="text-xs px-2 py-1 rounded bg-blue-50 border border-blue-200 text-blue-700">{c.client_id || '—'}</span>
                </div>
                <div className="text-sm text-gray-600 mb-3 truncate">{c.user_email}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-4">
                  <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-medium">{formatPhone(c.phone_number)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Username</span><span className="font-medium">{c.user_username || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">User Type</span><span className="font-medium capitalize">{c.user_type || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Joined</span><span className="font-medium">{c.user_date_joined ? new Date(c.user_date_joined).toLocaleDateString() : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Last Login</span><span className="font-medium">{c.user_last_login ? new Date(c.user_last_login).toLocaleDateString() : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Risk</span><span className="font-medium capitalize">{c.risk_reward || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Equity</span><span className="font-medium">{c.equity_rollover ? '$' + c.equity_rollover : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">QI</span><span className="font-medium">{c.have_qi ? 'Yes' : 'No'}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">DOB</span><span className="font-medium">{c.date_of_birth || '—'}</span></div>
                </div>
                <div className="mt-auto flex gap-2">
                  <button onClick={() => openDetail(c.id)} className="flex-1 px-3 py-2 rounded bg-[#003366] text-white text-xs font-semibold hover:bg-[#004488]">View</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => goPage(page - 1)} disabled={page === 1} className="px-3 py-1 rounded border bg-white disabled:opacity-50">Prev</button>
          <div className="text-sm">Page {page} of {totalPages}</div>
          <button onClick={() => goPage(page + 1)} disabled={page === totalPages} className="px-3 py-1 rounded border bg-white disabled:opacity-50">Next</button>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div
          className="fixed inset-0 bg-black/40 flex items-start justify-center z-50"
          onClick={(e) => {
            // Only close if clicking the backdrop, not the modal itself
            if (e.target === e.currentTarget) setShowDetail(false);
          }}
        >
          <div
            className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6 relative mt-40"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setShowDetail(false)} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">✕</button>
            <h3 className="text-xl font-bold text-[#003366] mb-4">Client Profile</h3>
            {detailLoading ? (
              <div className="text-gray-600">Loading…</div>
            ) : detail?.error ? (
              <div className="text-red-600">{detail.error}</div>
            ) : detail ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Name</div>
                    <div className="font-semibold">{`${detail.user_first_name || ''} ${detail.user_last_name || ''}`.trim() || detail.user_email}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Username</div>
                    <div className="font-semibold">{detail.user_username || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Email</div>
                    <div className="font-semibold">{detail.user_email}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Phone</div>
                    <div className="font-semibold">{formatPhone(detail.phone_number)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">User Type</div>
                    <div className="font-semibold capitalize">{detail.user_type}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Status</div>
                    <div className="font-semibold">{detail.user_is_active ? 'Active' : 'Inactive'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Client ID</div>
                    <div className="font-semibold">{detail.client_id || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Alias</div>
                    <div className="font-semibold">{detail.client_alias || '—'}</div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500">Address</div>
                    <div className="font-semibold">{[detail.address, detail.city, detail.state, detail.zip_code, detail.country].filter(Boolean).join(', ') || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Date of Birth</div>
                    <div className="font-semibold">{detail.date_of_birth || '—'}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Risk Preference</div>
                  <div className="font-semibold capitalize">{detail.risk_reward || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Qualified Intermediary (QI)</div>
                  <div className="font-semibold">{detail.have_qi ? 'Yes' : 'No'} {detail.qi_company_name ? `— ${detail.qi_company_name}` : ''}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-2">Current/Latest Enrollment</div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div><span className="text-gray-500">Sale Price</span><div className="font-semibold">{detail.sale_price ? `$${detail.sale_price}` : '—'}</div></div>
                    <div><span className="text-gray-500">Equity</span><div className="font-semibold">{detail.equity_rollover ? `$${detail.equity_rollover}` : '—'}</div></div>
                    <div><span className="text-gray-500">Close Date</span><div className="font-semibold">{detail.relinquish_closing_date || '—'}</div></div>
                    <div><span className="text-gray-500">DOB</span><div className="font-semibold">{detail.date_of_birth || '—'}</div></div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Investment Thesis</div>
                  <div className="text-sm text-gray-700 whitespace-pre-line">{detail.investment_thesis || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Financial Goals</div>
                  <div className="text-sm text-gray-700 whitespace-pre-line">{detail.financial_goals || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-2">Exchanges</div>
                  {Array.isArray(detail.exchanges) && detail.exchanges.length > 0 ? (
                    <div className="border rounded">
                      <div className="grid grid-cols-5 text-xs font-semibold bg-gray-50 border-b p-2">
                        <div>ID</div><div>Sale Price</div><div>Equity</div><div>Close Date</div><div>Created</div>
                      </div>
                      {detail.exchanges.map((x, idx) => (
                        <div key={idx} className="grid grid-cols-5 text-xs p-2 border-b last:border-b-0">
                          <div>{x.exchange_id}</div>
                          <div>{x.sale_price ? `$${x.sale_price}` : '—'}</div>
                          <div>{x.equity_rollover ? `$${x.equity_rollover}` : '—'}</div>
                          <div>{x.closing_date || '—'}</div>
                          <div>{x.created_at ? new Date(x.created_at).toLocaleDateString() : '—'}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">No exchanges yet.</div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

export default Clients
