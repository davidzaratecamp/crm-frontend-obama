// src/pages/PersonalLogin.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/PersonalLogin.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export default function PersonalLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/api/_auth/personal/login`, { email, password });

      const { personal, token } = res.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('personalInfo', JSON.stringify(personal));

      alert(`¡Bienvenido, ${personal.nombre}! Has iniciado sesión como ${personal.rol}.`);

      // ----------------------------------------------------
      // Lógica de Redirección basada en el Rol del usuario
      // ----------------------------------------------------
      switch (personal.rol) {
        case 'Auditor':
          navigate('/auditor');
          break;
        case 'Agente':
          navigate('/'); // Redirige a la página principal de los formularios
          break;
        // Puedes agregar más roles aquí si los necesitas
        // case 'Backoffice':
        //   navigate('/backoffice');
        //   break;
        // case 'Administrador':
        //   navigate('/admin');
        //   break;
        default:
          navigate('/'); // Redirección por defecto si el rol no está especificado
          break;
      }

    } catch (err) {
      console.error('Error de login:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-form-wrapper">
        <div className="login-card">
          <h2 className="login-title">Iniciar Sesión Personal</h2>
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group-login">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                className="form-input-login"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group-login">
              <label htmlFor="password">Contraseña:</label>
              <input
                type="password"
                id="password"
                className="form-input-login"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="error-message-login">{error}</p>}
            <button type="submit" disabled={loading} className="login-button">
              {loading ? 'Iniciando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}