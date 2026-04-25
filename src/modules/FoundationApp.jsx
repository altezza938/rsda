import { useState } from 'react'
import ModuleShell from '../components/ModuleShell.jsx'
import ShallowFoundationTab from '../tabs/ShallowFoundationTab.jsx'
import ConsolidationTab from '../tabs/ConsolidationTab.jsx'

const TABS = [
  { id: 'bearing',       label: 'Bearing & Settlement' },
  { id: 'consolidation', label: 'Consolidation (Multi-layer)' },
]

export default function FoundationApp({ onBack }) {
  const [tab, setTab] = useState('bearing')
  return (
    <ModuleShell title="Shallow Foundations" subtitle="Vesic bearing · Elastic · Consolidation"
      level="GEO" tabs={TABS} activeTab={tab} onTab={setTab} onBack={onBack}>
      {tab === 'bearing'       && <ShallowFoundationTab />}
      {tab === 'consolidation' && <ConsolidationTab />}
    </ModuleShell>
  )
}
