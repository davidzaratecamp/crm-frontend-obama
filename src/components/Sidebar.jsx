// frontend/src/components/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/Sidebar.css";
import logo from "../assets/logo.png";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

function Sidebar() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [showSeguimientoSubmenu, setShowSeguimientoSubmenu] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const location = useLocation(); // Hook para obtener la ruta actual

  useEffect(() => {
    const personalInfoString = localStorage.getItem('personalInfo');
    if (personalInfoString) {
      const personalInfo = JSON.parse(personalInfoString);
      setUserRole(personalInfo.rol);
    }
  }, []);

  useEffect(() => {
    const fetchPendingUsers = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/usuarios/pendientes`);
        setPendingUsers(response.data);
      } catch (error) {
        console.error("Error al cargar usuarios pendientes:", error);
      }
    };

    if (userRole === 'Agente' && showSeguimientoSubmenu) {
      fetchPendingUsers();
    }
  }, [showSeguimientoSubmenu, userRole]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('personalInfo');
    navigate('/login');
  };

  if (!userRole) {
    return null;
  }

  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        <img src={logo} alt="Logo de la empresa" className="sidebar-logo" />
      </div>

      <nav className="sidebar-nav">
        <ul>
          {userRole === 'Agente' && (
            <>
              <li className="nav-item">
                <Link to="/home">Página principal</Link>
              </li>
              <li className="nav-item has-submenu">
                <a href="#ventas">Ventas</a>
                <ul className="submenu">
                  <li className="submenu-item">
                    <Link to="/registro">✔ Nueva venta</Link>
                  </li>
                  <li className="submenu-item">
                    <Link to="/agent/rejected-audits">
                      ⚠️ Auditorías Rechazadas
                    </Link>
                  </li>
                  <li className="submenu-item">
                    <a href="/#">Lista de teléfonos</a>
                  </li>
                </ul>
              </li>
              <li className="nav-item has-submenu">
                <a
                  href="#seguimiento"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowSeguimientoSubmenu(!showSeguimientoSubmenu);
                  }}
                >
                  Seguimiento
                </a>
                {showSeguimientoSubmenu && (
                  <ul className="submenu">
                    {pendingUsers.length > 0 ? (
                      pendingUsers.map((user) => (
                        <li key={user.id} className="submenu-item">
                          <Link to={`/registro/${user.id}`}>
                            {user.nombres} {user.apellidos}
                          </Link>
                        </li>
                      ))
                    ) : (
                      <li className="submenu-item no-items">
                        No hay registros pendientes.
                      </li>
                    )}
                  </ul>
                )}
              </li>
            </>
          )}

          {userRole === 'Auditor' && (
            <>
              <li className="nav-item">
                <Link to="/auditor">Auditoría</Link>
              </li>
            </>
          )}

          <li className="nav-item logout"> 
            <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;