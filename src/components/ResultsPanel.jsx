import FOSCards from './FOSCards'
import ExportButton from './ExportButton'
import { GravityCalcSheet, MiniPileCalcSheet, SoilNailCalcSheet } from './CalcSheet'
import { useState } from 'react'

export default function ResultsPanel({ results, wallType, params, project }) {
  const [showSheet, setShowSheet] = useState(true)

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 bg-charcoal text-white text-xs font-semibold uppercase tracking-widest flex items-center justify-between">
        <span>Design Results</span>
        <button
          onClick={() => setShowSheet(v => !v)}
          className="text-gray-400 hover:text-white text-xs border border-gray-600 px-2 py-0.5 rounded"
        >
          {showSheet ? 'Hide' : 'Show'} Calc Sheet
        </button>
      </div>

      <div className="p-4">
        {/* FOS summary cards */}
        <FOSCards results={results} wallType={wallType} />

        {/* Export buttons */}
        <div className="mt-4 flex flex-col gap-2">
          <ExportButton results={results} params={params} wallType={wallType} project={project} format="csv" />
          <ExportButton results={results} params={params} wallType={wallType} project={project} format="pdf" />
        </div>

        {/* Full XLS-style calculation sheet */}
        {showSheet && results && (
          <div className="mt-2">
            {(wallType === 0 || wallType === 1) && (
              <GravityCalcSheet results={results} params={params} wallType={wallType} />
            )}
            {wallType === 2 && (
              <MiniPileCalcSheet results={results} params={params} />
            )}
            {wallType === 3 && (
              <SoilNailCalcSheet results={results} params={params} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
