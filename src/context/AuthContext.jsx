import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

// Citește userul din localStorage sincron — verifică și expirarea tokenului
function getStoredUser() {
  try {
    const key = Object.keys(localStorage).find(
      k => k.startsWith('sb-') && k.endsWith('-auth-token')
    )
    if (!key) return null
    const data = JSON.parse(localStorage.getItem(key))
    // Dacă tokenul e expirat, șterge-l imediat
    if (data?.expires_at && data.expires_at * 1000 < Date.now()) {
      localStorage.removeItem(key)
      return null
    }
    return data?.user ?? null
  } catch {
    return null
  }
}

async function ensureProfile(user) {
  if (!user) return
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()
  if (data) return
  await supabase.from('profiles').insert({
    id:        user.id,
    full_name: user.user_metadata?.full_name ?? '',
    role:      'citizen',
  })
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser)   // sincron din localStorage

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) {
          // Sesiune invalidă/expirată — curățăm localStorage automat
          Object.keys(localStorage)
            .filter(k => k.startsWith('sb-'))
            .forEach(k => localStorage.removeItem(k))
        }
        setUser(session?.user ?? null)
        if (session?.user) {
          try { await ensureProfile(session.user) } catch (e) { console.warn(e) }
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
