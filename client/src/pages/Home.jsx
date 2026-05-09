import { Link } from 'react-router-dom'
import { Brain, Flame, Scale } from 'lucide-react'
import { Button } from '../components/ui.jsx'

export function Home() {
  return (
    <div className="home-screen">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="home-hero">
        <div className="sage-silhouettes" aria-hidden="true">
          <div className="sage-orb sage-orb-left">
            <Flame size={30} />
          </div>
          <div className="sage-orb sage-orb-center">
            <Scale size={34} />
          </div>
          <div className="sage-orb sage-orb-right">
            <Brain size={30} />
          </div>
        </div>

        <p className="eyebrow">The founder council is in session</p>
        <h1>StartupSage</h1>
        <p className="hero-copy">Your idea, judged by the founders who failed before you.</p>

        <Button asChild className="hero-cta">
          <Link to="/submit">Submit Your Idea</Link>
        </Button>
      </section>

      <section className="home-preview" aria-label="Council preview">
        <div>
          <span>01</span>
          <strong>Adversarial founder lenses</strong>
          <p>Three failed-startup patterns challenge your riskiest assumptions.</p>
        </div>
        <div>
          <span>02</span>
          <strong>Live interrogation</strong>
          <p>Sage messages stream in as the council presses for evidence.</p>
        </div>
        <div>
          <span>03</span>
          <strong>Decision report</strong>
          <p>Walk away with risks, pivots, and next moves instead of vague encouragement.</p>
        </div>
      </section>
    </div>
  )
}
