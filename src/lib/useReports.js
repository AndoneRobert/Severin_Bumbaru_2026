import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

/**
 * Hook reutilizabil pentru fetch sesizări.
 * Orice coleg îl importă și are datele gata, fără cod duplicat.
 *
 * Exemple de utilizare:
 *   const { reports, loading, error } = useReports()
 *   const { reports } = useReports({ userId: user.id })
 *   const { reports } = useReports({ status: 'new', limit: 10 })
 */
export function useReports({ userId, status, limit } = {}) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('reports')
        .select('*, categories(name), profiles(full_name)')
        .order('created_at', { ascending: false })

      if (userId) query = query.eq('user_id', userId)
      if (status) query = query.eq('status', status)
      if (limit)  query = query.limit(limit)

      const { data, error } = await query

      if (error) setError(error)
      else       setReports(data ?? [])

      setLoading(false)
    }

    fetch()
  }, [userId, status, limit])

  return { reports, loading, error }
}
