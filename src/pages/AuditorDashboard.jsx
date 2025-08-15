// src/pages/AuditorDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/AuditorDashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export default function AuditorDashboard() {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/_auditor/audits/pending`);
        setAudits(response.data);
      } catch (err) {
        console.error('Error al obtener auditorías:', err);
        setError('Error al cargar la lista de auditorías pendientes.');
      } finally {
        setLoading(false);
      }
    };
    fetchAudits();
  }, []);

  const handleGoToDetail = (idGrabacion) => {
    // ✅ This should match the route path defined in your router
    navigate(`/auditor/audits/${idGrabacion}`);
  };

  if (loading) return <p>Cargando auditorías...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="auditor-dashboard">
      <h1>Auditoría de Grabaciones Pendientes</h1>
      {audits.length === 0 ? (
        <p>No hay grabaciones pendientes de auditar.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID Grabación</th>
              <th>Cliente</th>
              <th>Agente</th>
              <th>Fecha</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
  {audits.map((audit) => (
    // ✅ Change 'audit.id' to 'audit.id_grabacion'
    <tr key={audit.id_grabacion}> 
      <td>{audit.id_grabacion}</td>
      <td>{audit.nombre_cliente} {audit.apellido_cliente}</td>
      <td>{audit.nombre_agente} {audit.apellido_agente}</td>
      <td>{new Date(audit.fecha_grabacion).toLocaleDateString()}</td>
      <td>
        {/* ✅ Also change 'audit.id' to 'audit.id_grabacion' for the navigation handler */}
        <button onClick={() => handleGoToDetail(audit.id_grabacion)}> 
          Revisar
        </button>
      </td>
    </tr>
  ))}
</tbody>
        </table>
      )}
    </div>
  );
}