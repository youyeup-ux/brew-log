import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { BEAN_TYPES, ROAST_LEVELS } from '../lib/constants'

const FILTERS = [
  { value: 'active',    label: '사용중' },
  { value: 'exhausted', label: '소진'   },
  { value: 'all',       label: '전체'   },
]

function BeanCard({ bean, onClick }) {
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
        <div className="flex gap-1 flex-shrink-0">
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

      {bean.is_exhausted && (
        <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">소진됨</span>
      )}
    </div>
  )
}

export default function BeansPage() {
  const [beans, setBeans] = useState([])
  const [filter, setFilter] = useState('active')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchBeans()
  }, [])

  async function fetchBeans() {
    const { data } = await supabase
      .from('beans')
      .select('*')
      .order('created_at', { ascending: false })
    setBeans(data || [])
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
