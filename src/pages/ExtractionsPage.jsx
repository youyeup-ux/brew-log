import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Loader2, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { DRINK_TYPES, TASTE_FIELDS } from '../lib/constants'
import { StarRating, StarDisplay } from '../components/StarRating'

function ExtractionItem({ extraction, beanName, shotNumber, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [taste, setTaste] = useState({
    taste_overall:    extraction.taste_overall    || 0,
    taste_acidity:    extraction.taste_acidity    || 0,
    taste_bitterness: extraction.taste_bitterness || 0,
    taste_body:       extraction.taste_body       || 0,
    taste_sweetness:  extraction.taste_sweetness  || 0,
    memo: extraction.memo || '',
  })
  const [savingRating, setSavingRating] = useState(false)
  const [ratingSaved, setRatingSaved] = useState(false)
  const drinkInfo = DRINK_TYPES[extraction.drink_type]

  async function saveRating() {
    setSavingRating(true)
    await supabase.from('extractions').update({
      taste_overall:    taste.taste_overall    || null,
      taste_acidity:    taste.taste_acidity    || null,
      taste_bitterness: taste.taste_bitterness || null,
      taste_body:       taste.taste_body       || null,
      taste_sweetness:  taste.taste_sweetness  || null,
      memo: taste.memo.trim() || null,
    }).eq('id', extraction.id)
    setSavingRating(false)
    setRatingSaved(true)
    setTimeout(() => setRatingSaved(false), 1500)
  }

  return (
    <div className="bg-white rounded-2xl border border-coffee-100 overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {shotNumber && (
              <span className="text-xs font-bold text-coffee-400">#{shotNumber}</span>
            )}
            <span className="text-xs bg-coffee-100 text-coffee-600 px-2 py-0.5 rounded-full whitespace-nowrap">
              {drinkInfo?.label ?? extraction.drink_type}
            </span>
            {extraction.is_best && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⭐ 베스트</span>
            )}
          </div>
          <p className="text-sm font-medium text-coffee-800 mt-1 truncate">{beanName}</p>
          <p className="text-xs text-coffee-400">
            {new Date(extraction.extracted_at).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          {taste.taste_overall > 0 && <StarDisplay value={taste.taste_overall} />}
          {expanded ? <ChevronUp size={16} className="text-coffee-300" /> : <ChevronDown size={16} className="text-coffee-300" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-coffee-50 pt-3 space-y-3">
          <div className="flex flex-wrap gap-3 text-sm text-coffee-600">
            {extraction.shot_dose  && <span>⚖️ 도징량 {extraction.shot_dose}g</span>}
            {extraction.shot_yield && <span>🫙 추출량 {extraction.shot_yield}g</span>}
            {extraction.shot_time  && <span>⏱️ 추출시간 {extraction.shot_time}초</span>}
            {extraction.shot_grind && <span>🌀 그라인드 {extraction.shot_grind}</span>}
            {extraction.drink_water && <span>💧 물 {extraction.drink_water}g</span>}
            {extraction.drink_milk  && <span>🥛 우유 {extraction.drink_milk}g</span>}
            {extraction.drink_ice   && <span>🧊 얼음 {extraction.drink_ice}g</span>}
          </div>

          {drinkInfo?.hasIce && extraction.drink_ice > 0 && (
            <p className="text-xs text-coffee-400">
              {drinkInfo.hasWater ? '물' : '우유'} + 얼음 = 합계{' '}
              {drinkInfo.hasWater
                ? Number(extraction.drink_water || 0) + Number(extraction.drink_ice)
                : Number(extraction.drink_milk || 0) + Number(extraction.drink_ice)}g
            </p>
          )}

          {/* 맛 평가 - 언제든 수정 가능 */}
          <div className="bg-coffee-50 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-coffee-400 uppercase tracking-wider">맛 평가</p>
            {TASTE_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-coffee-500 w-12">{label}</span>
                <StarRating
                  value={taste[key]}
                  onChange={v => setTaste(prev => ({ ...prev, [key]: v }))}
                  size="sm"
                />
              </div>
            ))}
            <textarea
              className="w-full text-sm border border-coffee-200 rounded-lg px-2 py-1.5 bg-white text-coffee-700 focus:outline-none focus:border-coffee-400 resize-none mt-1"
              rows={2}
              value={taste.memo}
              onChange={e => setTaste(prev => ({ ...prev, memo: e.target.value }))}
              placeholder="메모..."
            />
            <button
              onClick={saveRating}
              disabled={savingRating}
              className={`w-full py-2 rounded-lg text-xs font-semibold disabled:opacity-60 flex items-center justify-center gap-1 transition-colors ${
                ratingSaved ? 'bg-green-500 text-white' : 'bg-coffee-600 text-white'
              }`}
            >
              {savingRating && <Loader2 size={12} className="animate-spin" />}
              {ratingSaved ? '✓ 저장됨' : '맛 평가 저장'}
            </button>
          </div>

          <button
            onClick={() => onDelete(extraction.id)}
            className="flex items-center gap-1 text-red-400 text-xs"
          >
            <Trash2 size={13} /> 삭제
          </button>
        </div>
      )}
    </div>
  )
}

export default function ExtractionsPage() {
  const [extractions, setExtractions] = useState([])
  const [beans, setBeans] = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [{ data: extData }, { data: beanData }] = await Promise.all([
      supabase.from('extractions').select('*').order('extracted_at', { ascending: false }),
      supabase.from('beans').select('id, brand, name'),
    ])
    setExtractions(extData || [])
    const beanMap = {}
    for (const b of (beanData || [])) beanMap[b.id] = `${b.brand} ${b.name}`
    setBeans(beanMap)
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('이 추출 기록을 삭제할까요?')) return
    await supabase.from('extractions').delete().eq('id', id)
    setExtractions(prev => prev.filter(e => e.id !== id))
  }

  const shotNumbers = {}
  const beanGroups = {}
  for (const e of extractions) {
    if (!beanGroups[e.bean_id]) beanGroups[e.bean_id] = []
    beanGroups[e.bean_id].push(e)
  }
  for (const exts of Object.values(beanGroups)) {
    const sorted = [...exts].sort((a, b) => new Date(a.extracted_at) - new Date(b.extracted_at))
    sorted.forEach((e, i) => { shotNumbers[e.id] = i + 1 })
  }

  return (
    <div>
      <div className="sticky top-0 bg-coffee-50 z-10 px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-coffee-800">추출 기록</h1>
      </div>

      <div className="px-4 py-2 space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-coffee-400" size={28} />
          </div>
        ) : extractions.length === 0 ? (
          <div className="text-center py-16 text-coffee-300">
            <p className="text-4xl mb-3">☕</p>
            <p className="text-sm">추출 기록을 추가해보세요</p>
          </div>
        ) : (
          extractions.map(ex => (
            <ExtractionItem
              key={ex.id}
              extraction={ex}
              beanName={beans[ex.bean_id] ?? '알 수 없는 원두'}
              shotNumber={shotNumbers[ex.id]}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <button
        onClick={() => navigate('/extractions/new')}
        className="fixed bottom-24 right-4 w-14 h-14 bg-coffee-600 text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
