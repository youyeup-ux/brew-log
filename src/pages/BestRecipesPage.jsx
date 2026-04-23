import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { DRINK_TYPES, TASTE_FIELDS, ROAST_LEVELS } from '../lib/constants'
import { StarDisplay } from '../components/StarRating'

function BestCard({ extraction }) {
  const drinkInfo = DRINK_TYPES[extraction.drink_type]

  return (
    <div className="bg-white rounded-2xl p-4 border border-coffee-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs bg-coffee-100 text-coffee-600 px-2 py-0.5 rounded-full">
          {drinkInfo?.label ?? extraction.drink_type}
        </span>
        <p className="text-xs text-coffee-400">
          {new Date(extraction.extracted_at).toLocaleDateString('ko-KR')}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-coffee-700 font-medium">
        {extraction.shot_dose  && <span>도징 {extraction.shot_dose}g</span>}
        {extraction.shot_yield && <span>추출 {extraction.shot_yield}g</span>}
        {extraction.shot_time  && <span>{extraction.shot_time}초</span>}
        {extraction.drink_water && <span>물 {extraction.drink_water}g</span>}
        {extraction.drink_milk  && <span>우유 {extraction.drink_milk}g</span>}
        {extraction.has_ice     && <span>🧊 얼음</span>}
      </div>

      {extraction.taste_overall > 0 && (
        <div className="mt-3 space-y-1">
          {TASTE_FIELDS.filter(f => extraction[f.key] > 0).map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-coffee-400 w-10">{label}</span>
              <StarDisplay value={extraction[key]} />
            </div>
          ))}
        </div>
      )}

      {extraction.memo && (
        <p className="mt-3 text-sm text-coffee-500 bg-coffee-50 rounded-xl p-3">{extraction.memo}</p>
      )}
    </div>
  )
}

export default function BestRecipesPage() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [{ data: extData }, { data: beanData }] = await Promise.all([
      supabase.from('extractions').select('*').eq('is_best', true).order('extracted_at', { ascending: false }),
      supabase.from('beans').select('id, brand, name, roast_level'),
    ])

    const beanMap = {}
    for (const b of (beanData || [])) beanMap[b.id] = b

    const grouped = {}
    for (const ex of (extData || [])) {
      if (!grouped[ex.bean_id]) grouped[ex.bean_id] = { bean: beanMap[ex.bean_id], extractions: [] }
      grouped[ex.bean_id].extractions.push(ex)
    }

    setGroups(Object.values(grouped))
    setLoading(false)
  }

  return (
    <div>
      <div className="sticky top-0 bg-coffee-50 z-10 px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-coffee-800">⭐ 베스트 레시피</h1>
      </div>

      <div className="px-4 py-2 space-y-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-coffee-400" size={28} />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16 text-coffee-300">
            <p className="text-4xl mb-3">⭐</p>
            <p className="text-sm">추출 기록에서 베스트 레시피를 지정해보세요</p>
          </div>
        ) : (
          groups.map(({ bean, extractions }) => (
            <div key={bean?.id ?? 'unknown'}>
              <div className="mb-3">
                {bean ? (
                  <>
                    <p className="text-xs text-coffee-400">{bean.brand}</p>
                    <h2 className="text-base font-bold text-coffee-800">{bean.name}</h2>
                    <span className="text-xs text-coffee-400">{ROAST_LEVELS[bean.roast_level]}</span>
                  </>
                ) : (
                  <h2 className="text-base font-bold text-coffee-800">알 수 없는 원두</h2>
                )}
              </div>
              <div className="space-y-3">
                {extractions.map((ex) => (
                  <BestCard key={ex.id} extraction={ex} />
                ))}
              </div>
            </div>
          ))
        )}
        <div className="h-4" />
      </div>
    </div>
  )
}
