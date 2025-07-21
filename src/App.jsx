// frontend/src/App.jsx
import React from 'react';
import PrincipalData from './pages/PrincipalData.jsx';
import Sidebar from './components/Sidebar.jsx'; // Importa el Sidebar
import './App.css'; // Estilos generales de la aplicación


function App() {
    return (
        <div className="app-container"> {/* Contenedor principal para el layout */}
            <Sidebar /> {/* El menú lateral */}
            <div className="main-content"> {/* El área de contenido principal */}
                <PrincipalData />
            </div>
        </div>
    );
}

export default App;