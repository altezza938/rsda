import { useState } from 'react'
import ModuleShell from '../components/ModuleShell.jsx'
import ConsolidationTab from '../tabs/ConsolidationTab.jsx'

const TABS = [
  { id: 'consolidation', label: 'Primary Consolidation' },
]

export default function SettlementApp({ onBack }) {
  const [tab, setTab] = useState('consolidation')
  return (
    <ModuleShell title="Settlement Calculations" subtitle="Terzaghi · Multi-layer · Time curves"
      level="GEO" tabs={TABS} activeTab={tab} onTab={setTab} onBack={onBack}>
      {tab === 'consolidation' && <ConsolidationTab />}
    </ModuleShell>
  )
}
