import FOSCards from './FOSCards'
import ExportButton from './ExportButton'
import { GravityCalcSheet, MiniPileCalcSheet, SoilNailCalcSheet } from './CalcSheet'
import { useState } from 'react'

export default function ResultsPanel({ results, wallType, params, project }) {
  const [showSheet, setShowSheet] = useState(true)
  const [fosMode, setFosMode] = useState('SLS')
  const hasULS = wallType === 0 || wallType === 1

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 bg-charcoal text-white text-xs font-semibold uppercase tracking-widest flex items-center justify-between">
        <span>Design Results</span>
        <div className="flex items-center gap-2">
          {hasULS && (
            <div className="flex rounded overflow-hidden border border-gray-600 text-xs font-bold">
              {['SLS', 'ULS'].map(m => (
                <button
                  key={m}
                  onClick={() => setFosMode(m)}
                  className={`px-2 py-0.5 transition-colors ${fosMode === m
                    ? m === 'ULS' ? 'bg-uls text-white' : 'bg-sls text-white'
                    : 'text-gray-400 hover:text-white'}`}
                >{m}</button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowSheet(v => !v)}
            className="text-gray-400 hover:text-white text-xs border border-gray-600 px-2 py-0.5 rounded"
          >
            {showSheet ? 'Hide' : 'Show'} Calc Sheet
          </button>
        </div>
      </div>

      <div className="p-4">
        <FOSCards results={results} wallType={wallType} fosMode={fosMode} />

        <div className="mt-4 flex flex-col gap-2">
          <ExportButton results={results} params={params} wallType={wallType} project={project} format="csv" />
          <ExportButton results={results} params={params} wallType={wallType} project={project} format="pdf" />
        </div>

        {showSheet && results && (
          <div className="mt-2">
            {(wallType === 0 || wallType === 1) && (
              <GravityCalcSheet results={results} params={params} wallType={wallType} fosMode={fosMode} />
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
