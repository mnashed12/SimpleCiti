import { useEffect, useMemo, useState } from 'react'
import { profileService, exchangeService, propertyService } from '../services/apiService'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/profile.css'

function Profile() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)
  const [exchangeIds, setExchangeIds] = useState([])
  const [likes, setLikes] = useState([]) // array of reference_numbers
  const [likeDetails, setLikeDetails] = useState([])

  const [form, setForm] = useState({
    phone_number: '',
    date_of_birth: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    risk_reward: '',
    have_qi: false,
    qi_company_name: '',
    equity_rollover: ''
  })

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [p, ex, ul] = await Promise.all([
          profileService.getProfile(),
          exchangeService.getExchangeIds(),
          profileService.getUserLikes(),
        ])
        if (cancelled) return
        setProfile(p)
        setExchangeIds(ex)
        const init = {
          phone_number: p.phone_number || '',
          date_of_birth: p.date_of_birth || '',
          address: p.address || '',
          city: p.city || '',
          state: p.state || '',
          zip_code: p.zip_code || '',
          country: p.country || '',
          risk_reward: p.risk_reward || '',
          have_qi: !!p.have_qi,
          qi_company_name: p.qi_company_name || '',
          equity_rollover: p.equity_rollover ?? ''
        }
        setForm(init)
        const likedRefs = ul?.liked_properties || []
        setLikes(likedRefs)
        if (likedRefs.length) {
          const details = await Promise.all(
            likedRefs.map((ref) => propertyService.getPropertyDetail(ref).catch(() => null))
          )
          if (!cancelled) setLikeDetails(details.filter(Boolean))
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) setError('Failed to load profile data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function saveProfile(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form }
      const updated = await profileService.updateProfile(payload)
      setProfile(updated)
      // Update form with saved values from server
      setForm({
        phone_number: updated.phone_number || '',
        date_of_birth: updated.date_of_birth || '',
        address: updated.address || '',
        city: updated.city || '',
        state: updated.state || '',
        zip_code: updated.zip_code || '',
        country: updated.country || '',
        risk_reward: updated.risk_reward || '',
        have_qi: !!updated.have_qi,
        qi_company_name: updated.qi_company_name || '',
        equity_rollover: updated.equity_rollover ?? ''
      })
    } catch (err) {
      console.error(err)
      setError('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const riskOptions = useMemo(() => [
    { value: '', label: 'Select risk preference' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ], [])

  return (
    <div className="profile-container">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-3xl font-semibold text-white">My Profile</h1>
        <div className="flex gap-3">
          <Link className="text-yellow-400 underline" to="/SE/exchange-ids">My Exchange IDs</Link>
          <Link className="text-yellow-400 underline" to="/SE/enrollment">Enroll a Property</Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-900/30 text-red-200 px-3 py-2">{error}</div>
      )}

      {loading ? (
        <div className="text-gray-300">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile form */}
          <div className="lg:col-span-2 bg-[#1d1a46] border border-white/10 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-white mb-4">Contact & Preferences</h2>
            <form onSubmit={saveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/60 mb-1">Phone</label>
                <input name="phone_number" value={form.phone_number} onChange={onChange} className="w-full bg-transparent border border-white/15 rounded px-2 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Date of Birth</label>
                <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={onChange} className="w-full bg-transparent border border-white/15 rounded px-2 py-2 text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-white/60 mb-1">Address</label>
                <input name="address" value={form.address} onChange={onChange} className="w-full bg-transparent border border-white/15 rounded px-2 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">City</label>
                <input name="city" value={form.city} onChange={onChange} className="w-full bg-transparent border border-white/15 rounded px-2 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">State</label>
                <input name="state" value={form.state} onChange={onChange} className="w-full bg-transparent border border-white/15 rounded px-2 py-2 text-white" maxLength={2} />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">ZIP</label>
                <input name="zip_code" value={form.zip_code} onChange={onChange} className="w-full bg-transparent border border-white/15 rounded px-2 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Country</label>
                <input name="country" value={form.country} onChange={onChange} className="w-full bg-transparent border border-white/15 rounded px-2 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Risk Preference</label>
                <select name="risk_reward" value={form.risk_reward} onChange={onChange} className="w-full bg-transparent border border-white/15 rounded px-2 py-2 text-white">
                  {riskOptions.map((o) => (
                    <option key={o.value} value={o.value} className="bg-[#1d1a46]">{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Equity Rollover ($)</label>
                <input name="equity_rollover" value={form.equity_rollover} onChange={onChange} className="w-full bg-transparent border border-white/15 rounded px-2 py-2 text-white" />
              </div>
              <div className="md:col-span-2 flex items-center gap-3 mt-2">
                <input id="have_qi" type="checkbox" name="have_qi" checked={!!form.have_qi} onChange={onChange} className="accent-yellow-400" />
                <label htmlFor="have_qi" className="text-white/80">I have a Qualified Intermediary (QI)</label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs text-white/60 mb-1">QI Company</label>
                <input name="qi_company_name" value={form.qi_company_name} onChange={onChange} className="w-full bg-transparent border border-white/15 rounded px-2 py-2 text-white" />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                <button type="button" className="px-4 py-2 rounded bg-white/10 text-white" onClick={() => navigate(-1)}>Cancel</button>
                <button type="submit" className="px-4 py-2 rounded bg-yellow-500 text-black font-semibold" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </form>
          </div>

          {/* Sidebar: Exchange IDs + Likes */}
          <div className="space-y-6">
            <div className="bg-[#1d1a46] border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold">My Exchange IDs</h3>
                <Link to="/SE/exchange-ids" className="text-yellow-400 text-sm">View all</Link>
              </div>
              {exchangeIds?.length ? (
                <ul className="divide-y divide-white/10">
                  {exchangeIds.slice(0,5).map((ex) => (
                    <li key={ex.id} className="py-2 text-white/90 flex items-center justify-between">
                      <span>{ex.exchange_id}</span>
                      <Link to={`/SE/exchange-ids`} className="text-yellow-400 text-xs">Open</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/60 text-sm">No exchange IDs yet.</p>
              )}
            </div>

            <div className="bg-[#1d1a46] border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-semibold">Liked Properties</h3>
                <Link to="/SE/Hub" className="text-yellow-400 text-sm">Browse</Link>
              </div>
              {likeDetails?.length ? (
                <ul className="divide-y divide-white/10">
                  {likeDetails.map((p) => (
                    <li key={p.reference_number} className="py-2 text-white/90 flex items-center justify-between">
                      <span className="truncate pr-2">{p.title || p.property_name}</span>
                      <Link to={`/SE/deal-detail/${p.reference_number}`} className="text-yellow-400 text-xs">View</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/60 text-sm">No liked properties yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout action at the bottom for easy access */}
      <div className="px-4 py-6">
        <div className="bg-[#1d1a46] border border-white/10 rounded-lg p-4 text-center">
          <a href="/user/logout/" className="inline-block w-full md:w-auto px-4 py-2 rounded bg-red-700 text-white font-semibold hover:bg-red-800">
            Logout
          </a>
          <div className="text-xs text-white/60 mt-2">You will be signed out of your session</div>
        </div>
      </div>
    </div>
  )
}

export default Profile
