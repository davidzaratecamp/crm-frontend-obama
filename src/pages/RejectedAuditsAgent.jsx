// src/pages/RejectedAuditsAgent.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/RejectedAuditsAgent.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export default function RejectedAuditsAgent() {
    const [auditorias, setAuditorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAuditoriasRechazadas = async () => {
            const personalInfo = JSON.parse(localStorage.getItem('personalInfo'));
            if (!personalInfo || !personalInfo.id) {
                setError('No se pudo obtener el ID del agente.');
                setLoading(false);
                return;
            }
            try {
                // Este endpoint debe existir en tu backend
                const response = await axios.get(`${API_BASE_URL}/api/_asesor/${personalInfo.id}/auditorias-rechazadas`);
                setAuditorias(response.data);
            } catch (err) {
                console.error('Error al obtener auditorías rechazadas:', err);
                setError('Error al cargar la lista de auditorías rechazadas.');
            } finally {
                setLoading(false);
            }
        };
        fetchAuditoriasRechazadas();
    }, []);

    const handleCorreccion = (idUsuario) => {
        // ✅ CAMBIO: Navegamos a la nueva ruta de corrección
        navigate(`/correccion/${idUsuario}`);
    };

    if (loading) return <p>Cargando auditorías rechazadas...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="rejected-audits-agent-container">
            <h1>Auditorías Rechazadas</h1>
            {auditorias.length > 0 ? (
                <div className="auditoria-list">
                    {auditorias.map((auditoria) => (
                        <div key={auditoria.id_grabacion} className="auditoria-card">
                            <h3>Cliente: {auditoria.nombre_cliente} {auditoria.apellido_cliente}</h3>
                            <p><strong>Observaciones del Auditor:</strong> {auditoria.observaciones_auditor}</p>
                            <button onClick={() => handleCorreccion(auditoria.id_usuario)}>
                                Corregir y Reenviar
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p>No tienes auditorías rechazadas.</p>
            )}
        </div>
    );
}
