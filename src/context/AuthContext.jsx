import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

async function ensureProfile(user) {
  if (!user) return
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()
  if (data) return
  await supabase.from('profiles').insert({
    id: user.id,
    full_name: user.user_metadata?.full_name ?? '',
    role: 'citizen',
  })
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      if (session?.user) {
        try { await ensureProfile(session.user) } catch (e) { console.warn(e) }
      }
      if (mounted) setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return
        setUser(session?.user ?? null)
        if (session?.user) {
          try { await ensureProfile(session.user) } catch (e) { console.warn(e) }
        }
        setLoading(false)
      }
    )
    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
