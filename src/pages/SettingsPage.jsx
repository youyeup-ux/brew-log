import { useState, useEffect } from 'react'
import { Loader2, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { DRINK_TYPES } from '../lib/constants'

const inputCls = 'w-full border border-coffee-200 rounded-xl px-3 py-2.5 bg-white text-coffee-800 focus:outline-none focus:border-coffee-400'
const labelCls = 'block text-sm font-medium text-coffee-600 mb-1'

export default function SettingsPage() {
  const [machine, setMachine] = useState({ name: '', purchase_date: '', notes: '' })
  const [machineId, setMachineId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadMachine()
  }, [])

  async function loadMachine() {
    const { data } = await supabase.from('machine').select('*').order('created_at').limit(1)
    if (data?.[0]) {
      const m = data[0]
      setMachineId(m.id)
      setMachine({
        name: m.name ?? '',
        purchase_date: m.purchase_date ?? '',
        notes: m.notes ?? '',
      })
    }
    setLoading(false)
  }

  function setField(field, value) {
    setMachine((prev) => ({ ...prev, [field]: value }))
  }

  async function saveMachine(e) {
    e.preventDefault()
    setSaving(true)

    const payload = {
      name: machine.name.trim() || null,
      purchase_date: machine.purchase_date || null,
      notes: machine.notes.trim() || null,
    }

    if (machineId) {
      await supabase.from('machine').update(payload).eq('id', machineId)
    } else {
      const { data } = await supabase.from('machine').insert(payload).select().single()
      if (data) setMachineId(data.id)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="sticky top-0 bg-coffee-50 z-10 px-4 pt-5 pb-3">
        <h1 className="text-xl font-bold text-coffee-800">설정</h1>
      </div>

      <div className="px-4 py-2 space-y-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-coffee-400" size={28} />
          </div>
        ) : (
          <>
            {/* 머신 정보 */}
            <form onSubmit={saveMachine} className="bg-white rounded-2xl p-4 border border-coffee-100 space-y-4">
              <p className="text-xs font-semibold text-coffee-400 uppercase tracking-wider">머신 정보</p>

              <div>
                <label className={labelCls}>머신명</label>
                <input
                  className={inputCls}
                  value={machine.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="예: Breville Barista Express"
                />
              </div>

              <div>
                <label className={labelCls}>구매일</label>
                <input
                  className={inputCls}
                  type="date"
                  value={machine.purchase_date}
                  onChange={(e) => setField('purchase_date', e.target.value)}
                />
              </div>

              <div>
                <label className={labelCls}>메모</label>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={2}
                  value={machine.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder="버 타입, 필터 크기 등..."
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  saved
                    ? 'bg-green-500 text-white'
                    : 'bg-coffee-600 text-white'
                } disabled:opacity-60`}
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saved ? '✓ 저장됨' : '저장'}
              </button>
            </form>

            {/* 커피 종류 */}
            <div className="bg-white rounded-2xl p-4 border border-coffee-100">
              <p className="text-xs font-semibold text-coffee-400 uppercase tracking-wider mb-3">커피 종류</p>
              <div className="space-y-2">
                {Object.entries(DRINK_TYPES).map(([key, info]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-coffee-50 last:border-0">
                    <span className="text-sm text-coffee-700">{info.label}</span>
                    <div className="flex gap-1.5 text-xs text-coffee-400">
                      {info.hasWater && <span className="bg-blue-50 text-blue-400 px-2 py-0.5 rounded-full">물</span>}
                      {info.hasMilk  && <span className="bg-amber-50 text-amber-400 px-2 py-0.5 rounded-full">우유</span>}
                      {info.hasIce   && <span className="bg-cyan-50 text-cyan-400 px-2 py-0.5 rounded-full">얼음</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 앱 정보 */}
            <div className="bg-white rounded-2xl p-4 border border-coffee-100 text-center">
              <p className="text-2xl mb-1">☕</p>
              <p className="text-sm font-semibold text-coffee-700">Brew Log</p>
              <p className="text-xs text-coffee-400 mt-1">나만의 커피 추출 기록 앱</p>
            </div>
          </>
        )}

        <div className="h-4" />
      </div>
    </div>
  )
}
