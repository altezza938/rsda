import { useState } from 'react'
import ModuleShell from '../components/ModuleShell.jsx'
import SinglePileTab from '../tabs/SinglePileTab.jsx'
import PileGroupTab from '../tabs/PileGroupTab.jsx'

const TABS = [
  { id: 'single', label: 'Single Pile' },
  { id: 'group',  label: 'Pile Group' },
]

export default function PileApp({ onBack }) {
  const [tab, setTab] = useState('single')
  return (
    <ModuleShell title="Pile Foundations" subtitle="Meyerhof · Alpha method · Group efficiency"
      level="GEO" tabs={TABS} activeTab={tab} onTab={setTab} onBack={onBack}>
      {tab === 'single' && <SinglePileTab />}
      {tab === 'group'  && <PileGroupTab />}
    </ModuleShell>
  )
}
