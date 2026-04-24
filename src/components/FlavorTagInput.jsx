import { useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'

const FLAVOR_CATEGORIES = [
  { id: 'citrus',    label: '시트러스',     items: ['레몬', '오렌지', '자몽', '라임'] },
  { id: 'berry',     label: '베리류',       items: ['블루베리', '라즈베리', '딸기', '체리', '블랙커런트'] },
  { id: 'stone',     label: '핵과류',       items: ['복숭아', '살구', '자두', '망고'] },
  { id: 'floral',    label: '플로럴',       items: ['자스민', '장미', '라벤더', '오렌지꽃'] },
  { id: 'chocolate', label: '초콜릿',       items: ['다크초콜릿', '밀크초콜릿', '코코아', '모카'] },
  { id: 'nutty',     label: '견과류',       items: ['헤이즐넛', '아몬드', '피넛', '호두'] },
  { id: 'sweet',     label: '달콤함',       items: ['캐러멜', '꿀', '황설탕', '바닐라', '메이플'] },
  { id: 'herbal',    label: '허브/스파이스', items: ['계피', '정향', '카다멈', '민트'] },
  { id: 'roasty',    label: '로스티',       items: ['스모키', '토스트', '구운견과', '몰트'] },
]

export default function FlavorTagInput({ tags = [], onChange }) {
  const [openCategory, setOpenCategory] = useState(null)

  function toggle(tag) {
    onChange(tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag])
  }

  return (
    <div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 bg-coffee-100 text-coffee-700 text-sm px-3 py-1 rounded-full">
              {tag}
              <button type="button" onClick={() => toggle(tag)} className="text-coffee-400 hover:text-coffee-700">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="border border-coffee-200 rounded-xl overflow-hidden divide-y divide-coffee-100">
        {FLAVOR_CATEGORIES.map(cat => {
          const isOpen = openCategory === cat.id
          const selectedCount = cat.items.filter(item => tags.includes(item)).length
          return (
            <div key={cat.id}>
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2.5 bg-white text-left"
                onClick={() => setOpenCategory(isOpen ? null : cat.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-coffee-700">{cat.label}</span>
                  {selectedCount > 0 && (
                    <span className="text-xs bg-coffee-600 text-white px-1.5 py-0.5 rounded-full leading-none">{selectedCount}</span>
                  )}
                </div>
                {isOpen
                  ? <ChevronUp size={16} className="text-coffee-400" />
                  : <ChevronDown size={16} className="text-coffee-400" />}
              </button>
              {isOpen && (
                <div className="flex flex-wrap gap-2 px-3 py-3 bg-coffee-50">
                  {cat.items.map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggle(item)}
                      className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                        tags.includes(item)
                          ? 'bg-coffee-600 text-white border-coffee-600'
                          : 'bg-white text-coffee-600 border-coffee-200'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
