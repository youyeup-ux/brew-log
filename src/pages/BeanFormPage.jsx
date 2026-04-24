import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { BEAN_TYPES, ROAST_LEVELS } from '../lib/constants'
import FlavorTagInput from '../components/FlavorTagInput'

const EMPTY_FORM = {
  brand: '',
  name: '',
  type: 'single_origin',
  origin: '',
  roast_level: 'medium',
  capacity_g: '',
  price: '',
  roast_date: '',
  open_date: '',
  flavor_tags: [],
  description: '',
  recommended_recipe: {
    espresso:   { dose: '', yield: '', time_min: '', time_max: '' },
    americano:  { hot_water: '', iced_water: '' },
    latte:      { hot_milk: '', iced_milk: '' },
  },
}

const inputCls = 'w-full border border-coffee-200 rounded-xl px-3 py-2.5 bg-white text-coffee-800 focus:outline-none focus:border-coffee-400'
const labelCls = 'block text-sm font-medium text-coffee-600 mb-1'
const sectionCls = 'text-xs font-semibold text-coffee-400 uppercase tracking-wider mb-3 mt-1'

export default function BeanFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEdit) loadBean()
  }, [id])

  async function loadBean() {
    const { data } = await supabase.from('beans').select('*').eq('id', id).single()
    if (data) {
      setForm({
        ...EMPTY_FORM,
        ...data,
        capacity_g: data.capacity_g ?? '',
        price: data.price ?? '',
        roast_date: data.roast_date ?? '',
        open_date: data.open_date ?? '',
        recommended_recipe: {
          espresso:  data.recommended_recipe?.espresso  ?? EMPTY_FORM.recommended_recipe.espresso,
          americano: data.recommended_recipe?.americano ?? EMPTY_FORM.recommended_recipe.americano,
          latte:     data.recommended_recipe?.latte     ?? EMPTY_FORM.recommended_recipe.latte,
        },
      })
    }
    setLoading(false)
  }

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function setRecipe(type, field, value) {
    setForm((prev) => ({
      ...prev,
      recommended_recipe: {
        ...prev.recommended_recipe,
        [type]: { ...prev.recommended_recipe[type], [field]: value },
      },
    }))
  }

  function num(v) { return v === '' ? null : Number(v) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.brand.trim() || !form.name.trim()) return
    setSaving(true)

    const rec = form.recommended_recipe
    const payload = {
      brand: form.brand.trim(),
      name: form.name.trim(),
      type: form.type,
      origin: form.origin.trim() || null,
      roast_level: form.roast_level,
      capacity_g: num(form.capacity_g),
      price: num(form.price),
      roast_date: form.roast_date || null,
      open_date: form.open_date || null,
      flavor_tags: form.flavor_tags,
      description: form.description.trim() || null,
      recommended_recipe: {
        espresso:  { dose: num(rec.espresso.dose),       yield: num(rec.espresso.yield),       time_min: num(rec.espresso.time_min),   time_max: num(rec.espresso.time_max) },
        americano: { hot_water: num(rec.americano.hot_water), iced_water: num(rec.americano.iced_water) },
        latte:     { hot_milk: num(rec.latte.hot_milk),  iced_milk: num(rec.latte.iced_milk) },
      },
    }

    if (isEdit) {
      await supabase.from('beans').update(payload).eq('id', id)
    } else {
      await supabase.from('beans').insert(payload)
    }

    setSaving(false)
    navigate(isEdit ? `/beans/${id}` : '/beans')
  }

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-coffee-400" size={28} /></div>
  )

  return (
    <div>
      <div className="sticky top-0 bg-coffee-50 z-10 flex items-center gap-3 px-4 py-3 border-b border-coffee-100">
        <button onClick={() => navigate(-1)} className="text-coffee-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-semibold text-coffee-800">{isEdit ? '원두 수정' : '원두 추가'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4">
        <div>
          <label className={labelCls}>브랜드 *</label>
          <input className={inputCls} value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="예: 커피리브레" required />
        </div>

        <div>
          <label className={labelCls}>원두명 *</label>
          <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="예: 에티오피아 예가체프" required />
        </div>

        <div>
          <label className={labelCls}>타입</label>
          <div className="flex gap-2">
            {Object.entries(BEAN_TYPES).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => set('type', val)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  form.type === val ? 'bg-coffee-600 text-white' : 'bg-coffee-100 text-coffee-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>원산지</label>
          <input className={inputCls} value={form.origin} onChange={(e) => set('origin', e.target.value)} placeholder="예: 에티오피아" />
        </div>

        <div>
          <label className={labelCls}>로스팅 레벨</label>
          <select className={inputCls} value={form.roast_level} onChange={(e) => set('roast_level', e.target.value)}>
            {Object.entries(ROAST_LEVELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className={labelCls}>용량 (g)</label>
            <input className={inputCls} type="number" value={form.capacity_g} onChange={(e) => set('capacity_g', e.target.value)} placeholder="200" />
          </div>
          <div className="flex-1">
            <label className={labelCls}>가격 (원)</label>
            <input className={inputCls} type="number" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="25000" />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className={labelCls}>로스팅 날짜</label>
            <input className={inputCls} type="date" value={form.roast_date} onChange={(e) => set('roast_date', e.target.value)} />
          </div>
          <div className="flex-1">
            <label className={labelCls}>개봉일</label>
            <input className={inputCls} type="date" value={form.open_date} onChange={(e) => set('open_date', e.target.value)} />
          </div>
        </div>

        <div>
          <label className={labelCls}>풍미 태그</label>
          <FlavorTagInput tags={form.flavor_tags} onChange={(tags) => set('flavor_tags', tags)} />
        </div>

        <div>
          <label className={labelCls}>원두 설명</label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="원두에 대한 간단한 설명..."
          />
        </div>

        {/* 추천 레시피 */}
        <div className="bg-white rounded-2xl p-4 border border-coffee-100 space-y-5">
          <p className={sectionCls}>추천 레시피</p>

          <div>
            <p className="text-sm font-medium text-coffee-700 mb-2">에스프레소</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-xs text-coffee-400 mb-1 block">도징량 (g)</label>
                <input className={inputCls} type="number" step="0.1" value={form.recommended_recipe.espresso.dose} onChange={(e) => setRecipe('espresso', 'dose', e.target.value)} placeholder="18" />
              </div>
              <div>
                <label className="text-xs text-coffee-400 mb-1 block">추출량 (g)</label>
                <input className={inputCls} type="number" step="0.1" value={form.recommended_recipe.espresso.yield} onChange={(e) => setRecipe('espresso', 'yield', e.target.value)} placeholder="36" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-coffee-400 mb-1 block">추출시간 최소 (초)</label>
                <input className={inputCls} type="number" value={form.recommended_recipe.espresso.time_min} onChange={(e) => setRecipe('espresso', 'time_min', e.target.value)} placeholder="25" />
              </div>
              <div>
                <label className="text-xs text-coffee-400 mb-1 block">추출시간 최대 (초)</label>
                <input className={inputCls} type="number" value={form.recommended_recipe.espresso.time_max} onChange={(e) => setRecipe('espresso', 'time_max', e.target.value)} placeholder="30" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-coffee-700 mb-2">아메리카노</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-coffee-400 mb-1 block">HOT 물량 (g)</label>
                <input className={inputCls} type="number" value={form.recommended_recipe.americano.hot_water} onChange={(e) => setRecipe('americano', 'hot_water', e.target.value)} placeholder="120" />
              </div>
              <div>
                <label className="text-xs text-coffee-400 mb-1 block">ICED 물량 (g)</label>
                <input className={inputCls} type="number" value={form.recommended_recipe.americano.iced_water} onChange={(e) => setRecipe('americano', 'iced_water', e.target.value)} placeholder="100" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-coffee-700 mb-2">라떼</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-coffee-400 mb-1 block">HOT 우유량 (g)</label>
                <input className={inputCls} type="number" value={form.recommended_recipe.latte.hot_milk} onChange={(e) => setRecipe('latte', 'hot_milk', e.target.value)} placeholder="150" />
              </div>
              <div>
                <label className="text-xs text-coffee-400 mb-1 block">ICED 우유량 (g)</label>
                <input className={inputCls} type="number" value={form.recommended_recipe.latte.iced_milk} onChange={(e) => setRecipe('latte', 'iced_milk', e.target.value)} placeholder="120" />
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-coffee-600 text-white rounded-2xl font-semibold text-base disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={18} className="animate-spin" />}
          {isEdit ? '수정 완료' : '원두 추가'}
        </button>

        <div className="h-4" />
      </form>
    </div>
  )
}
