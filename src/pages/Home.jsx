// src/pages/Home.jsx (solo la sección de renderizado)

import React, { useState, useEffect, useCallback } from 'react'; // Asegúrate de importar useCallback
import Navbar from "../components/Navbar";
import ProgressBars from "../components/ranking/ProgressBars";
import axios from 'axios';
import "../styles/home.css"; 
import { url } from '../data/url';

export default function Home() {


  const [agentesRanking, setAgentesRanking] = useState([]);
  const [ventasTotalesMes, setVentasTotalesMes] = useState(0);
  const [asesorLogueadoId, setAsesorLogueadoId] = useState(null);
  const [miProgreso, setMiProgreso] = useState({
    ventasLlevo: 0,
    ventasMeta: 5,
    ventasFaltan: 5,
  });

  const [fechaInicioMes, setFechaInicioMes] = useState("");
  const [fechaActual, setFechaActual] = useState("");

  useEffect(() => {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const fechaHoyStr = hoy.toISOString().split('T')[0];
    const fechaInicioStr = inicioMes.toISOString().split('T')[0];

    setFechaActual(fechaHoyStr);
    setFechaInicioMes(fechaInicioStr);

    const personalInfoString = localStorage.getItem('personalInfo');
    if (personalInfoString) {
        try {
            const personalInfo = JSON.parse(personalInfoString);
            if (personalInfo && personalInfo.id) {
                setAsesorLogueadoId(personalInfo.id);
            }
        } catch (e) {
            console.error("Error parseando personalInfo de localStorage en Home:", e);
        }
    }
  }, []);

  // Utiliza useCallback para memoizar la función y evitar bucles en useEffect
  const fetchVentasPorAsesor = useCallback(async () => {
    if (!fechaInicioMes || !fechaActual || asesorLogueadoId === null) return;

    try {
      const endpoint = `${url}/api/usuarios/ventasPorAsesor/${fechaInicioMes}/${fechaActual}`;
      const res = await axios.get(endpoint);

      if (res.data.length === 0) {
        setAgentesRanking([]);
        setVentasTotalesMes(0);
        setMiProgreso(prev => ({ ...prev, ventasLlevo: 0, ventasFaltan: prev.ventasMeta }));
      } else {
        const formattedRanking = res.data.map(item => ({
          name: `${item.nombre_asesor} ${item.apellido_asesor}`,
          score: item.total_ventas
        }));
        setAgentesRanking(formattedRanking);

        const totalMes = res.data.reduce((sum, item) => sum + item.total_ventas, 0);
        setVentasTotalesMes(totalMes);

        const myAgentData = res.data.find(item => item.asesor_id === asesorLogueadoId);
        if (myAgentData) {
          const llevo = myAgentData.total_ventas;
          const faltan = Math.max(0, miProgreso.ventasMeta - llevo);
          setMiProgreso(prev => ({ ...prev, ventasLlevo: llevo, ventasFaltan: faltan }));
        } else {
          setMiProgreso(prev => ({ ...prev, ventasLlevo: 0, ventasFaltan: prev.ventasMeta }));
        }
      }
    } catch (error) {
      console.error("Error al obtener ventas por asesor:", error);
      setAgentesRanking([]);
      setVentasTotalesMes(0);
      setMiProgreso(prev => ({ ...prev, ventasLlevo: 0, ventasFaltan: prev.ventasMeta }));
    }
  }, [fechaInicioMes, fechaActual, asesorLogueadoId, miProgreso.ventasMeta, url]); // Asegúrate de incluir todas las dependencias

  useEffect(() => {
    fetchVentasPorAsesor();
    // Opcional: Recargar periódicamente. Descomenta si lo necesitas.
    // const interval = setInterval(fetchVentasPorAsesor, 30000); // Cada 30 segundos
    // return () => clearInterval(interval);
  }, [fetchVentasPorAsesor]); // Dependencia del useCallback

  const winner = agentesRanking.length > 0
    ? agentesRanking.reduce((a, b) => (a.score > b.score ? a : b), agentesRanking[0])
    : null;

  return (
    <div>
      <Navbar />
      <div className="container text-center">
        {/* Card de Resumen de Ventas del Mes */}
        <div className="card card-summary" style={{ width: '25rem' }}> {/* ✅ Añadida clase card-summary */}
          <div className="card-body p-5">
            <h5 className="card-title">📊 Resumen de Ventas</h5>
            <h6 className="card-subtitle mb-2 text-muted">Ventas del mes para todos los agentes</h6>
            <p className="card-text">
              <strong>Ventas Totales:</strong> {ventasTotalesMes}
            </p>
            <p className="card-text">
              <strong>Rango: </strong>
              {fechaInicioMes} → {fechaActual}
            </p>
          </div>
        </div>

        {/* Card de Progreso del Agente Logueado */}
        {asesorLogueadoId && (
          <div className='card card-progress' style={{ width: '25rem' }}> {/* ✅ Añadida clase card-progress */}
            <div className="card-body p-5">
              <h5 className="card-title">🚀 Mi Progreso Mensual</h5>
              <h6 className="card-subtitle mb-2 text-muted">Datos para este mes</h6>
              <p className="card-text">
                <strong>Ventas Logradas:</strong> {miProgreso.ventasLlevo}
              </p>
              <p className="card-text">
                <strong>Meta:</strong> {miProgreso.ventasMeta}
              </p>
              <p className="card-text">
                <strong>Ventas Faltantes:</strong> {miProgreso.ventasFaltan}
              </p>
              {miProgreso.ventasLlevo >= miProgreso.ventasMeta ? (
                  <p className="card-text text-success fw-bold">¡Meta Alcanzada! 🎉</p>
              ) : (
                  <p className="card-text text-info">¡Sigue así para alcanzar tu meta!</p>
              )}
            </div>
          </div>
        )}

        {/* Card del Ranking de Vendedores */}
        <div className='card card-ranking' style={{ width: '30rem' }}> {/* ✅ Añadida clase card-ranking */}
          {agentesRanking.length > 0 ? (
              <ProgressBars players={agentesRanking} className="Contenedocardr_general" />
          ) : (
              <p className="p-3">No hay ventas registradas este mes para mostrar el ranking.</p>
          )}
        </div>
      </div>

      <div className='accordion-header'>
        <h2>Mejor vendedor del mes: {winner ? winner.name : 'N/A'}</h2>
        <p>
          <small>
            Rango: {fechaInicioMes} → {fechaActual}
          </small>
        </p>
      </div>
    </div>
  );
}