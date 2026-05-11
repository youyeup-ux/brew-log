import { useState, useEffect } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

const inputCls = 'w-full border border-coffee-200 rounded-xl px-3 py-2.5 bg-white text-coffee-800 focus:outline-none focus:border-coffee-400'
const labelCls = 'block text-sm font-medium text-coffee-600 mb-1'

const CLEANING_TYPES = {
  daily:     { label: '일일청소',   color: 'bg-blue-50 text-blue-600' },
  backflush: { label: '역압청소',   color: 'bg-purple-50 text-purple-600' },
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

export default function CleaningPage() {
  const [machineId, setMachineId] = useState(null)
  const [cleanings, setCleanings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ cleaned_at: localDateNow(), cleaning_type: 'daily', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [{ data: machineData }, { data: cleaningData }] = await Promise.all([
      supabase.from('machine').select('id').order('created_at').limit(1),
      supabase.from('machine_cleanings').select('*').order('cleaned_at', { ascending: false }),
    ])
    if (machineData?.[0]) setMachineId(machineData[0].id)
    setCleanings(cleaningData || [])
    setLoading(false)
  }

  async function saveCleaning(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      machine_id: machineId || null,
      cleaned_at: form.cleaned_at,
      cleaning_type: form.cleaning_type,
      notes: form.notes.trim() || null,
    }
    const { data } = await supabase.from('machine_cleanings').insert(payload).select().single()
    if (data) {
      setCleanings(prev => [data, ...prev].sort((a, b) => b.cleaned_at.localeCompare(a.cleaned_at)))
      setForm({ cleaned_at: localDateNow(), cleaning_type: 'daily', notes: '' })
      setShowForm(false)
    }
    setSaving(false)
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
      <div className="sticky top-0 bg-coffee-50 z-10 px-4 pt-5 pb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-coffee-800">🧹 청소 기록</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1 text-xs text-coffee-500 border border-coffee-200 rounded-lg px-2.5 py-1 active:bg-coffee-50 bg-white"
        >
          <Plus size={11} /> 청소 추가
        </button>
      </div>

      <div className="px-4 py-2 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-coffee-400" size={28} />
          </div>
        ) : (
          <>
            {/* 마지막 청소 경과일 */}
            {daysSince !== null && (
              <div className={`px-3 py-2.5 rounded-xl text-sm font-medium ${
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
            {showForm && (
              <form onSubmit={saveCleaning} className="p-3 bg-coffee-50 rounded-xl space-y-3">
                <div>
                  <label className={labelCls}>청소 날짜</label>
                  <input
                    className={inputCls}
                    type="date"
                    value={form.cleaned_at}
                    onChange={e => setForm(prev => ({ ...prev, cleaned_at: e.target.value }))}
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
                        onClick={() => setForm(prev => ({ ...prev, cleaning_type: key }))}
                        className={`py-2 rounded-xl text-sm font-medium transition-colors ${
                          form.cleaning_type === key
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
                    value={form.notes}
                    onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="특이사항..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-coffee-200 text-coffee-600 bg-white"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 bg-coffee-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    저장
                  </button>
                </div>
              </form>
            )}

            {/* 청소 기록 목록 */}
            <div className="bg-white rounded-2xl border border-coffee-100 overflow-hidden">
              {cleanings.length === 0 ? (
                <p className="text-sm text-coffee-300 text-center py-10">청소 기록이 없어요</p>
              ) : (
                <div className="px-4 py-2 space-y-1">
                  {cleanings.map(c => (
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
                  ))}
                </div>
              )}
            </div>

            <div className="h-4" />
          </>
        )}
      </div>
    </div>
  )
}
