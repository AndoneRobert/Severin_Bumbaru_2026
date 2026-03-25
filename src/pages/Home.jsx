import { lazy, Suspense, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
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

const CAT_META = {
  1: { icon: '🚧', label: 'Drumuri & Asfalt', grad: 'linear-gradient(135deg,#fef3c7,#fde68a)' },
  2: { icon: '💡', label: 'Iluminat Stradal', grad: 'linear-gradient(135deg,#ede9fe,#ddd6fe)' },
  3: { icon: '🗑️', label: 'Salubritate', grad: 'linear-gradient(135deg,#d1fae5,#a7f3d0)' },
  4: { icon: '🌳', label: 'Spații Verzi', grad: 'linear-gradient(135deg,#dcfce7,#bbf7d0)' },
  5: { icon: '🚰', label: 'Apă & Canalizare', grad: 'linear-gradient(135deg,#dbeafe,#bfdbfe)' },
  6: { icon: '🚌', label: 'Transport Public', grad: 'linear-gradient(135deg,#fce7f3,#fbcfe8)' },
}

const S = {
  new: { label: 'Nouă', cls: 'badge-new' },
  in_progress: { label: 'În lucru', cls: 'badge-progress' },
  resolved: { label: 'Rezolvată', cls: 'badge-resolved' },
  rejected: { label: 'Respinsă', cls: 'badge-rejected' },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `acum ${m || 1}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `acum ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return 'ieri'
  return `acum ${d} zile`
}

function Home() {
  const { user } = useAuth()

  const [stats, setStats] = useState({ total: 0, resolved: 0, citizens: 0, avgDays: null })
  const [categories, setCategories] = useState(
    Object.entries(CAT_META).map(([id, m]) => ({ ...m, id: Number(id), count: 0 }))
  )
  const [recent, setRecent] = useState([])

  useEffect(() => {
    async function load() {
      // Fetch all reports (lightweight) — id, status, category_id, title, address, created_at
      const { data: reports } = await supabase
        .from('reports')
        .select('id, status, category_id, title, address, created_at')
        .order('created_at', { ascending: false })
        .limit(500)

      if (!reports) return

      const total = reports.length
      const resolvedList = reports.filter(r => r.status === 'resolved')
      const resolvedCount = resolvedList.length

      // Medie zile până la rezolvare (aproximare: created_at → acum)
      let avgDays = null
      if (resolvedCount > 0) {
        const sum = resolvedList.reduce((acc, r) =>
          acc + (Date.now() - new Date(r.created_at).getTime()) / 86400000, 0)
        avgDays = (sum / resolvedCount).toFixed(1)
      }

      // Counts per categorie
      const catCounts = {}
      reports.forEach(r => {
        if (r.category_id) catCounts[r.category_id] = (catCounts[r.category_id] || 0) + 1
      })

      setStats(prev => ({ ...prev, total, resolved: resolvedCount, avgDays }))
      setCategories(
        Object.entries(CAT_META).map(([id, m]) => ({
          ...m, id: Number(id), count: catCounts[Number(id)] || 0,
        }))
      )
      setRecent(reports.slice(0, 4))
    }

    async function loadCitizens() {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      if (count != null) setStats(prev => ({ ...prev, citizens: count }))
    }

    load()
    loadCitizens()
  }, [])

  const resolveRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0

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
                <span className="badge badge-new" style={{ marginLeft: 'auto' }}>Nouă</span>
              </div>
              <div className="hero-card__bar">
                <div className="bar-track"><div className="bar-fill" style={{ width: '30%' }} /></div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span className="live-dot" />
                <span style={{ fontSize: '.78rem', fontWeight: 700, color: '#10b981' }}>LIVE</span>
              </div>
              <div className="hero-card__stat-num" style={{ fontSize: '1.4rem' }}>12</div>
              <div className="hero-card__stat-label">sesizări active acum</div>
            </div>

            {/* decorative ring */}
            <div className="hero-ring" />
          </div>
        </div>

        {/* wave bottom */}
        <svg className="hero__wave" viewBox="0 0 1440 90" preserveAspectRatio="none">
          <path d="M0,45 C240,90 480,0 720,45 C960,90 1200,0 1440,45 L1440,90 L0,90Z" fill="var(--bg)" />
        </svg>
      </section>

      {/* ══════════════════ BENTO STATS ══════════════════ */}
      <section className="section bento-section">
        <div className="container">
          <div className="section-label">De ce Galați Sesizări?</div>
          <h2 className="section-title" style={{ marginBottom: 40 }}>Platforma care face diferența</h2>

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
              <div className="bento-card__num">4.2 <span style={{ fontSize: '1.2rem' }}>zile</span></div>
              <p className="bento-card__desc">De la sesizare la primirea unui răspuns</p>
              <div className="bento-card__deco">⚡</div>
            </div>

            <div className="bento-card bento-card--dark bento-wide">
              <div className="bento-card__eyebrow" style={{ color: 'rgba(255,255,255,.55)' }}>Cel mai rapid mod de a raporta o problemă</div>
              <div className="bento-card__num" style={{ color: '#fff', fontSize: '2rem', fontWeight: 800 }}>
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
            {categories.map(c => (
              <Link to="/report/new" key={c.label} className="cat-card" style={{ '--grad': c.grad }}>
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
              <h2 className="section-title" style={{ marginBottom: 0 }}>Sesizări recente</h2>
            </div>
            <Link to="/" className="btn btn-outline btn-sm">Vezi toate →</Link>
          </div>

          <div className="recent-list">
            {recent.map((r, i) => {
              const meta = CAT_META[r.category_id] || { icon: '📌', label: 'Categorie' }
              const status = S[r.status] || S.new
              return (
                <Link to={`/report/${r.id}`} className="recent-row" key={r.id}
                  style={{ '--delay': `${i * 80}ms` }}>
                  <div className="recent-row__icon">{meta.icon}</div>
                  <div className="recent-row__body">
                    <span className="recent-row__title">{r.title}</span>
                    <span className="recent-row__meta">{meta.label} · {timeAgo(r.created_at)}</span>
                  </div>
                  <span className={`badge ${status.cls}`}>{status.label}</span>
                  <span className="recent-row__chevron">›</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA ══════════════════ */}
      <section className="cta-band">
        <div className="cta-band__noise" />
        <div className="cta-band__glows">
          <div className="cta-glow g1" /><div className="cta-glow g2" />
        </div>
        <div className="container cta-band__inner">
          <div className="cta-band__text">
            <div className="cta-band__tag">Alătură-te comunității</div>
            <h2 className="cta-band__h2">Gălățenii merită<br />un oraș mai bun.</h2>
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
