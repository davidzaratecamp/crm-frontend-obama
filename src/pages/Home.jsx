import React, { useState, useEffect } from 'react';
import Navbar from "../components/Navbar";
import ProgressBars from "../components/ranking/ProgressBars";
import axios from 'axios';
import "../styles/home.css";
import { url } from '../data/url';

export default function Home() {
  const [players, setPlayers] = useState([
    { name: 'Vendedor 1', score: 0 },
    { name: 'Vendedor 2', score: 0 },
    { name: 'Vendedor 3', score: 0 },
  ]);

  const [ventas, setVentas] = useState([]);
  const [fechaInicioMes, setFechaInicioMes] = useState("");
  const [fechaActual, setFechaActual] = useState("");

  // Obtener fechas al montar el componente
  useEffect(() => {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const fechaHoyStr = hoy.toISOString().split('T')[0];           // "2025-04-05"
    const fechaInicioStr = inicioMes.toISOString().split('T')[0];  // "2025-04-01"

    setFechaActual(fechaHoyStr);
    setFechaInicioMes(fechaInicioStr);
  }, []);

  // Buscar ventas cuando tengas las fechas
  const search = async () => {
    if (!fechaInicioMes || !fechaActual) return;

    try {
      const tablabusqueda = "usuarios";
      const endpoint = `${url}/contadorventas/${tablabusqueda}/created_at/${fechaInicioMes}/${fechaActual}`;

      const res = await axios.get(endpoint);      

      if (res.data.length === 0) {
        setVentas([]);
      } else {
        setVentas(res.data.total);
      }
    } catch (error) {
      console.error("Error en la búsqueda:", error);
    }
  };

  // Ejecutar búsqueda cuando las fechas estén listas
  useEffect(() => {
    if (fechaInicioMes && fechaActual) {
      search();
    }
  }, [fechaInicioMes, fechaActual, url]);

  // Actualizar puntajes cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setPlayers(prev => prev.map(player => ({
        ...player,
        score: Math.floor(Math.random()*100)
      })));
    }, 10000);


    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const winner = players.reduce((a, b) => (a.score > b.score ? a : b), players[0]);

  return (
    <div>
      <Navbar />
      <div className="container text-center">
        <div className='row'>
          <div className="card m-3" style={{ width: '25rem', background: 'linear-gradient(100deg, #0C584C, #37EC7C)',border: 'none'}}>
            <div className="card-body p-5">
              <h5 className="card-title">📊 Resumen</h5>
              <h6 className="card-subtitle mb-2 text-muted">Ventas del mes</h6>
              <p className="card-text">
                <strong>Ventas cargadas:</strong> {ventas}
              </p>
              <p className="card-text">
                <strong>Rango: </strong>
                {fechaInicioMes} → {fechaActual}
              </p>
            </div>
          </div>
          <div className='card m-3' style={{ width: '30rem', background: 'linear-gradient(100deg, #373E4D, #4283EE)',border: 'none'}}>
            <ProgressBars players={players} className="Contenedocardr_general" />
          </div>

        </div>
        
      </div>
      
      <div className='accordion-header'>
        <h2>Mejor vendedor: {winner.name}</h2>
        {/* Opcional: mostrar fechas */}
        <p>
          <small>
            Rango: {fechaInicioMes} → {fechaActual}
          </small>
        </p>
      </div>
    </div>
  );
}