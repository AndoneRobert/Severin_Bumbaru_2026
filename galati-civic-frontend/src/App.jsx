import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
// import Register from './pages/Register';
// 1. IMPORTĂM CONTEXTUL TĂU DE AUTENTIFICARE
import { AuthProvider } from './context/AuthContext'; 
import './App.css';

function App() {
  return (
    <Router>
      {/* 2. ÎMBRĂCĂM APLICAȚIA ÎN AuthProvider */}
      <AuthProvider>
        <div className="app-layout">
          <Navbar /> 
          
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />           
              <Route path="/dashboard" element={<Dashboard />} /> 
              <Route path="/login" element={<Login />} /> 
              {/* <Routes path="/register" element={<Register />} />      */}
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;