import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

function Navbar() {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [userOpen, setUserOpen]   = useState(false)
  const { user, signOut }         = useAuth()
  const location                  = useLocation()
  const navigate                  = useNavigate()
  const dropdownRef               = useRef(null)

  useEffect(() => {
    function handleScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location])

  // Închide dropdown-ul user la click în afara lui
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    await signOut()
    setUserOpen(false)
    navigate('/')
  }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">

        {/* LOGO */}
        <Link to="/" className="navbar__logo">
          <div className="navbar__logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          </div>
          <div className="navbar__logo-text">
            <span className="navbar__logo-city">Galați</span>
            <span className="navbar__logo-sub">Sesizări</span>
          </div>
        </Link>

        {/* NAV LINKS */}
        <nav className={`navbar__nav ${menuOpen ? 'navbar__nav--open' : ''}`}>
          <Link to="/" className={`navbar__link ${location.pathname === '/' ? 'active' : ''}`}>
            Acasă
          </Link>
          {user && (
            <Link to="/my-reports" className={`navbar__link ${location.pathname === '/my-reports' ? 'active' : ''}`}>
              Sesizările mele
            </Link>
          )}
          {user && (
            <Link to="/report/new" className={`navbar__link ${location.pathname === '/report/new' ? 'active' : ''}`}>
              + Sesizare nouă
            </Link>
          )}
          {/* Arată Admin doar dacă userul are rolul admin — îl vom verifica din profiles mai târziu */}

          <div className="navbar__divider-mobile" />

          {/* AUTH — mobile */}
          <div className="navbar__auth-mobile">
            {user ? (
              <button className="btn btn-ghost" onClick={handleLogout}>Deconectare</button>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">Autentificare</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Înregistrare</Link>
              </>
            )}
          </div>
        </nav>

        {/* AUTH — desktop */}
        <div className="navbar__auth">
          {user ? (
            <div className="user-menu" ref={dropdownRef}>
              <button className="user-menu__trigger" onClick={() => setUserOpen(o => !o)}>
                <div className="user-menu__avatar">{initials}</div>
                <span className="user-menu__name">
                  {user.user_metadata?.full_name?.split(' ')[0] ?? 'Contul meu'}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ transform: userOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>

              {userOpen && (
                <div className="user-menu__dropdown">
                  <div className="user-menu__email">{user.email}</div>
                  <div className="user-menu__divider" />
                  <Link to="/my-reports" className="user-menu__item" onClick={() => setUserOpen(false)}>
                    📁 Sesizările mele
                  </Link>
                  <Link to="/report/new" className="user-menu__item" onClick={() => setUserOpen(false)}>
                    ➕ Sesizare nouă
                  </Link>
                  <div className="user-menu__divider" />
                  <button className="user-menu__item user-menu__item--danger" onClick={handleLogout}>
                    🚪 Deconectare
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Autentificare</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Înregistrare</Link>
            </>
          )}
        </div>

        {/* HAMBURGER */}
        <button
          className={`navbar__hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(m => !m)}
          aria-label="Meniu"
        >
          <span /><span /><span />
        </button>

      </div>
    </header>
  )
}

export default Navbar
