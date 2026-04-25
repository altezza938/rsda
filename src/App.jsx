import { useState } from 'react'
import LandingPage from './LandingPage.jsx'
import SlopeApp from './modules/SlopeApp.jsx'
import ExcavationApp from './modules/ExcavationApp.jsx'
import RetainingApp from './modules/RetainingApp.jsx'
import FoundationApp from './modules/FoundationApp.jsx'
import PileApp from './modules/PileApp.jsx'
import SettlementApp from './modules/SettlementApp.jsx'

export default function App() {
  const [mode, setMode] = useState(null)
  const back = () => setMode(null)

  if (mode === 'slope')      return <SlopeApp onBack={back} />
  if (mode === 'excavation') return <ExcavationApp onBack={back} />
  if (mode === 'retaining')  return <RetainingApp onBack={back} />
  if (mode === 'foundation') return <FoundationApp onBack={back} />
  if (mode === 'pile')       return <PileApp onBack={back} />
  if (mode === 'settlement') return <SettlementApp onBack={back} />
  return <LandingPage onSelect={setMode} />
}
