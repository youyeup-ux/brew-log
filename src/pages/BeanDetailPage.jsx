import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Pencil, Trash2, Plus, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { BEAN_TYPES, ROAST_LEVELS, DRINK_TYPES, TASTE_FIELDS, getFreshness } from '../lib/constants'
import { StarDisplay } from '../components/StarRating'

function RecipeSection({ recipe }) {
  if (!recipe) return null
  const { espresso, americano, latte } = recipe
  const hasEspresso = espresso?.dose || espresso?.yield || espresso?.time_min
  const hasAmericano = americano?.hot_water || americano?.iced_water
  const hasLatte = latte?.hot_milk || latte?.iced_milk
  if (!hasEspresso && !hasAmericano && !hasLatte) return null

  return (
    <div className="bg-white rounded-2xl p-4 border border-coffee-100">
      <p className="text-xs font-semibold text-coffee-400 uppercase tracking-wider mb-3">추천 레시피</p>
      <div className="space-y-3">
        {hasEspresso && (
          <div>
            <p className="text-sm font-medium text-coffee-700 mb-1">에스프레소</p>
            <div className="text-sm text-coffee-600 space-y-0.5">
              {(espresso.dose || espresso.yield) && (
                <p>{espresso.dose && `도징 ${espresso.dose}g`}{espresso.dose && espresso.yield && ' / '}{espresso.yield && `추출 ${espresso.yield}g`}</p>
              )}
              {(espresso.time_min || espresso.time_max) && (
                <p>추출시간 {espresso.time_min}~{espresso.time_max}초</p>
              )}
            </div>
          </div>
        )}
        {hasAmericano && (
          <div>
            <p className="text-sm font-medium text-coffee-700 mb-1">아메리카노</p>
            <p className="text-sm text-coffee-600">
              {americano.hot_water && `HOT ${americano.hot_water}ml`}
              {americano.hot_water && americano.iced_water && ' / '}
              {americano.iced_water && `ICED ${americano.iced_water}ml`}
            </p>
          </div>
        )}
        {hasLatte && (
          <div>
            <p className="text-sm font-medium text-coffee-700 mb-1">라떼</p>
            <p className="text-sm text-coffee-600">
              {latte.hot_milk && `HOT ${latte.hot_milk}ml`}
              {latte.hot_milk && latte.iced_milk && ' / '}
              {latte.iced_milk && `ICED ${latte.iced_milk}ml`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ExtractionCard({ extraction, shotNumber }) {
  const drinkInfo = DRINK_TYPES[extraction.drink_type]
  return (
    <div className="bg-white rounded-2xl p-4 border border-coffee-100">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 flex-wrap">
          {shotNumber && (
            <span className="text-xs font-bold text-coffee-400">#{shotNumber}</span>
          )}
          <span className="text-xs bg-coffee-100 text-coffee-600 px-2 py-0.5 rounded-full">
            {drinkInfo?.label ?? extraction.drink_type}
          </span>
          {extraction.is_best && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⭐ 베스트</span>
          )}
        </div>
        <p className="text-xs text-coffee-300 flex-shrink-0 ml-2">
          {new Date(extraction.extracted_at).toLocaleDateString('ko-KR')}
        </p>
      </div>

      <div className="mt-2 flex flex-wrap gap-3 text-sm text-coffee-600">
        {extraction.shot_dose && <span>도징 {extraction.shot_dose}g</span>}
        {extraction.shot_yield && <span>추출 {extraction.shot_yield}g</span>}
        {extraction.shot_time && <span>{extraction.shot_time}초</span>}
        {extraction.drink_water && <span>물 {extraction.drink_water}g</span>}
        {extraction.drink_milk && <span>우유 {extraction.drink_milk}g</span>}
      </div>

      {extraction.taste_overall > 0 && (
        <div className="mt-2">
          <StarDisplay value={extraction.taste_overall} />
        </div>
      )}

      {extraction.memo && (
        <p className="mt-2 text-sm text-coffee-500 line-clamp-2">{extraction.memo}</p>
      )}
    </div>
  )
}

function RemainingBar({ capacityG, extractions }) {
  if (!capacityG) return null
  const usedDose = extractions.reduce((sum, e) => sum + (e.shot_dose ? Number(e.shot_dose) : 0), 0)
  const remainPct = Math.max(0, Math.min(100, ((capacityG - usedDose) / capacityG) * 100))
  const barColor = remainPct >= 50 ? 'bg-orange-400' : remainPct >= 20 ? 'bg-yellow-400' : 'bg-red-500'
  const remainG = Math.max(0, capacityG - usedDose)
  return (
    <div className="mt-3 pt-3 border-t border-coffee-100">
      <div className="flex justify-between text-xs text-coffee-400 mb-1.5">
        <span>잔량</span>
        <span>{Math.round(remainPct)}% ({remainG.toFixed(0)}g / {capacityG}g)</span>
      </div>
      <div className="h-2 bg-coffee-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${remainPct}%` }} />
      </div>
    </div>
  )
}

export default function BeanDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bean, setBean] = useState(null)
  const [extractions, setExtractions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    const [{ data: beanData }, { data: extData }] = await Promise.all([
      supabase.from('beans').select('*').eq('id', id).single(),
      supabase.from('extractions').select('*').eq('bean_id', id).order('extracted_at', { ascending: false }),
    ])
    setBean(beanData)
    setExtractions(extData || [])
    setLoading(false)
  }

  async function handleDelete() {
    if (!window.confirm('이 원두를 삭제할까요? 관련 추출 기록도 모두 삭제됩니다.')) return
    await supabase.from('beans').delete().eq('id', id)
    navigate('/beans')
  }

  async function toggleExhausted() {
    const updated = { is_exhausted: !bean.is_exhausted }
    await supabase.from('beans').update(updated).eq('id', id)
    setBean((prev) => ({ ...prev, ...updated }))
  }

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-coffee-400" size={28} /></div>
  )
  if (!bean) return <div className="text-center py-20 text-coffee-400">원두를 찾을 수 없습니다.</div>

  const freshness = getFreshness(bean.open_date)

  // extractions sorted newest-first → newest = #N, oldest = #1
  const shotNumbers = {}
  extractions.forEach((e, i) => { shotNumbers[e.id] = extractions.length - i })

  return (
    <div>
      <div className="sticky top-0 bg-coffee-50 z-10 flex items-center justify-between px-4 py-3 border-b border-coffee-100">
        <button onClick={() => navigate('/beans')} className="text-coffee-600">
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/beans/${id}/edit`)} className="p-2 text-coffee-500">
            <Pencil size={18} />
          </button>
          <button onClick={handleDelete} className="p-2 text-red-400">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 border border-coffee-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-coffee-400">{bean.brand}</p>
              <h2 className="text-xl font-bold text-coffee-800">{bean.name}</h2>
            </div>
            <div className="flex flex-col items-end gap-1">
              {freshness && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${freshness.bg} ${freshness.text}`}>
                  {freshness.label} ({freshness.days}일)
                </span>
              )}
              <span className="text-xs bg-coffee-100 text-coffee-600 px-2 py-0.5 rounded-full">{BEAN_TYPES[bean.type]}</span>
              <span className="text-xs bg-coffee-200 text-coffee-700 px-2 py-0.5 rounded-full">{ROAST_LEVELS[bean.roast_level]}</span>
            </div>
          </div>

          <div className="mt-3 space-y-1 text-sm text-coffee-600">
            {bean.origin && <p>원산지: {bean.origin}</p>}
            {bean.roast_date && <p>로스팅: {new Date(bean.roast_date).toLocaleDateString('ko-KR')}</p>}
            {bean.open_date && <p>개봉일: {new Date(bean.open_date).toLocaleDateString('ko-KR')}</p>}
            {bean.capacity_g && <p>용량: {bean.capacity_g}g</p>}
            {bean.price && <p>가격: {bean.price.toLocaleString()}원</p>}
          </div>

          {bean.flavor_tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {bean.flavor_tags.map((tag) => (
                <span key={tag} className="text-xs bg-coffee-50 text-coffee-500 px-2 py-0.5 rounded-full border border-coffee-100">{tag}</span>
              ))}
            </div>
          )}

          {bean.description && (
            <p className="mt-3 text-sm text-coffee-500 leading-relaxed">{bean.description}</p>
          )}

          <RemainingBar capacityG={bean.capacity_g} extractions={extractions} />

          <div className="mt-4 pt-3 border-t border-coffee-100">
            <button
              onClick={toggleExhausted}
              className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${
                bean.is_exhausted
                  ? 'bg-coffee-100 text-coffee-600'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {bean.is_exhausted ? '✓ 소진됨 (클릭하여 되돌리기)' : '소진 처리'}
            </button>
          </div>
        </div>

        <RecipeSection recipe={bean.recommended_recipe} />

        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-xs font-semibold text-coffee-400 uppercase tracking-wider">추출 기록 ({extractions.length})</p>
            <button
              onClick={() => navigate(`/extractions/new/${id}`)}
              className="flex items-center gap-1 text-sm text-coffee-600 font-medium"
            >
              <Plus size={16} /> 추출 추가
            </button>
          </div>

          {extractions.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-coffee-100 text-center text-coffee-300 text-sm">
              아직 추출 기록이 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {extractions.map((ex) => (
                <ExtractionCard key={ex.id} extraction={ex} shotNumber={shotNumbers[ex.id]} />
              ))}
            </div>
          )}
        </div>

        <div className="h-4" />
      </div>
    </div>
  )
}
