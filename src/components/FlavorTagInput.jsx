import { useState } from 'react'
import { X } from 'lucide-react'

export default function FlavorTagInput({ tags = [], onChange }) {
  const [input, setInput] = useState('')

  function addTag() {
    const trimmed = input.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInput('')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2 min-h-6">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 bg-coffee-100 text-coffee-700 text-sm px-3 py-1 rounded-full"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="text-coffee-400 hover:text-coffee-700"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); addTag() }
          }}
          placeholder="태그 입력 후 Enter 또는 추가"
          className="flex-1 border border-coffee-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-coffee-400 bg-white"
        />
        <button
          type="button"
          onClick={addTag}
          className="px-4 py-2 bg-coffee-100 text-coffee-700 rounded-xl text-sm font-medium"
        >
          추가
        </button>
      </div>
    </div>
  )
}
