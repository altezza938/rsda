import { useState } from 'react'
import ModuleShell from '../components/ModuleShell.jsx'
import SheetPileTab from '../tabs/SheetPileTab.jsx'

const TABS = [
  { id: 'cantilever', label: 'Cantilever Sheet Pile' },
  { id: 'propped',    label: 'Propped / Anchored Wall' },
]

export default function ExcavationApp({ onBack }) {
  const [tab, setTab] = useState('cantilever')
  return (
    <ModuleShell title="Excavation Design" subtitle="Sheet pile · Cantilever · Propped"
      level="GEO" tabs={TABS} activeTab={tab} onTab={setTab} onBack={onBack}>
      <SheetPileTab type={tab} key={tab} />
    </ModuleShell>
  )
}
