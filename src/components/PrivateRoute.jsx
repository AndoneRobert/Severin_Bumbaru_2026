import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Dacă userul nu e autentificat, îl trimitem la /login
// "replace" înseamnă că nu salvăm /report/new în history
// — apăsând Back nu se întoarce la ruta protejată
function PrivateRoute({ children }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default PrivateRoute
