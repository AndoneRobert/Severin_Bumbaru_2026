import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

// Dacă trigger-ul a eșuat sau e o sesiune din confirmare email,
// ne asigurăm că există rândul în profiles
async function ensureProfile(user) {
  if (!user) return

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  // Profilul există deja — nu facem nimic
  if (data) return

  // Nu există → îl creăm acum
  await supabase.from('profiles').insert({
    id:        user.id,
    full_name: user.user_metadata?.full_name ?? '',
    role:      'citizen',
  })
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Timeout de siguranță — dacă Supabase nu răspunde în 5s, deblocăm UI-ul
    const timer = setTimeout(() => {
      console.warn('getSession timeout — deblocăm UI')
      setLoading(false)
    }, 5000)

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        setUser(session?.user ?? null)
        if (session?.user) await ensureProfile(session.user)
      } catch (e) {
        console.warn('Auth init error:', e)
      } finally {
        clearTimeout(timer)
        setLoading(false)
      }
    }).catch(e => {
      console.warn('getSession failed:', e)
      clearTimeout(timer)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) await ensureProfile(session.user)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  if (loading) return (
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
      Se verifică sesiunea...
    </div>
  )

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
