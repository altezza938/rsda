import { useState } from 'react'
import LandingPage from './LandingPage.jsx'
import TrialWedgeTab from './tabs/TrialWedgeTab.jsx'
import WallDesignTab from './tabs/WallDesignTab.jsx'
import BearingCapacityTab from './tabs/BearingCapacityTab.jsx'
import SoilNailTab from './tabs/SoilNailTab.jsx'
import NailHeadTab from './tabs/NailHeadTab.jsx'
import SlendernessTab from './tabs/SlendernessTab.jsx'
import WallTypeSelector from './components/WallTypeSelector.jsx'
import InputPanel from './components/InputPanel.jsx'
import ResultsPanel from './components/ResultsPanel.jsx'
import WallDiagram from './components/WallDiagram.jsx'

/* ── New 7-tab app ── */

const TABS = [
  { id: 'tw',   label: 'Trial Wedge',  short: '1' },
  { id: 'sls',  label: 'Wall SLS',     short: '2' },
  { id: 'uls',  label: 'Wall ULS',     short: '3' },
  { id: 'bc',   label: 'Bearing Cap.', short: '4' },
  { id: 'nail', label: 'Soil Nail',    short: '5' },
  { id: 'head', label: 'Nail Head',    short: '6' },
  { id: 'sl',   label: 'Slenderness',  short: '7' },
]

const DEFAULT_PROJECT = {
  featureNo: 'CE53/2022',
  agreementNo: '',
  calcBy: '',
  checkedBy: '',
  date: new Date().toISOString().slice(0, 10),
}

function NewApp({ onBack }) {
  const [activeTab, setActiveTab] = useState('tw')
  const [project, setProject] = useState(DEFAULT_PROJECT)
  const [showProject, setShowProject] = useState(false)
  const [externalPa, setExternalPa]       = useState(null)
  const [externalDelta, setExternalDelta] = useState(null)
  const [allowBearing, setAllowBearing]   = useState(null)

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      <header className="bg-charcoal text-white px-4 py-2 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="text-gray-400 hover:text-white text-xs border border-gray-600 px-2 py-0.5 rounded mr-1">
            ← Back
          </button>
          <div className="w-7 h-7 bg-primary rounded flex items-center justify-center font-bold text-sm">A</div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest">AECOM · GEO · v2</div>
            <div className="text-sm font-semibold tracking-wide">Retaining Structure Design App</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[10px] text-secondary px-2 py-0.5 border border-secondary rounded">
            {project.featureNo}
          </span>
          {externalPa != null && (
            <span className="text-[10px] px-2 py-0.5 bg-primary/20 text-secondary rounded">
              Pa={externalPa.toFixed(2)} kN/m
            </span>
          )}
          {allowBearing != null && (
            <span className="text-[10px] px-2 py-0.5 bg-sls/20 text-sls rounded">
              q_ult={allowBearing.toFixed(1)} kPa
            </span>
          )}
          <button
            onClick={() => setShowProject(v => !v)}
            className="text-[10px] text-gray-300 hover:text-white border border-gray-600 px-2 py-0.5 rounded">
            Project Info
          </button>
        </div>
      </header>

      {showProject && (
        <div className="bg-charcoal text-white px-4 py-2 border-t border-gray-700 flex flex-wrap gap-3 text-xs shrink-0">
          {[
            ['Feature No.', 'featureNo'],
            ['Agreement No.', 'agreementNo'],
            ['Calc. By', 'calcBy'],
            ['Checked By', 'checkedBy'],
            ['Date', 'date'],
          ].map(([label, key]) => (
            <label key={key} className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-400">{label}</span>
              <input type="text" value={project[key]}
                onChange={e => setProject(p => ({ ...p, [key]: e.target.value }))}
                className="bg-gray-800 border border-gray-600 rounded px-2 py-0.5 text-white focus:outline-none focus:border-secondary w-36" />
            </label>
          ))}
        </div>
      )}

      <div className="bg-white border-b border-gray-200 flex shrink-0 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-pale'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}>
            <span className="text-gray-400 mr-1">{tab.short}.</span>{tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 bg-white overflow-hidden">
        {activeTab === 'tw'   && <TrialWedgeTab onPaChange={(pa, d) => { setExternalPa(pa); setExternalDelta(d) }} />}
        {activeTab === 'sls'  && <WallDesignTab limitState="SLS" externalPa={externalPa} externalDelta={externalDelta} />}
        {activeTab === 'uls'  && <WallDesignTab limitState="ULS" externalPa={externalPa} externalDelta={externalDelta} />}
        {activeTab === 'bc'   && <BearingCapacityTab onResultChange={qu => setAllowBearing(qu)} />}
        {activeTab === 'nail' && <SoilNailTab />}
        {activeTab === 'head' && <NailHeadTab />}
        {activeTab === 'sl'   && <SlendernessTab />}
      </div>

      <footer className="bg-charcoal text-gray-500 text-[10px] text-center py-1 shrink-0">
        AECOM GEO · RSDA v2.0 · GeoGuide 1 (2011) · R376 · FR146 · For Checking Use Only
      </footer>
    </div>
  )
}

