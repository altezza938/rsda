/**
 * Retaining Wall Design module — the full 7-tab RSDA v2 app.
 */
import { useState } from 'react'
import ModuleShell from '../components/ModuleShell.jsx'
import TrialWedgeTab from '../tabs/TrialWedgeTab.jsx'
import WallDesignTab from '../tabs/WallDesignTab.jsx'
import BearingCapacityTab from '../tabs/BearingCapacityTab.jsx'
import SoilNailTab from '../tabs/SoilNailTab.jsx'
import NailHeadTab from '../tabs/NailHeadTab.jsx'
import SlendernessTab from '../tabs/SlendernessTab.jsx'

const TABS = [
  { id: 'tw',   label: 'Trial Wedge' },
  { id: 'sls',  label: 'Wall SLS' },
  { id: 'uls',  label: 'Wall ULS' },
  { id: 'bc',   label: 'Bearing Cap.' },
  { id: 'nail', label: 'Soil Nail' },
  { id: 'head', label: 'Nail Head' },
  { id: 'sl',   label: 'Slenderness' },
]

export default function RetainingApp({ onBack }) {
  const [tab, setTab]               = useState('tw')
  const [externalPa, setExternalPa] = useState(null)
  const [externalDelta, setExtDelta] = useState(null)
  const [allowBearing, setAllowBearing] = useState(null)

  return (
    <ModuleShell title="Retaining Wall Design" subtitle="R376 · FR146 · GG1 p.239"
      level="RSDA v2" tabs={TABS} activeTab={tab} onTab={setTab} onBack={onBack}
      headerRight={
        <span className="flex gap-2">
          {externalPa != null && <span className="text-[10px] px-2 py-0.5 bg-primary/20 text-secondary rounded">Pa={externalPa.toFixed(2)}kN/m</span>}
          {allowBearing != null && <span className="text-[10px] px-2 py-0.5 bg-sls/20 text-sls rounded">qult={allowBearing.toFixed(1)}kPa</span>}
        </span>
      }>
      {tab === 'tw'   && <TrialWedgeTab onPaChange={(pa, d) => { setExternalPa(pa); setExtDelta(d) }} />}
      {tab === 'sls'  && <WallDesignTab limitState="SLS" externalPa={externalPa} externalDelta={externalDelta} />}
      {tab === 'uls'  && <WallDesignTab limitState="ULS" externalPa={externalPa} externalDelta={externalDelta} />}
      {tab === 'bc'   && <BearingCapacityTab onResultChange={qu => setAllowBearing(qu)} />}
      {tab === 'nail' && <SoilNailTab />}
      {tab === 'head' && <NailHeadTab />}
      {tab === 'sl'   && <SlendernessTab />}
    </ModuleShell>
  )
}
