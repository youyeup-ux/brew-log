import { useState, useEffect } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { DRINK_TYPES } from '../lib/constants'

const inputCls = 'w-full border border-coffee-200 rounded-xl px-3 py-2.5 bg-white text-coffee-800 focus:outline-none focus:border-coffee-400'
const labelCls = 'block text-sm font-medium text-coffee-600 mb-1'

const CLEANING_TYPES = {
  daily:     { label: '일일청소',  color: 'bg-blue-50 text-blue-600' },
  backflush: { label: '역압청소',  color: 'bg-purple-50 text-purple-600' },
  descaling: { label: '디스케일링', color: 'bg-orange-50 text-orange-600' },
}

function localDateNow() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 10)
}

function daysBetween(dateStr) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  const past = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((today - past) / 86400000)
}

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

  const [cleanings, setCleanings] = useState([])
  const [showCleaningForm, setShowCleaningForm] = useState(false)
  const [cleaningForm, setCleaningForm] = useState({ cleaned_at: localDateNow(), cleaning_type: 'daily', notes: '' })
  const [cleaningSaving, setCleaningSaving] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const [{ data: machineData }, { data: cleaningData }] = await Promise.all([
      supabase.from('machine').select('*').order('created_at').limit(1),
      supabase.from('machine_cleanings').select('*').order('cleaned_at', { ascending: false }),
    ])
    if (machineData?.[0]) {
      const m = machineData[0]
      setMachineId(m.id)
      setMachine({ name: m.name ?? '', purchase_date: m.purchase_date ?? '', notes: m.notes ?? '' })
    } else {
      setMachineEditMode(true)
    }
    setCleanings(cleaningData || [])
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

  async function saveCleaning(e) {
    e.preventDefault()
    setCleaningSaving(true)
    const payload = {
      machine_id: machineId || null,
      cleaned_at: cleaningForm.cleaned_at,
      cleaning_type: cleaningForm.cleaning_type,
      notes: cleaningForm.notes.trim() || null,
    }
    const { data } = await supabase.from('machine_cleanings').insert(payload).select().single()
    if (data) {
      setCleanings(prev => [data, ...prev].sort((a, b) => b.cleaned_at.localeCompare(a.cleaned_at)))
      setCleaningForm({ cleaned_at: localDateNow(), cleaning_type: 'daily', notes: '' })
      setShowCleaningForm(false)
    }
    setCleaningSaving(false)
  }

  async function deleteCleaning(id) {
    if (!window.confirm('이 청소 기록을 삭제할까요?')) return
    await supabase.from('machine_cleanings').delete().eq('id', id)
    setCleanings(prev => prev.filter(c => c.id !== id))
  }

  const lastCleaning = cleanings[0]
  const daysSince = lastCleaning ? daysBetween(lastCleaning.cleaned_at) : null

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

            {/* ── 머신 청소 기록 ── */}
            <div className="bg-white rounded-2xl border border-coffee-100 overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <p className="text-xs font-semibold text-coffee-400 uppercase tracking-wider">머신 청소 기록</p>
                <button
                  onClick={() => setShowCleaningForm(v => !v)}
                  className="flex items-center gap-1 text-xs text-coffee-500 border border-coffee-200 rounded-lg px-2.5 py-1 active:bg-coffee-50"
                >
                  <Plus size={11} /> 청소 추가
                </button>
              </div>

              {/* 마지막 청소 경과일 */}
              {daysSince !== null && (
                <div className={`mx-4 mb-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  daysSince <= 1  ? 'bg-green-50 text-green-700' :
                  daysSince <= 7  ? 'bg-yellow-50 text-yellow-700' :
                                    'bg-red-50 text-red-600'
                }`}>
                  마지막 청소: <span className="font-semibold">{CLEANING_TYPES[lastCleaning.cleaning_type]?.label}</span>
                  {' · '}
                  {daysSince === 0 ? '오늘' : `${daysSince}일 경과`}
                </div>
              )}

              {/* 청소 추가 폼 */}
              {showCleaningForm && (
                <form onSubmit={saveCleaning} className="mx-4 mb-4 p-3 bg-coffee-50 rounded-xl space-y-3">
                  <div>
                    <label className={labelCls}>청소 날짜</label>
                    <input
                      className={inputCls}
                      type="date"
                      value={cleaningForm.cleaned_at}
                      onChange={e => setCleaningForm(prev => ({ ...prev, cleaned_at: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelCls}>청소 종류</label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(CLEANING_TYPES).map(([key, { label }]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setCleaningForm(prev => ({ ...prev, cleaning_type: key }))}
                          className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                            cleaningForm.cleaning_type === key
                              ? 'bg-coffee-600 text-white'
                              : 'bg-white border border-coffee-200 text-coffee-600'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>메모 (선택)</label>
                    <input
                      className={inputCls}
                      value={cleaningForm.notes}
                      onChange={e => setCleaningForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="특이사항..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCleaningForm(false)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-coffee-200 text-coffee-600 bg-white"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={cleaningSaving}
                      className="flex-1 py-2.5 bg-coffee-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {cleaningSaving && <Loader2 size={14} className="animate-spin" />}
                      저장
                    </button>
                  </div>
                </form>
              )}

              {/* 청소 기록 목록 */}
              <div className="px-4 pb-4 space-y-1">
                {cleanings.length === 0 ? (
                  <p className="text-sm text-coffee-300 text-center py-6">청소 기록이 없어요</p>
                ) : (
                  cleanings.map(c => (
                    <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-coffee-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CLEANING_TYPES[c.cleaning_type]?.color}`}>
                          {CLEANING_TYPES[c.cleaning_type]?.label}
                        </span>
                        {c.notes && <span className="text-xs text-coffee-400">{c.notes}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-coffee-400">{formatKorDate(c.cleaned_at)}</p>
                        <button onClick={() => deleteCleaning(c.id)} className="text-red-300 active:text-red-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
