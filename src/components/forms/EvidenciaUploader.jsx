// frontend/src/components/forms/EvidenciaUploader.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/EvidenciaUploader.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

function EvidenciaUploader({ userId, onEvidenciasCompleted, onEvidenciasUpdated }) {
    const [selectedFiles, setSelectedFiles] = useState([]); // Array para múltiples archivos
    const [fileDescription, setFileDescription] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [evidencias, setEvidencias] = useState([]); // Para mostrar las evidencias ya subidas

    // --- Efecto para precargar evidencias existentes ---
    useEffect(() => {
        const fetchEvidencias = async () => {
            if (userId) {
                try {
                    // Endpoint: /api/usuarios/:usuarioId/evidencias (coincide con tu router)
                    const res = await axios.get(`${API_BASE_URL}/api/${userId}/evidencias`);
                    setEvidencias(res.data);
                } catch (err) {
                    console.error('Error al cargar evidencias existentes:', err);
                    setError('Error al cargar las evidencias.');
                }
            }
        };
        fetchEvidencias();
        setMessage('');
        setError('');
    }, [userId]);

    const handleFileChange = (e) => {
        // Almacenar todos los archivos seleccionados
        setSelectedFiles(Array.from(e.target.files));
        setMessage('');
        setError('');
    };

    const handleDescriptionChange = (e) => {
        setFileDescription(e.target.value);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (selectedFiles.length === 0) {
            setError('❌ Por favor, selecciona al menos un archivo para subir.');
            return;
        }

        const formData = new FormData();
        // Añadir cada archivo al FormData con el nombre de campo 'archivos'
        selectedFiles.forEach(file => {
            formData.append('archivos', file);
        });
        formData.append('descripcion', fileDescription); // La descripción es un campo común para todos los archivos subidos en este envío

        try {
            // Endpoint: /api/usuarios/:usuarioId/evidencias (coincide con tu router POST)
            const res = await axios.post(`${API_BASE_URL}/api/${userId}/evidencias`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setMessage(res.data.message);
            setSelectedFiles([]); // Limpiar archivos seleccionados
            setFileDescription('');
            // Volver a cargar la lista de evidencias para ver los nuevos
            const updatedRes = await axios.get(`${API_BASE_URL}/api/${userId}/evidencias`);
            setEvidencias(updatedRes.data);

            if (onEvidenciasCompleted) {
                onEvidenciasCompleted();
            }
        } catch (err) {
            console.error('Error al subir evidencias:', err.response ? err.response.data : err.message);
            setError(err.response ? err.response.data.message : '❌ Error al subir los archivos.');
        }
    };

    const handleDeleteEvidencia = async (evidenciaId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta evidencia? Esta acción es irreversible.')) {
            try {
                // Endpoint: /api/evidencias/:id (coincide con tu router DELETE)
                await axios.delete(`${API_BASE_URL}/api/evidencias/${evidenciaId}`);
                setMessage('✅ Evidencia eliminada con éxito.');
                setEvidencias(prev => prev.filter(ev => ev.id !== evidenciaId)); // Eliminar de la lista local
                if (onEvidenciasUpdated) { // Si hay una función de actualización
                    onEvidenciasUpdated();
                }
            } catch (err) {
                console.error('Error al eliminar evidencia:', err.response ? err.response.data : err.message);
                setError(err.response ? err.response.data.message : '❌ Error al eliminar la evidencia.');
            }
        }
    };

    return (
    <div className="eup-form-container"> {/* Cambiado de form-container */}
        <h3>Subir Evidencias</h3>
        {message && <p className="eup-form-messages success">{message}</p>} {/* Cambiado de form-messages */}
        {error && <p className="eup-form-messages error">{error}</p>} {/* Cambiado de form-messages */}
        <form onSubmit={handleUpload}>
            <div className="eup-form-grid"> {/* Cambiado de form-grid */}
                <div className="eup-form-field"> {/* Cambiado de form-field */}
                    <label>Seleccionar Archivo(s):<span className="required-star">*</span></label>
                    <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        required
                        accept=".pdf, .jpg, .jpeg, .png"
                    />
                    {selectedFiles.length > 0 && (
                        <p className="eup-file-name-display"> {/* Nuevo className */}
                            Archivos seleccionados: <strong>{selectedFiles.map(f => f.name).join(', ')}</strong>
                        </p>
                    )}
                     <p className="eup-help-text">Máximo 5 archivos (PDF, JPG, PNG), cada uno de hasta 5MB.</p> {/* Nuevo className */}
                </div>
                <div className="eup-form-field"> {/* Cambiado de form-field */}
                    <label>Descripción (opcional):</label>
                    <textarea
                        name="descripcion"
                        value={fileDescription}
                        onChange={handleDescriptionChange}
                        rows="3"
                        placeholder="Breve descripción de los archivos (ej. Comprobantes de ingresos de julio)"
                    ></textarea>
                </div>
            </div>
            <button type="submit" className="eup-submit-button"> {/* Nuevo className */}
                Subir Evidencia(s)
            </button>
        </form>

        <hr style={{ margin: '20px 0', borderColor: 'var(--eup-border-color)' }} /> {/* Ajuste opcional al estilo inline */}

        {evidencias.length > 0 && (
            <div className="eup-existing-evidences"> {/* Cambiado de existing-evidences */}
                <h4>Evidencias Subidas</h4>
                <ul>
                    {evidencias.map(ev => (
                        <li key={ev.id}>
                            <span>
                                <strong>{ev.nombre_archivo}</strong> ({Math.round(ev.tamano_archivo / 1024)} KB) - {ev.descripcion}
                            </span>
                            {ev.ruta_archivo && (
                                 <a href={`${API_BASE_URL}${ev.ruta_archivo}`} target="_blank" rel="noopener noreferrer">Ver</a> 
                            )}
                            <button
                                onClick={() => handleDeleteEvidencia(ev.id)}
                                className="eup-delete-button" /* Cambiado de delete-button, eliminado style inline */
                            >
                                Eliminar
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </div>
);
}

export default EvidenciaUploader;