import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { BEAN_TYPES, ROAST_LEVELS, getFreshness } from '../lib/constants'

const FILTERS = [
  { value: 'active',    label: '사용중' },
  { value: 'exhausted', label: '소진'   },
  { value: 'all',       label: '전체'   },
]

function RemainingBar({ capacityG, usedDose }) {
  if (!capacityG) return null
  const remainPct = Math.max(0, Math.min(100, ((capacityG - (usedDose || 0)) / capacityG) * 100))
  const barColor = remainPct >= 50 ? 'bg-orange-400' : remainPct >= 20 ? 'bg-yellow-400' : 'bg-red-500'
  const remainG = Math.max(0, capacityG - (usedDose || 0))
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-coffee-400 mb-1">
        <span>잔량</span>
        <span>{Math.round(remainPct)}% ({remainG.toFixed(0)}g)</span>
      </div>
      <div className="h-1.5 bg-coffee-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${remainPct}%` }} />
      </div>
    </div>
  )
}

function BeanCard({ bean, usedDose, onClick }) {
  const freshness = getFreshness(bean.open_date)
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-sm border border-coffee-100 cursor-pointer active:scale-98 transition-transform"
    >
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <p className="text-xs text-coffee-400">{bean.brand}</p>
          <h3 className="font-semibold text-coffee-800 truncate">{bean.name}</h3>
        </div>
        <div className="flex flex-wrap gap-1 flex-shrink-0 justify-end">
          {freshness && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${freshness.bg} ${freshness.text}`}>
              {freshness.label}
            </span>
          )}
          <span className="text-xs bg-coffee-100 text-coffee-600 px-2 py-0.5 rounded-full whitespace-nowrap">
            {BEAN_TYPES[bean.type]}
          </span>
          <span className="text-xs bg-coffee-200 text-coffee-700 px-2 py-0.5 rounded-full whitespace-nowrap">
            {ROAST_LEVELS[bean.roast_level]}
          </span>
        </div>
      </div>

      {bean.origin && (
        <p className="text-xs text-coffee-400 mt-1">{bean.origin}</p>
      )}

      {bean.flavor_tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {bean.flavor_tags.slice(0, 5).map((tag) => (
            <span key={tag} className="text-xs bg-coffee-50 text-coffee-500 px-2 py-0.5 rounded-full border border-coffee-100">
              {tag}
            </span>
          ))}
        </div>
      )}

      {bean.roast_date && (
        <p className="text-xs text-coffee-300 mt-2">
          로스팅 {new Date(bean.roast_date).toLocaleDateString('ko-KR')}
        </p>
      )}

      <RemainingBar capacityG={bean.capacity_g} usedDose={usedDose} />

      {bean.is_exhausted && (
        <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">소진됨</span>
      )}
    </div>
  )
}

export default function BeansPage() {
  const [beans, setBeans] = useState([])
  const [doseMap, setDoseMap] = useState({})
  const [filter, setFilter] = useState('active')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [{ data: beanData }, { data: extData }] = await Promise.all([
      supabase.from('beans').select('*').order('created_at', { ascending: false }),
      supabase.from('extractions').select('bean_id, shot_dose'),
    ])
    setBeans(beanData || [])
    const map = {}
    for (const e of (extData || [])) {
      if (e.shot_dose) map[e.bean_id] = (map[e.bean_id] || 0) + Number(e.shot_dose)
    }
    setDoseMap(map)
    setLoading(false)
  }

  const filtered = beans.filter((b) => {
    if (filter === 'active')    return !b.is_exhausted
    if (filter === 'exhausted') return b.is_exhausted
    return true
  })

  return (
    <div>
      <div className="sticky top-0 bg-coffee-50 z-10 px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-coffee-800 mb-3">원두</h1>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-coffee-600 text-white'
                  : 'bg-coffee-100 text-coffee-500'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-2 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-coffee-400" size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-coffee-300">
            <p className="text-4xl mb-3">☕</p>
            <p className="text-sm">원두를 추가해보세요</p>
          </div>
        ) : (
          filtered.map((bean) => (
            <BeanCard
              key={bean.id}
              bean={bean}
              usedDose={doseMap[bean.id] || 0}
              onClick={() => navigate(`/beans/${bean.id}`)}
            />
          ))
        )}
      </div>

      <button
        onClick={() => navigate('/beans/new')}
        className="fixed bottom-24 right-4 w-14 h-14 bg-coffee-600 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
