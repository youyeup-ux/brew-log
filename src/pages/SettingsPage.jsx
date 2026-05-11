import { useState, useEffect } from 'react'
import { Loader2, Pencil } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { DRINK_TYPES } from '../lib/constants'

const inputCls = 'w-full border border-coffee-200 rounded-xl px-3 py-2.5 bg-white text-coffee-800 focus:outline-none focus:border-coffee-400'
const labelCls = 'block text-sm font-medium text-coffee-600 mb-1'

function formatKorDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${y}년 ${m}월 ${d}일`
}

export default function SettingsPage() {
  const [machine, setMachine] = useState({ name: '', purchase_date: '', notes: '' })
  const [machineId, setMachineId] = useState(null)
  const [machineEditMode, setMachineEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const { data: machineData } = await supabase.from('machine').select('*').order('created_at').limit(1)
    if (machineData?.[0]) {
      const m = machineData[0]
      setMachineId(m.id)
      setMachine({ name: m.name ?? '', purchase_date: m.purchase_date ?? '', notes: m.notes ?? '' })
    } else {
      setMachineEditMode(true)
    }
    setLoading(false)
  }

  function setField(field, value) {
    setMachine(prev => ({ ...prev, [field]: value }))
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
    setMachineEditMode(false)
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
            {/* ── 머신 정보 ── */}
            <div className="bg-white rounded-2xl border border-coffee-100 overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <p className="text-xs font-semibold text-coffee-400 uppercase tracking-wider">머신 정보</p>
                {machineId && !machineEditMode && (
                  <button
                    onClick={() => setMachineEditMode(true)}
                    className="flex items-center gap-1 text-xs text-coffee-500 border border-coffee-200 rounded-lg px-2.5 py-1 active:bg-coffee-50"
                  >
                    <Pencil size={11} /> 수정
                  </button>
                )}
              </div>

              {machineId && !machineEditMode ? (
                <div className="px-4 pb-4 space-y-2">
                  <p className="text-lg font-bold text-coffee-800">{machine.name || '머신명 없음'}</p>
                  {machine.purchase_date && (
                    <p className="text-sm text-coffee-500">구매일 {formatKorDate(machine.purchase_date)}</p>
                  )}
                  {machine.notes && (
                    <p className="text-sm text-coffee-500 bg-coffee-50 rounded-xl px-3 py-2 mt-1">{machine.notes}</p>
                  )}
                </div>
              ) : (
                <form onSubmit={saveMachine} className="px-4 pb-4 space-y-4">
                  <div>
                    <label className={labelCls}>머신명</label>
                    <input
                      className={inputCls}
                      value={machine.name}
                      onChange={e => setField('name', e.target.value)}
                      placeholder="예: Breville Barista Express"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>구매일</label>
                    <input
                      className={inputCls}
                      type="date"
                      value={machine.purchase_date}
                      onChange={e => setField('purchase_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>메모</label>
                    <textarea
                      className={`${inputCls} resize-none`}
                      rows={2}
                      value={machine.notes}
                      onChange={e => setField('notes', e.target.value)}
                      placeholder="버 타입, 필터 크기 등..."
                    />
                  </div>
                  <div className="flex gap-2">
                    {machineId && (
                      <button
                        type="button"
                        onClick={() => setMachineEditMode(false)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-coffee-200 text-coffee-600"
                      >
                        취소
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={saving}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${
                        saved ? 'bg-green-500 text-white' : 'bg-coffee-600 text-white'
                      }`}
                    >
                      {saving && <Loader2 size={16} className="animate-spin" />}
                      {saved ? '✓ 저장됨' : '저장'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* ── 커피 종류 ── */}
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

            {/* ── 앱 정보 ── */}
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
