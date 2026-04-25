import { useState } from 'react'
import ModuleShell from '../components/ModuleShell.jsx'
import InfiniteSlopeTab from '../tabs/InfiniteSlopeTab.jsx'
import BishopTab from '../tabs/BishopTab.jsx'

const TABS = [
  { id: 'infinite', label: 'Infinite Slope' },
  { id: 'bishop',   label: "Bishop's Method" },
]

export default function SlopeApp({ onBack }) {
  const [tab, setTab] = useState('infinite')
  return (
    <ModuleShell title="Slope Stability Analysis" subtitle="Infinite slope · Bishop's simplified"
      level="GEO" tabs={TABS} activeTab={tab} onTab={setTab} onBack={onBack}>
      {tab === 'infinite' && <InfiniteSlopeTab />}
      {tab === 'bishop'   && <BishopTab />}
    </ModuleShell>
  )
}
