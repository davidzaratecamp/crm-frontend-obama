import React from 'react';
import PrincipalData from './pages/PrincipalData.jsx';
import Sidebar from './components/Sidebar.jsx'; // Importa el Sidebar
import './App.css'; // Estilos generales de la aplicación
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/home' element={
            <div className="app-container">
                <Sidebar />
                <div className="main-content">
                    <Home />
                </div>
            </div>
        } />
        <Route path='/ventas/registro' element={
          <div className="app-container">
            <Sidebar />
            <div className="main-content">
              <PrincipalData />
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;