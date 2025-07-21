// frontend/src/components/Sidebar.jsx
import React from 'react';
import '../styles/Sidebar.css'; // Estilos para el Sidebar
import logo from '../assets/logo.png'; // Asegúrate de tener una imagen de logo, si no, elimina esta línea

function Sidebar() {
    return (
        <div className="sidebar-container">
            <div className="sidebar-header">
                {/* Puedes usar tu logo aquí */}
                <img src={logo} alt="Logo de la empresa" className="sidebar-logo" />
                {/* O solo texto si no tienes un logo */}
                {/* <h2>Tu Empresa</h2> */}
            </div>
            <nav className="sidebar-nav">
                <ul>
                    {/* Elementos del menú, usa Link si tienes react-router-dom */}
                    <li className="nav-item active">
                        <a href="/#">Página principal</a> {/* O <Link to="/">Página principal</Link> */}
                    </li>
                    <li className="nav-item">
                        <a href="/#">Correo electrónico</a>
                    </li>
                    <li className="nav-item">
                        <a href="/#">Disposiciones de plano</a>
                    </li>
                    <li className="nav-item has-submenu">
                        <a href="/#">Cuidado de Obama</a>
                        <ul className="submenu">
                            <li className="submenu-item active">
                                <a href="/#">✔ Nueva venta</a> {/* El de la imagen */}
                            </li>
                            <li className="submenu-item">
                                <a href="/#">✔ Ventas</a>
                            </li>
                            <li className="submenu-item">
                                <a href="/#">Lista de teléfonos</a>
                            </li>
                        </ul>
                    </li>
                    {/* Añade más elementos del menú según necesites */}
                </ul>
            </nav>
        </div>
    );
}

export default Sidebar;