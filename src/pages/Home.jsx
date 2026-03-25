import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Home.css'

const MapSection = lazy(() => import('../components/MapSection'))

function MapLoader() {
  return (
    <div className="map-loader">
      <div className="spinner" />
      Se încarcă harta...
    </div>
  )
}

/* ── date statice (vor fi înlocuite cu date reale din Supabase) ── */
const CATEGORIES = [
  { icon: '🚧', label: 'Drumuri & Asfalt',  count: 142, grad: 'linear-gradient(135deg,#fef3c7,#fde68a)' },
  { icon: '💡', label: 'Iluminat Stradal',   count: 87,  grad: 'linear-gradient(135deg,#ede9fe,#ddd6fe)' },
  { icon: '🗑️', label: 'Salubritate',        count: 203, grad: 'linear-gradient(135deg,#d1fae5,#a7f3d0)' },
  { icon: '🌳', label: 'Spații Verzi',       count: 64,  grad: 'linear-gradient(135deg,#dcfce7,#bbf7d0)' },
  { icon: '🚰', label: 'Apă & Canalizare',   count: 51,  grad: 'linear-gradient(135deg,#dbeafe,#bfdbfe)' },
  { icon: '🚌', label: 'Transport Public',   count: 38,  grad: 'linear-gradient(135deg,#fce7f3,#fbcfe8)' },
]

const RECENT = [
  { id:1, icon:'🚧', title:'Groapă pe Bd. Galați nr. 45',          status:'in_progress', time:'acum 2h',   cat:'Drumuri' },
  { id:2, icon:'💡', title:'Felinar defect Parcul Rizer',           status:'new',         time:'acum 4h',   cat:'Iluminat' },
  { id:3, icon:'🗑️', title:'Container deteriorat str. Brăilei',    status:'resolved',    time:'ieri',      cat:'Salubritate' },
  { id:4, icon:'🚰', title:'Canalizare blocată Micro 40',           status:'new',         time:'acum 6h',   cat:'Apă' },
]

const S = {
  new:         { label:'Nouă',      cls:'badge-new' },
  in_progress: { label:'În lucru',  cls:'badge-progress' },
  resolved:    { label:'Rezolvată', cls:'badge-resolved' },
}

