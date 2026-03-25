import { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

function clearStoredSession() {
  Object.keys(localStorage)
    .filter(k => k.startsWith('sb-'))
    .forEach(k => localStorage.removeItem(k))
}

async function ensureProfile(user) {
  if (!user) return
  const { data } = await supabase
    .from('profiles').select('id').eq('id', user.id).single()
  if (data) return
  await supabase.from('profiles').insert({
    id:        user.id,
    full_name: user.user_metadata?.full_name ?? '',
    role:      'citizen',
  })
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [ready, setReady]     = useState(false)
  const initialized           = useRef(false)

  useEffect(() => {
    // Timeout de siguranță: dacă onAuthStateChange nu răspunde în 3s, deblocăm UI
    const fallback = setTimeout(() => {
      if (!initialized.current) {
        initialized.current = true
        setReady(true)
      }
    }, 3000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) clearStoredSession()
        setUser(session?.user ?? null)
        if (session?.user) {
          try { await ensureProfile(session.user) } catch (e) { console.warn(e) }
        }
        if (!initialized.current) {
          initialized.current = true
          clearTimeout(fallback)
          setReady(true)
        }
      }
    )

    return () => { subscription.unsubscribe(); clearTimeout(fallback) }
  }, [])

  function signOut() {
    clearStoredSession()
    setUser(null)
    // Trimite signOut în background fără să așteptăm răspuns
    supabase.auth.signOut().catch(() => {})
  }

  if (!ready) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      gap: 12, color: '#6b7280', fontSize: '0.9rem',
    }}>
      <div style={{
        width: 24, height: 24,
        border: '2.5px solid #e5e7eb',
        borderTopColor: '#3b82f6',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  )

  return (
    <AuthContext.Provider value={{ user, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
