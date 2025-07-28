// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // ✅ Importaciones clave
import PrincipalData from './pages/PrincipalData.jsx';
import Sidebar from './components/Sidebar.jsx';
import './App.css';

function App() {
    return (
        // ✅ Envuelve toda tu aplicación en BrowserRouter
        <Router>
            <div className="app-container">
                {/* Sidebar siempre visible */}
                <Sidebar />
                <div className="main-content">
                    {/* Define tus rutas aquí */}
                    <Routes>
                        {/* Ruta para un nuevo registro (cuando no hay ID en la URL) */}
                        <Route path="/" element={<PrincipalData />} />

                        {/* Ruta para continuar un registro existente (cuando hay ID en la URL) */}
                        <Route path="/registro/:userId" element={<PrincipalData />} />

                        {/* Si tienes otras rutas, añádelas aquí */}
                        {/* <Route path="/otra-pagina" element={<OtraPagina />} /> */}
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

export default App;