function Home() {
  const { user } = useAuth()

  return (
    <div className="home">

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="hero">
        {/* aurora background */}
        <div className="hero__aurora">
          <div className="aurora a1" /><div className="aurora a2" />
          <div className="aurora a3" /><div className="aurora a4" />
        </div>
        {/* noise overlay */}
        <div className="hero__noise" />

        <div className="container hero__grid">
          {/* LEFT — text */}
          <div className="hero__left">
            <div className="hero__pill fade-up">
              <span className="live-dot" />
              Platforma oficială · Galați
            </div>

            <h1 className="hero__h1 fade-up-2">
              Orașul tău.<br />
              <span className="grad-text">Vocea ta.</span>
            </h1>

            <p className="hero__sub fade-up-3">
              Sesizează orice problemă urbană în câteva secunde
              și urmărește în timp real cum primăria o rezolvă.
            </p>

            <div className="hero__btns fade-up-3">
              {user ? (
                <Link to="/report/new" className="btn btn-primary btn-xl">
                  <span>➕</span> Depune sesizare
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-xl">
                    Începe gratuit →
                  </Link>
                  <Link to="/login" className="btn btn-secondary btn-lg">
                    Autentificare
                  </Link>
                </>
              )}
            </div>

            {/* micro stats */}
            <div className="hero__micro fade-up-4">
              <div className="micro-stat"><b>1.247</b><span>sesizări</span></div>
              <div className="micro-div" />
              <div className="micro-stat"><b>89%</b><span>rezolvate</span></div>
              <div className="micro-div" />
              <div className="micro-stat"><b>3.100+</b><span>cetățeni</span></div>
              <div className="micro-div" />
              <div className="micro-stat"><b>4.2 zile</b><span>timp mediu</span></div>
            </div>
          </div>

          {/* RIGHT — floating UI cards */}
          <div className="hero__right fade-up-2">
            {/* card principal */}
            <div className="hero-card hero-card--main">
              <div className="hero-card__header">
                <span className="hero-card__icon">📍</span>
                <div>
                  <div className="hero-card__title">Sesizare nouă</div>
                  <div className="hero-card__sub">Groapă Bd. Galați, nr. 45</div>
                </div>
                <span className="badge badge-new" style={{marginLeft:'auto'}}>Nouă</span>
              </div>
              <div className="hero-card__bar">
                <div className="bar-track"><div className="bar-fill" style={{width:'30%'}} /></div>
                <span className="bar-label">În așteptare</span>
              </div>
            </div>

            {/* card mic stânga */}
            <div className="hero-card hero-card--sm hero-card--tl">
              <div className="hero-card__stat-num">38</div>
              <div className="hero-card__stat-label">rezolvate săptămâna asta</div>
              <div className="hero-card__trend">↑ 12% vs. săpt. trecută</div>
            </div>

            {/* card mic dreapta */}
            <div className="hero-card hero-card--sm hero-card--tr">
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                <span className="live-dot" />
                <span style={{fontSize:'.78rem',fontWeight:700,color:'#10b981'}}>LIVE</span>
              </div>
              <div className="hero-card__stat-num" style={{fontSize:'1.4rem'}}>12</div>
              <div className="hero-card__stat-label">sesizări active acum</div>
            </div>

            {/* decorative ring */}
            <div className="hero-ring" />
          </div>
        </div>

        {/* wave bottom */}
        <svg className="hero__wave" viewBox="0 0 1440 90" preserveAspectRatio="none">
          <path d="M0,45 C240,90 480,0 720,45 C960,90 1200,0 1440,45 L1440,90 L0,90Z" fill="var(--bg)"/>
        </svg>
      </section>

      {/* ══════════════════ BENTO STATS ══════════════════ */}
      <section className="section bento-section">
        <div className="container">
          <div className="section-label">De ce Galați Sesizări?</div>
          <h2 className="section-title" style={{marginBottom:40}}>Platforma care face diferența</h2>

          <div className="bento-grid">
            <div className="bento-card bento-card--blue bento-big">
              <div className="bento-card__eyebrow">Sesizări totale</div>
              <div className="bento-card__num">1.247</div>
              <p className="bento-card__desc">Raportate de cetățenii din Galați de la lansare</p>
              <div className="bento-card__deco">📊</div>
            </div>

            <div className="bento-card bento-card--green">
              <div className="bento-card__eyebrow">Rată rezolvare</div>
              <div className="bento-card__num">89%</div>
              <p className="bento-card__desc">Sesizări soluționate cu succes</p>
              <div className="bento-card__deco">✅</div>
            </div>

            <div className="bento-card bento-card--violet">
              <div className="bento-card__eyebrow">Timp mediu răspuns</div>
              <div className="bento-card__num">4.2 <span style={{fontSize:'1.2rem'}}>zile</span></div>
              <p className="bento-card__desc">De la sesizare la primirea unui răspuns</p>
              <div className="bento-card__deco">⚡</div>
            </div>

            <div className="bento-card bento-card--dark bento-wide">
              <div className="bento-card__eyebrow" style={{color:'rgba(255,255,255,.55)'}}>Cel mai rapid mod de a raporta o problemă</div>
              <div className="bento-card__num" style={{color:'#fff',fontSize:'2rem',fontWeight:800}}>
                3 pași · sub 2 minute
              </div>
              <div className="bento-steps">
                <div className="bento-step"><span>📸</span>Fotografiezi</div>
                <div className="bento-arrow">→</div>
                <div className="bento-step"><span>📨</span>Trimiți</div>
                <div className="bento-arrow">→</div>
                <div className="bento-step"><span>🔔</span>Urmărești</div>
              </div>
            </div>

            <div className="bento-card bento-card--amber">
              <div className="bento-card__eyebrow">Cetățeni activi</div>
              <div className="bento-card__num">3.100+</div>
              <p className="bento-card__desc">Utilizatori înregistrați pe platformă</p>
              <div className="bento-card__deco">👥</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ HARTA ══════════════════ */}
      <section className="section section--white map-outer">
        <div className="container">
          <div className="section-label">Live pe hartă</div>
          <h2 className="section-title">Sesizările din Galați</h2>
          <p className="section-desc">Toate problemele raportate, vizibile în timp real pe harta orașului</p>
        </div>
        <Suspense fallback={<MapLoader />}>
          <MapSection />
        </Suspense>
      </section>

      {/* ══════════════════ CATEGORII ══════════════════ */}
      <section className="section">
        <div className="container">
          <div className="section-label">Categorii</div>
          <h2 className="section-title">Ce poți sesiza?</h2>
          <p className="section-desc">Orice problemă urbană din Municipiul Galați</p>

          <div className="cat-grid">
            {CATEGORIES.map(c => (
              <Link to="/report/new" key={c.label} className="cat-card" style={{'--grad': c.grad}}>
                <span className="cat-card__icon">{c.icon}</span>
                <strong className="cat-card__name">{c.label}</strong>
                <span className="cat-card__count">{c.count} sesizări</span>
                <div className="cat-card__arrow">→</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ SESIZĂRI RECENTE ══════════════════ */}
      <section className="section section--white">
        <div className="container">
          <div className="recent-header">
            <div>
              <div className="section-label">Live</div>
              <h2 className="section-title" style={{marginBottom:0}}>Sesizări recente</h2>
            </div>
            <Link to="/" className="btn btn-outline btn-sm">Vezi toate →</Link>
          </div>

          <div className="recent-list">
            {RECENT.map((r, i) => (
              <Link to={`/report/${r.id}`} className="recent-row" key={r.id}
                style={{'--delay': `${i * 80}ms`}}>
                <div className="recent-row__icon">{r.icon}</div>
                <div className="recent-row__body">
                  <span className="recent-row__title">{r.title}</span>
                  <span className="recent-row__meta">{r.cat} · {r.time}</span>
                </div>
                <span className={`badge ${S[r.status].cls}`}>{S[r.status].label}</span>
                <span className="recent-row__chevron">›</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA ══════════════════ */}
      <section className="cta-band">
        <div className="cta-band__noise" />
        <div className="cta-band__glows">
          <div className="cta-glow g1"/><div className="cta-glow g2"/>
        </div>
        <div className="container cta-band__inner">
          <div className="cta-band__text">
            <div className="cta-band__tag">Alătură-te comunității</div>
            <h2 className="cta-band__h2">Gălățenii merită<br/>un oraș mai bun.</h2>
            <p className="cta-band__p">
              Fiecare sesizare contează. Împreună construim un Galați mai curat,
              mai sigur și mai funcțional.
            </p>
          </div>
          <div className="cta-band__actions">
            {user ? (
              <Link to="/report/new" className="btn btn-primary btn-xl">
                ➕ Depune o sesizare
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-xl">
                  Creează cont gratuit
                </Link>
                <Link to="/login" className="btn btn-secondary btn-lg">
                  Am deja cont
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer className="footer">
        <div className="container footer__inner">
          <div className="footer__brand">
            <div className="footer__logo">📍</div>
            <div>
              <div className="footer__name">Galați Sesizări</div>
              <div className="footer__tagline">Platforma oficială a Municipiului Galați</div>
            </div>
          </div>
          <div className="footer__links">
            <a href="#" className="footer__link">Termeni</a>
            <a href="#" className="footer__link">Confidențialitate</a>
            <a href="#" className="footer__link">Contact</a>
          </div>
          <div className="footer__copy">© 2026 Primăria Galați</div>
        </div>
      </footer>

    </div>
  )
}

export default Home
