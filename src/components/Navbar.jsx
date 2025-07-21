// frontend/src/components/Navbar.jsx
import React from 'react';
import '../styles/Navbar.css';

// Importa los iconos que necesitas de react-icons/fa (Font Awesome)
import { FaBars, FaTh, FaEnvelope, FaUserCircle } from 'react-icons/fa';

function Navbar() {
    return (
        <div className="navbar-container">
            <div className="navbar-left">
                <div className="navbar-icon-group">
                    {/* Icono de lista/menú */}
                    <FaBars className="icon" />
                    {/* Icono de cuadrícula */}
                    <FaTh className="icon" />
                </div>
            </div>
            <div className="navbar-right">
                <div className="salesperson-info">
                    {/* Icono de sobre para el agente */}
                    <FaEnvelope className="salesperson-icon" />
                    <div className="salesperson-details">
                        <span className="salesperson-name">Vendedor Vital</span>
                        <span className="salesperson-role">Agente</span>
                    </div>
                </div>
                {/* Icono de perfil del usuario en lugar de imagen */}
                <div className="profile-avatar">
                    <FaUserCircle className="profile-icon" /> {/* Un icono de usuario genérico */}
                </div>
            </div>
        </div>
    );
}

export default Navbar;