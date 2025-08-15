import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importación de Páginas y Componentes
import PrincipalData from './pages/PrincipalData.jsx';
import Sidebar from './components/Sidebar.jsx';
import Home from './pages/Home.jsx';
import PersonalLogin from './pages/PersonalLogin';
import AuditorDashboard from './pages/AuditorDashboard';
import AuditoriaDetail from './pages/AuditoriaDetail';
import RejectedAuditsAgent from './pages/RejectedAuditsAgent';
import CorreccionAuditoria from './pages/CorreccionAuditoria'; // ✅ 1. IMPORTAR LA NUEVA PÁGINA
import './App.css';

// Función auxiliar para obtener el rol del usuario desde localStorage
const getUserRole = () => {
    try {
        const personalInfoString = localStorage.getItem('personalInfo');
        if (personalInfoString) {
            const personalInfo = JSON.parse(personalInfoString);
            return personalInfo.rol;
        }
    } catch (error) {
        console.error("Error parsing personal info from localStorage", error);
    }
    return null;
};

// Componente para proteger rutas que requieren autenticación
const ProtectedRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem('authToken');
    return isAuthenticated ? (
        <div className="app-container">
            <Sidebar />
            <main className="app-main-content">
                {children}
            </main>
        </div>
    ) : (
        <Navigate to="/login" replace />
    );
};

function App() {
    const userRole = getUserRole();

    return (
        <Router>
            <Routes>
                {/* Ruta pública para el login */}
                <Route path="/login" element={<PersonalLogin />} />
                
                {/* Ruta raíz que redirige según el rol del usuario */}
                <Route 
                    path="/" 
                    element={
                        userRole === 'Agente' || userRole === 'Administrador' ? (
                            <ProtectedRoute>
                                <Home />
                            </ProtectedRoute>
                        ) : userRole === 'Auditor' ? (
                            <Navigate to="/auditor" replace />
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    }
                />
                
                {/* Ruta explícita para el Home de Agentes/Admins */}
                <Route 
                    path="/home" 
                    element={
                        <ProtectedRoute>
                            <Home />
                        </ProtectedRoute>
                    } 
                />

                {/* Rutas para el registro de nuevos clientes */}
                <Route path="/registro" element={<ProtectedRoute><PrincipalData /></ProtectedRoute>} />
                <Route path="/registro/:userId" element={<ProtectedRoute><PrincipalData /></ProtectedRoute>} />
                
                {/* Rutas para el módulo de Auditoría */}
                <Route path="/auditor" element={<ProtectedRoute><AuditorDashboard /></ProtectedRoute>} />
                <Route path="/auditor/audits/:idGrabacion" element={<ProtectedRoute><AuditoriaDetail /></ProtectedRoute>} />

                {/* Rutas para el módulo de Agentes */}
                <Route path="/agent/rejected-audits" element={<ProtectedRoute><RejectedAuditsAgent /></ProtectedRoute>} />
                
                {/* ✅ 2. AÑADIR LA NUEVA RUTA PARA LA PÁGINA DE CORRECCIÓN */}
                <Route path="/correccion/:userId" element={<ProtectedRoute><CorreccionAuditoria /></ProtectedRoute>} />

                {/* Ruta para manejar páginas no encontradas */}
                <Route path="*" element={<ProtectedRoute><h1>404 - Página no encontrada</h1></ProtectedRoute>} />
            </Routes>
        </Router>
    );
}

export default App;
