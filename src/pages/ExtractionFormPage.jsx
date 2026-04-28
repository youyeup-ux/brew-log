import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { DRINK_TYPES, TASTE_FIELDS } from '../lib/constants'
import { StarRating } from '../components/StarRating'

const inputCls = 'w-full border border-coffee-200 rounded-xl px-3 py-2.5 bg-white text-coffee-800 focus:outline-none focus:border-coffee-400'
const labelCls = 'block text-sm font-medium text-coffee-600 mb-1'
const sectionCls = 'text-xs font-semibold text-coffee-400 uppercase tracking-wider mb-3'

function localDateNow() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

export default function ExtractionFormPage() {
  const { beanId: paramBeanId } = useParams()
  const navigate = useNavigate()

  const [beans, setBeans] = useState([])
  const [form, setForm] = useState({
    bean_id: paramBeanId || '',
    extracted_at: localDateNow(),
    drink_type: 'americano_hot',
    shot_dose: '',
    shot_yield: '',
    shot_time: '',
    shot_grind: '',
    drink_water: '',
    drink_milk: '',
    drink_ice: '',
    has_ice: false,
    taste_overall: 0,
    taste_acidity: 0,
    taste_bitterness: 0,
    taste_body: 0,
    taste_sweetness: 0,
    memo: '',
    is_best: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadBeans()
  }, [])

  async function loadBeans() {
    const { data } = await supabase
      .from('beans')
      .select('id, brand, name, recommended_recipe')
      .eq('is_exhausted', false)
      .order('created_at', { ascending: false })
    setBeans(data || [])
    setLoading(false)
  }

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleDrinkTypeChange(type) {
    const info = DRINK_TYPES[type]
    setForm(prev => ({
      ...prev,
      drink_type: type,
      has_ice: info.hasIce,
      drink_water: info.hasWater ? prev.drink_water : '',
      drink_milk:  info.hasMilk  ? prev.drink_milk  : '',
      drink_ice:   info.hasIce   ? prev.drink_ice   : '',
    }))
  }

  function fillFromRecipe() {
    const bean = beans.find(b => b.id === form.bean_id)
    if (!bean?.recommended_recipe) return
    const rec = bean.recommended_recipe
    const type = form.drink_type
    setForm(prev => {
      const next = { ...prev }
      if (rec.espresso?.dose)  next.shot_dose  = String(rec.espresso.dose)
      if (rec.espresso?.yield) next.shot_yield = String(rec.espresso.yield)
      if (type === 'americano_hot'  && rec.americano?.hot_water)  next.drink_water = String(rec.americano.hot_water)
      if (type === 'americano_iced' && rec.americano?.iced_water) next.drink_water = String(rec.americano.iced_water)
      if (type === 'latte_hot'      && rec.latte?.hot_milk)       next.drink_milk  = String(rec.latte.hot_milk)
      if (type === 'latte_iced'     && rec.latte?.iced_milk)      next.drink_milk  = String(rec.latte.iced_milk)
      return next
    })
  }

  async function fillFromBestRecipe() {
    if (!form.bean_id) return
    const { data } = await supabase
      .from('extractions')
      .select('*')
      .eq('bean_id', form.bean_id)
      .eq('is_best', true)
      .order('extracted_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!data) {
      alert('이 원두의 베스트 레시피가 없습니다.')
      return
    }
    setForm(prev => ({
      ...prev,
      shot_grind:  data.shot_grind  != null ? String(data.shot_grind)  : prev.shot_grind,
      shot_dose:   data.shot_dose   != null ? String(data.shot_dose)   : prev.shot_dose,
      shot_yield:  data.shot_yield  != null ? String(data.shot_yield)  : prev.shot_yield,
      shot_time:   data.shot_time   != null ? String(data.shot_time)   : prev.shot_time,
      drink_water: data.drink_water != null ? String(data.drink_water) : prev.drink_water,
      drink_milk:  data.drink_milk  != null ? String(data.drink_milk)  : prev.drink_milk,
      drink_ice:   data.drink_ice   != null ? String(data.drink_ice)   : prev.drink_ice,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.bean_id) return
    setSaving(true)

    const payload = {
      bean_id: form.bean_id,
      extracted_at: new Date(form.extracted_at).toISOString(),
      drink_type: form.drink_type,
      shot_dose:   form.shot_dose   ? Number(form.shot_dose)   : null,
      shot_yield:  form.shot_yield  ? Number(form.shot_yield)  : null,
      shot_time:   form.shot_time   ? Number(form.shot_time)   : null,
      shot_grind:  form.shot_grind  ? Number(form.shot_grind)  : null,
      drink_water: form.drink_water ? Number(form.drink_water) : null,
      drink_milk:  form.drink_milk  ? Number(form.drink_milk)  : null,
      drink_ice:   form.drink_ice   ? Number(form.drink_ice)   : null,
      has_ice: form.has_ice,
      taste_overall:    form.taste_overall    || null,
      taste_acidity:    form.taste_acidity    || null,
      taste_bitterness: form.taste_bitterness || null,
      taste_body:       form.taste_body       || null,
      taste_sweetness:  form.taste_sweetness  || null,
      memo: form.memo.trim() || null,
      is_best: form.is_best,
    }

    await supabase.from('extractions').insert(payload)
    setSaving(false)
    navigate(paramBeanId ? `/beans/${paramBeanId}` : '/extractions')
  }

  const drinkInfo = DRINK_TYPES[form.drink_type]
  const iceTotal = drinkInfo?.hasIce
    ? (drinkInfo.hasWater ? (Number(form.drink_water) || 0) : (Number(form.drink_milk) || 0)) + (Number(form.drink_ice) || 0)
    : 0

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-coffee-400" size={28} /></div>
  )

  return (
    <div>
      <div className="sticky top-0 bg-coffee-50 z-10 flex items-center gap-3 px-4 py-3 border-b border-coffee-100">
        <button onClick={() => navigate(-1)} className="text-coffee-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold text-coffee-800">추출 기록 추가</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        {/* 원두 선택 */}
        <div>
          <label className={labelCls}>원두 *</label>
          <select
            className={inputCls}
            value={form.bean_id}
            onChange={e => set('bean_id', e.target.value)}
            required
          >
            <option value="">원두를 선택하세요</option>
            {beans.map(b => (
              <option key={b.id} value={b.id}>{b.brand} {b.name}</option>
            ))}
          </select>
        </div>

        {/* 추출 일시 */}
        <div>
          <label className={labelCls}>추출 일시</label>
          <input
            className={inputCls}
            type="date"
            value={form.extracted_at}
            onChange={e => set('extracted_at', e.target.value)}
          />
        </div>

        {/* 음료 종류 */}
        <div>
          <label className={labelCls}>음료 종류</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(DRINK_TYPES).map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleDrinkTypeChange(key)}
                className={`py-2.5 rounded-xl text-sm font-medium transition-colors text-center ${
                  form.drink_type === key ? 'bg-coffee-600 text-white' : 'bg-coffee-100 text-coffee-600'
                }`}
              >
                {info.label}
              </button>
            ))}
          </div>
        </div>

        {/* 레시피 불러오기 버튼 */}
        {form.bean_id && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fillFromRecipe}
              className="flex-1 py-2 bg-coffee-50 border border-coffee-200 text-coffee-600 rounded-xl text-sm font-medium"
            >
              📋 추천 레시피
            </button>
            <button
              type="button"
              onClick={fillFromBestRecipe}
              className="flex-1 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl text-sm font-medium"
            >
              ⭐ 베스트 레시피
            </button>
          </div>
        )}

        {/* 샷 추출 정보 */}
        <div className="bg-white rounded-2xl p-4 border border-coffee-100 space-y-3">
          <p className={sectionCls}>샷 추출 정보</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-coffee-400 mb-1 block">🌀 그라인드</label>
              <input className={inputCls} type="number" min="1" max="20" value={form.shot_grind} onChange={e => set('shot_grind', e.target.value)} placeholder="" />
            </div>
            <div>
              <label className="text-xs text-coffee-400 mb-1 block">⚖️ 도징량 (g)</label>
              <input className={inputCls} type="number" step="0.1" value={form.shot_dose} onChange={e => set('shot_dose', e.target.value)} placeholder="" />
            </div>
            <div>
              <label className="text-xs text-coffee-400 mb-1 block">🫙 추출량 (g)</label>
              <input className={inputCls} type="number" step="0.1" value={form.shot_yield} onChange={e => set('shot_yield', e.target.value)} placeholder="" />
            </div>
            <div>
              <label className="text-xs text-coffee-400 mb-1 block">⏱️ 추출시간 (초)</label>
              <input className={inputCls} type="number" value={form.shot_time} onChange={e => set('shot_time', e.target.value)} placeholder="" />
            </div>
          </div>
        </div>

        {/* 음료 레시피 */}
        {(drinkInfo.hasWater || drinkInfo.hasMilk) && (
          <div className="bg-white rounded-2xl p-4 border border-coffee-100 space-y-3">
            <p className={sectionCls}>음료 레시피</p>
            {drinkInfo.hasMilk && (
              <div>
                <label className="text-xs text-coffee-400 mb-1 block">🥛 우유 (g)</label>
                <input className={inputCls} type="number" value={form.drink_milk} onChange={e => set('drink_milk', e.target.value)} placeholder="" />
              </div>
            )}
            {drinkInfo.hasWater && (
              <div>
                <label className="text-xs text-coffee-400 mb-1 block">💧 물 (g)</label>
                <input className={inputCls} type="number" value={form.drink_water} onChange={e => set('drink_water', e.target.value)} placeholder="" />
              </div>
            )}
            {drinkInfo.hasIce && (
              <div>
                <label className="text-xs text-coffee-400 mb-1 block">🧊 얼음 (g)</label>
                <input className={inputCls} type="number" value={form.drink_ice} onChange={e => set('drink_ice', e.target.value)} placeholder="" />
              </div>
            )}
            {iceTotal > 0 && (
              <p className="pt-2 border-t border-coffee-100 text-sm text-coffee-500 text-right">
                {drinkInfo.hasWater ? '물' : '우유'} + 얼음 = <span className="font-semibold text-coffee-700">{iceTotal}g</span>
              </p>
            )}
          </div>
        )}

        {/* 맛 평가 */}
        <div className="bg-white rounded-2xl p-4 border border-coffee-100 space-y-3">
          <p className={sectionCls}>맛 평가</p>
          {TASTE_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <label className="text-sm text-coffee-600 w-14">{label}</label>
              <StarRating value={form[key]} onChange={v => set(key, v)} />
            </div>
          ))}
          <div>
            <label className="text-xs text-coffee-400 mb-1 block">메모</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={form.memo}
              onChange={e => set('memo', e.target.value)}
              placeholder="맛, 향, 특이사항 등..."
            />
          </div>
        </div>

        {/* 베스트 레시피 */}
        <label className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_best}
            onChange={e => set('is_best', e.target.checked)}
            className="w-5 h-5 rounded accent-yellow-500"
          />
          <div>
            <p className="text-sm font-medium text-yellow-800">⭐ 베스트 레시피로 저장</p>
            <p className="text-xs text-yellow-600">베스트 탭에서 모아볼 수 있어요</p>
          </div>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-coffee-600 text-white rounded-2xl font-semibold text-base disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={18} className="animate-spin" />}
          기록 저장
        </button>

        <div className="h-4" />
      </form>
    </div>
  )
}
