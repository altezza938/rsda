import { useState } from 'react'
import VersionPage from './VersionPage.jsx'
import OldApp from './modules/OldApp.jsx'
import RetainingApp from './modules/RetainingApp.jsx'
import LandingPage from './LandingPage.jsx'
import SlopeApp from './modules/SlopeApp.jsx'
import ExcavationApp from './modules/ExcavationApp.jsx'
import FoundationApp from './modules/FoundationApp.jsx'
import PileApp from './modules/PileApp.jsx'
import SettlementApp from './modules/SettlementApp.jsx'

function GeoSuite({ onBack }) {
  const [module, setModule] = useState(null)
  const backToSuite = () => setModule(null)

  if (module === 'slope')      return <SlopeApp onBack={backToSuite} />
  if (module === 'excavation') return <ExcavationApp onBack={backToSuite} />
  if (module === 'retaining')  return <RetainingApp onBack={backToSuite} />
  if (module === 'foundation') return <FoundationApp onBack={backToSuite} />
  if (module === 'pile')       return <PileApp onBack={backToSuite} />
  if (module === 'settlement') return <SettlementApp onBack={backToSuite} />
  return <LandingPage onSelect={setModule} onBack={onBack} />
}

export default function App() {
  const [version, setVersion] = useState(null)
  const back = () => setVersion(null)

  if (version === 'v1') return <OldApp onBack={back} />
  if (version === 'v2') return <RetainingApp onBack={back} />
  if (version === 'v3') return <GeoSuite onBack={back} />
  return <VersionPage onSelect={setVersion} />
}