/* ── Old panel app ── */

function OldApp({ onBack }) {
  const [wallType, setWallType] = useState(0)
  const [params, setParams]   = useState(null)
  const [results, setResults] = useState(null)
  const [project, setProject] = useState(DEFAULT_PROJECT)
  const [showProject, setShowProject] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-charcoal text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="text-gray-400 hover:text-white text-xs border border-gray-600 px-2 py-1 rounded mr-1">
            ← Back
          </button>
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center font-bold text-sm">A</div>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest">AECOM · GEO · v1</div>
            <div className="text-base font-semibold tracking-wide">Retaining Structure Design App</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-secondary px-2 py-1 border border-secondary rounded">{project.featureNo}</span>
          <button onClick={() => setShowProject(v => !v)}
            className="text-xs text-gray-300 hover:text-white border border-gray-600 px-2 py-1 rounded">
            Project Info
          </button>
        </div>
      </header>

      {showProject && (
        <div className="bg-charcoal text-white px-4 py-3 border-t border-gray-700 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {[['Feature No.','featureNo'],['Agreement No.','agreementNo'],['Calc. By','calcBy'],['Checked By','checkedBy'],['Date','date']].map(([label, key]) => (
            <label key={key}>
              <span className="block text-gray-400 mb-1">{label}</span>
              <input type="text" value={project[key]}
                onChange={e => setProject(p => ({ ...p, [key]: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white focus:outline-none focus:border-secondary" />
            </label>
          ))}
        </div>
      )}

      <WallTypeSelector active={wallType} onChange={t => { setWallType(t); setResults(null) }} />

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-0">
        <div className="bg-white border-r border-gray-200 overflow-y-auto lg:col-span-1">
          <InputPanel wallType={wallType} onResults={setResults} onParams={setParams} project={project} />
        </div>
        <div className="bg-gray-50 border-r border-gray-200 flex items-start justify-center p-4 lg:col-span-1">
          <WallDiagram wallType={wallType} params={params} results={results} />
        </div>
        <div className="bg-white overflow-y-auto lg:col-span-2">
          <ResultsPanel wallType={wallType} results={results} params={params} project={project} />
        </div>
      </div>

      <footer className="bg-charcoal text-gray-500 text-xs text-center py-2">
        AECOM GEO · RSDA v1.0 · GeoGuide 1 (2011) · For Checking Use Only
      </footer>
    </div>
  )
}

/* ── Root ── */

export default function App() {
  const [mode, setMode] = useState(null)   // null = landing, 'old', 'new'

  if (mode === 'new') return <NewApp onBack={() => setMode(null)} />
  if (mode === 'old') return <OldApp onBack={() => setMode(null)} />
  return <LandingPage onSelect={setMode} />
}
