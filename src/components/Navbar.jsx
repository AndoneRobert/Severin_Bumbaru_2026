import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

function Navbar() {
  const [scrolled, setScrolled]             = useState(false)
  const [menuOpen, setMenuOpen]             = useState(false)
  const [userOpen, setUserOpen]             = useState(false)
  const [confirmLogout, setConfirmLogout]   = useState(false)
  const [notifOpen, setNotifOpen]           = useState(false)
  const [notifications, setNotifications]  = useState([])
  const { user, signOut }                   = useAuth()
  const location                            = useLocation()
  const navigate                            = useNavigate()
  const dropdownRef                         = useRef(null)
  const notifRef                            = useRef(null)

  useEffect(() => {
    function handleScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location])

  // Fetch notificări
  useEffect(() => {
    if (!user) return
    async function fetchNotifs() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      setNotifications(data ?? [])
    }
    fetchNotifs()
  }, [user])

  // Închide dropdowns la click în afară
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setUserOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function markAllRead() {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (!unreadIds.length) return
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  function handleLogout() {
    signOut()
    setConfirmLogout(false)
    setUserOpen(false)
    navigate('/')
  }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? '?'

  const isHome = location.pathname === '/'

  return (
    <header className={`navbar ${(scrolled || !isHome) ? 'navbar--scrolled' : ''}`}>
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

        {/* NOTIFICĂRI */}
        {user && (
          <div className="notif-bell" ref={notifRef}>
            <button
              className="notif-bell__btn"
              onClick={() => { setNotifOpen(o => !o); markAllRead() }}
            >
              🔔
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="notif-bell__badge">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-dropdown__header">
                  <strong>Notificări</strong>
                </div>
                {notifications.length === 0 ? (
                  <p className="notif-empty">Nicio notificare</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`notif-item ${!n.read ? 'notif-item--unread' : ''}`}
                      onClick={() => { setNotifOpen(false); if (n.report_id) navigate(`/report/${n.report_id}`) }}
                    >
                      <span className="notif-item__icon">
                        {n.type === 'comment' ? '💬' : '📋'}
                      </span>
                      <div>
                        <p className="notif-item__msg">{n.message}</p>
                        <span className="notif-item__time">
                          {new Date(n.created_at).toLocaleDateString('ro-RO')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

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
                  <button className="user-menu__item user-menu__item--danger" onClick={() => { setUserOpen(false); setConfirmLogout(true) }}>
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

        {/* MODAL CONFIRMARE DECONECTARE */}
        {confirmLogout && createPortal(
          <div className="confirm-overlay" style={{ zIndex: 9999 }}>
            <div className="confirm-modal">
              <div className="confirm-modal__icon">🚪</div>
              <h3>Te deconectezi?</h3>
              <p>Vei fi redirecționat către pagina principală.</p>
              <div className="confirm-modal__actions">
                <button className="btn btn-ghost" onClick={() => setConfirmLogout(false)}>
                  Anulează
                </button>
                <button className="btn btn-primary" onClick={handleLogout}>
                  Da, deconectează-mă
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

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
