import { useState, useRef } from 'react'
import { exportCSV } from '../utils/exportCSV'
import { exportPDF } from '../utils/exportPDF'

export default function ExportButton({ results, params, wallType, project, format }) {
  const [loading, setLoading] = useState(false)
  const isCSV = format === 'csv'

  const handleClick = async () => {
    if (!results) return
    setLoading(true)
    try {
      if (isCSV) {
        exportCSV({ results, params, wallType, project })
      } else {
        const diagramEl = document.querySelector('svg')
        await exportPDF({ results, params, wallType, project, diagramEl })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={!results || loading}
      className={`w-full py-2 px-4 rounded text-sm font-semibold flex items-center justify-center gap-2 transition-all
        ${isCSV
          ? 'bg-primary text-white hover:bg-secondary disabled:opacity-40'
          : 'border-2 border-primary text-primary hover:bg-pale disabled:opacity-40'
        }`}
    >
      {loading ? (
        <span className="animate-spin">⌛</span>
      ) : (
        <span>{isCSV ? '⬇' : '📄'}</span>
      )}
      {loading ? 'Generating…' : isCSV ? 'Export CSV' : 'Export PDF'}
    </button>
  )
}
