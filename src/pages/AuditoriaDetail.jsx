// src/pages/AuditoriaDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AuditoriaDetail.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export default function AuditoriaDetail() {
  const { idGrabacion } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [estado, setEstado] = useState('aprobado');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/_auditor/audits/${idGrabacion}`);
        setData(response.data);
      } catch (err) {
        console.error('Error al obtener detalles:', err);
        setError('No se pudo cargar la información de la auditoría.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [idGrabacion]);

  const handleSubmit = async () => {
    const personalInfo = JSON.parse(localStorage.getItem('personalInfo'));
    if (!personalInfo || !personalInfo.id) {
        setError('No se pudo obtener el ID del auditor.');
        return;
    }
    const id_auditor = personalInfo.id;

    try {
      await axios.put(`${API_BASE_URL}/api/_auditor/audits/${idGrabacion}`, {
        estado_auditoria: estado,
        observaciones_auditor: observaciones,
        id_auditor: id_auditor,
      });
      alert('Auditoría completada con éxito.');
      navigate('/auditor');
    } catch (err) {
      console.error('Error al enviar la auditoría:', err);
      setError('Error al guardar el resultado de la auditoría.');
    }
  };

  if (loading) return <p>Cargando detalles de la auditoría...</p>;
  if (error) return <p className="error-message">{error}</p>;

  const { grabacion, cliente, conyuge, dependientes, ingresos, planes_salud, informacion_pago } = data;

  const renderField = (label, value) => (
    <p>
      <strong>{label}:</strong> {value || 'N/A'}
    </p>
  );

  return (
    <div className="auditor-detail-page">
      <h1>Detalles de Auditoría</h1>
      <div className="detail-container">
        <div className="client-data-panel">
          <h2>Datos del Cliente: {cliente.nombres} {cliente.apellidos}</h2>
          <div className="scrollable-content">
            {/* Campos del cliente principal */}
            {renderField('ID', cliente.id)}
            {renderField('Solicita Cobertura', cliente.solicita_cobertura ? 'Sí' : 'No')}
            {renderField('Nombres', cliente.nombres)}
            {renderField('Apellidos', cliente.apellidos)}
            {renderField('Sexo', cliente.sexo)}
            {renderField('Fecha de Nacimiento', cliente.fecha_nacimiento ? new Date(cliente.fecha_nacimiento).toLocaleDateString() : 'N/A')}
            {renderField('Estado Cobertura', cliente.estado_cobertura)} {/* <-- Este campo ahora se mostrará */}
            {renderField('Social', cliente.social)}
            {renderField('Estatus Migratorio', cliente.estatus_migratorio)}
            {renderField('Tipo de Vivienda', cliente.tipo_vivienda)}
            {renderField('Dirección', cliente.direccion)}
            {renderField('Ciudad', cliente.ciudad)}
            {renderField('Estado', cliente.estado)}
            {renderField('Código Postal', cliente.codigo_postal)}
            {renderField('Condado', cliente.condado)}
            {renderField('Correo Electrónico', cliente.correo_electronico)}
            {renderField('Teléfono 1', cliente.phone_1)}
            {renderField('Teléfono 2', cliente.phone_2)}
            {renderField('Origen de Venta', cliente.origen_venta)}
            {renderField('Referido', cliente.referido)}
            {renderField('Base', cliente.base)}
            {renderField('Pregunta de Seguridad', cliente.pregunta_seguridad)}
            {renderField('Respuesta de Seguridad', cliente.respuesta_seguridad)}
            {renderField('Fecha de Creación', cliente.created_at ? new Date(cliente.created_at).toLocaleString() : 'N/A')}
            {renderField('Fecha de Actualización', cliente.updated_at ? new Date(cliente.updated_at).toLocaleString() : 'N/A')}
            {renderField('Estado de Registro', cliente.estado_registro)}

            {/* Información de Ingresos del Usuario */}
            <h3>Ingresos del Cliente Principal</h3>
            {ingresos.usuario ? (
                <>
                    {renderField('Tipo de Declaración', ingresos.usuario.tipo_declaracion)}
                    {renderField('Ingresos Semanales', `$${ingresos.usuario.ingresos_semanales}`)}
                    {renderField('Ingresos Anuales', `$${ingresos.usuario.ingresos_anuales}`)}
                </>
            ) : (
                <p>No se encontraron ingresos para el cliente principal.</p>
            )}

            {/* Información de Pago */}
            <h3>Información de Pago</h3>
            {informacion_pago ? (
                <>
                    {renderField('Últimos 4 Dígitos', informacion_pago.ultimos_4_digitos_tarjeta)}
                    {renderField('CVV', informacion_pago.cvv)}
                    {renderField('Fecha de Expiración', `${informacion_pago.fecha_expiracion_mes}/${informacion_pago.fecha_expiracion_ano}`)}
                </>
            ) : (
                <p>No se encontró información de pago.</p>
            )}
            
            {/* Planes de Salud */}
            <h3>Planes de Salud</h3>
            {planes_salud.length > 0 ? (
              planes_salud.map((plan, index) => (
                <div key={index} className="sub-panel">
                  {renderField('Aseguradora', plan.aseguradora)}
                  {renderField('Nombre del Plan', plan.nombre_plan)}
                  {renderField('Tipo de Plan', plan.tipo_plan)}
                  {renderField('Deducible', `$${plan.deducible}`)}
                  {renderField('Gasto Máximo de Bolsillo', `$${plan.gasto_max_bolsillo}`)}
                  {renderField('Valor de la Prima', `$${plan.valor_prima}`)}
                </div>
              ))
            ) : (
                <p>No se encontraron planes de salud.</p>
            )}

            {/* Cónyuge */}
            <h3>Cónyuge</h3>
            {conyuge ? (
                <div className="sub-panel">
                    {renderField('Nombres', conyuge.nombres)}
                    {renderField('Apellidos', conyuge.apellidos)}
                    {renderField('Fecha de Nacimiento', conyuge.fecha_nacimiento ? new Date(conyuge.fecha_nacimiento).toLocaleDateString() : 'N/A')}
                    {renderField('Sexo', conyuge.sexo)}
                    {renderField('Social', conyuge.social)}
                    {renderField('Estatus Migratorio', conyuge.estatus_migratorio)}
                    {renderField('Medicare/Medicaid', conyuge.medicare_medicaid ? 'Sí' : 'No')}
                </div>
            ) : (
                <p>No hay datos de cónyuge.</p>
            )}

            {/* Otros Dependientes y sus Ingresos */}
            <h3>Otros Dependientes</h3>
            {dependientes.length > 0 ? (
                dependientes.map((dep, index) => {
                    const ingresoDependiente = ingresos.dependientes.find(ing => ing.entidad_id === dep.id);
                    return (
                        <div key={index} className="sub-panel">
                            <p><strong>Dependiente #{index + 1}</strong></p>
                            {renderField('Parentesco', dep.parentesco)}
                            {renderField('Solicita Cobertura', dep.solicita_cobertura ? 'Sí' : 'No')}
                            {renderField('Nombres', dep.nombres)}
                            {renderField('Apellidos', dep.apellidos)}
                            {renderField('Sexo', dep.sexo)}
                            {renderField('Fecha de Nacimiento', dep.fecha_nacimiento ? new Date(dep.fecha_nacimiento).toLocaleDateString() : 'N/A')}
                            {renderField('Social', dep.social)}
                            {renderField('Estatus Migratorio', dep.estatus_migratorio)}
                            {renderField('Medicare/Medicaid', dep.medicare_medicaid ? 'Sí' : 'No')}
                            
                            {ingresoDependiente && (
                                <div className="sub-panel-ingresos">
                                    <p><strong>Ingresos:</strong></p>
                                    {renderField('Tipo de Declaración', ingresoDependiente.tipo_declaracion)}
                                    {renderField('Ingresos Semanales', `$${ingresoDependiente.ingresos_semanales}`)}
                                    {renderField('Ingresos Anuales', `$${ingresoDependiente.ingresos_anuales}`)}
                                </div>
                            )}
                        </div>
                    );
                })
            ) : (
                <p>No hay otros dependientes registrados.</p>
            )}
          </div>
        </div>

        {/* Panel de Auditoría */}
        <div className="audit-panel">
          <h2>Módulo de Auditoría</h2>
          
          <div className="recording-section">
            <h3>Grabación a Auditar</h3>
            <audio controls src={grabacion.ruta_archivo}></audio>
            <p>Etiquetas: {grabacion.etiquetas}</p>
          </div>

          <div className="audit-form">
            <div className="form-group">
              <label>Estado de la Auditoría:</label>
              <select value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Observaciones:</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Escribe aquí las observaciones para el agente..."
              />
            </div>
            
            <button onClick={handleSubmit}>Guardar y Enviar</button>
          </div>
        </div>
      </div>
    </div>
  );
}