// frontend/src/components/Sidebar.jsx

import React, { useState, useEffect } from 'react';

import { Link } from 'react-router-dom'; // Asume que estás usando React Router

import axios from 'axios'; // Para obtener los usuarios pendientes

import '../styles/Sidebar.css';

import logo from '../assets/logo.png';



const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';



function Sidebar() {

const [pendingUsers, setPendingUsers] = useState([]);

const [showSeguimientoSubmenu, setShowSeguimientoSubmenu] = useState(false); // Estado para controlar el desplegable de Seguimiento



// Función para cargar los usuarios pendientes

useEffect(() => {

const fetchPendingUsers = async () => {

try {

// ✅ NUEVO ENDPOINT: Necesitarás crear este en tu backend

const response = await axios.get(`${API_BASE_URL}/api/usuarios/pendientes`);

setPendingUsers(response.data);

} catch (error) {

console.error('Error al cargar usuarios pendientes:', error);

// Opcional: Mostrar un mensaje de error o manejarlo de otra forma

}

};



// Cargar usuarios pendientes al montar el componente o cuando se abra el menú de seguimiento

if (showSeguimientoSubmenu) {

fetchPendingUsers();

}

}, [showSeguimientoSubmenu]); // Se ejecuta cuando el submenu de seguimiento se abre/cierra



return (

<div className="sidebar-container">

<div className="sidebar-header">

<img src={logo} alt="Logo de la empresa" className="sidebar-logo" />

</div>

<nav className="sidebar-nav">

<ul>

<li className="nav-item">

<Link to="/">Página principal</Link>

</li>

<li className="nav-item">

<a href="/#">Correo electrónico</a>

</li>

<li className="nav-item">

<a href="/#">Disposiciones de plano</a>

</li>

<li className="nav-item has-submenu">

<a href="#ventas">Ventas</a>

<ul className="submenu">

<li className="submenu-item active">

<Link to="/">✔ Nueva venta</Link> {/* Este enlazará a PrincipalData (registro nuevo) */}

</li>

<li className="submenu-item">

<a href="/#">✔ Ventas</a>

</li>

<li className="submenu-item">

<a href="/#">Lista de teléfonos</a>

</li>

</ul>

</li>

{/* --- NUEVA SECCIÓN: SEGUIMIENTO --- */}

<li className="nav-item has-submenu">

<a

href="#seguimiento"

onClick={(e) => {

e.preventDefault(); // Evitar navegación por defecto

setShowSeguimientoSubmenu(!showSeguimientoSubmenu);

}}

>

Seguimiento

</a>

{showSeguimientoSubmenu && ( // Renderiza el submenú si showSeguimientoSubmenu es true

<ul className="submenu">

{pendingUsers.length > 0 ? (

pendingUsers.map(user => (

<li key={user.id} className="submenu-item">

{/* ✅ AL HACER CLIC, NAVEGA A PrincipalData CON EL userId */}

{/* Asumo que PrincipalData podrá cargar un usuario específico por su ID */}

<Link to={`/registro/${user.id}`}>

{user.nombres} {user.apellidos}

</Link>

</li>

))

) : (

<li className="submenu-item no-items">No hay registros pendientes.</li>

)}

</ul>

)}

</li>

{/* --- FIN NUEVA SECCIÓN --- */}

</ul>

</nav>

</div>

);

}



export default Sidebar;