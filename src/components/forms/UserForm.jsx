import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { calculateAge } from '../../utils/dateCalculations';
import LocationSelector from './LocationSelector';
import FormStatusIndicator from '../statusIndicators/FormStatusIndicator';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Añadir onUserUpdated a las props
function UserForm({ onUserCreated, initialData, userIdForUpdate, onUserUpdated }) {
    const [formData, setFormData] = useState({
        solicita_cobertura: false, // Por defecto false
        nombres: '',
        apellidos: '',
        sexo: '',
        fecha_nacimiento: '',
        social: '',
        estatus_migratorio: '',
        tipo_vivienda: '',
        direccion: '',
        ciudad: '',
        estado: '',
        codigo_postal: '',
        condado: '',
        correo_electronico: '',
        phone_1: '',
        phone_2: '', // Campo opcional
        origen_venta: '',
        pregunta_seguridad: '',
        respuesta_seguridad: ''
    });

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [age, setAge] = useState(null);
    const [showValidationErrors, setShowValidationErrors] = useState(false);

    const estatusMigratorioOptions = [
        "RESIDENTE", "CIUDADANO", "PERMISO DE TRABAJO", "PASAPORTE",
        "VISA DE TRABAJO", "ASILO/REFUGIADO", "ASILO/POLÍTICO",
        "PAROLE HUMANITARIO", "TPS", "GREEN CARD", "I-220A"
    ];

    const requiredFields = [
        // ✅ ELIMINADO: 'solicita_cobertura' de los campos requeridos
        'nombres', 'apellidos', 'sexo', 'fecha_nacimiento',
        'social', 'estatus_migratorio',
        'tipo_vivienda', 'direccion', 'codigo_postal',
        'correo_electronico', 'phone_1',
        'origen_venta',
        'pregunta_seguridad', 'respuesta_seguridad'
    ];

    const totalRequiredFields = requiredFields.length + 3; // +3 para Estado, Condado, Ciudad

    const [completedRequiredFields, setCompletedRequiredFields] = useState(0);

    // --- Lógica de precarga de datos (cuando initialData o userIdForUpdate cambian) ---
    useEffect(() => {
        if (initialData) {
            const formattedDate = initialData.fecha_nacimiento ?
                new Date(initialData.fecha_nacimiento).toISOString().split('T')[0] : '';

            const cleanedInitialData = Object.fromEntries(
                Object.entries(initialData).map(([key, value]) => [
                    key,
                    value === null ? '' : value // Reemplaza null por cadena vacía
                ])
            );

            setFormData({
                ...cleanedInitialData,
                fecha_nacimiento: formattedDate,
                respuesta_seguridad: ''
            });
            setAge(calculateAge(formattedDate));
            setShowValidationErrors(true);
        } else {
            setFormData({
                solicita_cobertura: false, nombres: '', apellidos: '', sexo: '',
                fecha_nacimiento: '', social: '', estatus_migratorio: '',
                tipo_vivienda: '', direccion: '', codigo_postal: '', correo_electronico: '',
                phone_1: '', phone_2: '', origen_venta: '',
                pregunta_seguridad: '', respuesta_seguridad: '',
                ciudad: '', estado: '', condado: ''
            });
            setAge(null);
            setMessage('');
            setError('');
            setShowValidationErrors(false);
        }
    }, [initialData, userIdForUpdate]);

    useEffect(() => {
        setCompletedRequiredFields(countCompletedFields());
    }, [formData]);

    useEffect(() => {
        const calculatedAge = calculateAge(formData.fecha_nacimiento);
        setAge(calculatedAge);
    }, [formData.fecha_nacimiento]);

    const countCompletedFields = () => {
        let completed = 0;

        requiredFields.forEach(field => {
            if (formData[field] !== undefined && formData[field] !== null) {
                if (typeof formData[field] === 'string' && formData[field].trim() === '') {
                    // Ignorar strings vacíos o solo espacios en blanco
                } else if (String(formData[field]) === 'Selecciona una opción') {
                    // Ignorar la opción por defecto de los selects
                } else {
                    completed++;
                }
            }
        });

        if (formData.estado && formData.estado.trim() !== '') completed++;
        if (formData.condado && formData.condado.trim() !== '') completed++;
        if (formData.ciudad && formData.ciudad.trim() !== '') completed++;

        return completed;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'social') {
            const cleanedValue = value.replace(/\D/g, '');
            setFormData(prev => ({
                ...prev,
                [name]: cleanedValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
        if (!showValidationErrors) {
            setShowValidationErrors(true);
        }
    };

    const handleLocationChange = (location) => {
        setFormData(prev => ({
            ...prev,
            estado: location.estado,
            condado: location.condado,
            ciudad: location.ciudad
        }));
        if (!showValidationErrors) {
            setShowValidationErrors(true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setShowValidationErrors(true);

        const fieldsRemaining = totalRequiredFields - countCompletedFields();
        if (fieldsRemaining > 0) {
            setError(`❌ Faltan ${fieldsRemaining} campo(s) obligatorio(s) por completar.`);
            return;
        }

        if (formData.social && (formData.social.length !== 9 || !/^\d{9}$/.test(formData.social))) {
            setError('❌ El número social debe contener exactamente 9 dígitos.');
            return;
        }

        try {
            let response;
            const dataToSend = { ...formData };

            if (userIdForUpdate) {
                response = await axios.put(`${API_BASE_URL}/api/usuarios/${userIdForUpdate}`, dataToSend);
                setMessage('✅ Usuario actualizado con éxito.');
                if (onUserUpdated) {
                    onUserUpdated();
                }
            } else {
                response = await axios.post(`${API_BASE_URL}/api/usuarios`, dataToSend);
                setMessage('✅ Usuario creado con éxito. ID: ' + response.data.userId);
                if (onUserCreated) {
                    onUserCreated(response.data.userId);
                }
                setFormData({
                    solicita_cobertura: false, nombres: '', apellidos: '', sexo: '',
                    fecha_nacimiento: '', social: '', estatus_migratorio: '',
                    tipo_vivienda: '', direccion: '', codigo_postal: '', correo_electronico: '',
                    phone_1: '', phone_2: '', origen_venta: '',
                    pregunta_seguridad: '', respuesta_seguridad: '',
                    ciudad: '', estado: '', condado: ''
                });
                setShowValidationErrors(false);
            }

        } catch (err) {
            console.error('Error al procesar usuario:', err.response ? err.response.data : err.message);
            setError(err.response ? err.response.data.message : '❌ Error al conectar con el servidor.');
            setShowValidationErrors(true);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-title-status">
                <h3>Datos Personales del Solicitante Principal</h3>
                {showValidationErrors && (
                    <FormStatusIndicator
                        totalFields={totalRequiredFields}
                        completedFields={completedRequiredFields}
                    />
                )}
            </div>

            {message && <p className="form-messages success">{message}</p>}
            {error && showValidationErrors && <p className="form-messages error">{error}</p>}

            <div className="form-grid">

                {/* Campo Solicita Cobertura */}
                <div className="form-field">
                    <label className="toggle-switch-label">
                        ¿Solicita cobertura?:
                        <input
                            type="checkbox"
                            name="solicita_cobertura"
                            checked={formData.solicita_cobertura}
                            onChange={handleChange}
                            className="toggle-switch-input"
                        />
                        <span className="toggle-switch-slider"></span>
                    </label>
                </div>

                {/* Campo Nombres */}
                <div className="form-field">
                    <label>Nombres:<span className="required-star">*</span></label>
                    <input type="text" name="nombres" value={formData.nombres} onChange={handleChange} required />
                </div>

                {/* Campo Apellidos */}
                <div className="form-field">
                    <label>Apellidos:<span className="required-star">*</span></label>
                    <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} required />
                </div>

                {/* Campo Sexo */}
                <div className="form-field">
                    <label>Sexo:<span className="required-star">*</span></label>
                    <select name="sexo" value={formData.sexo} onChange={handleChange} required>
                        <option value="">Selecciona</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                    </select>
                </div>

                {/* Campo Fecha de Nacimiento */}
                <div className="form-field">
                    <label>Fecha de Nacimiento:<span className="required-star">*</span></label>
                    <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} required />
                </div>

                {/* Campo Edad Actual (solo lectura) */}
                <div className="form-field">
                    <label>Edad Actual:</label>
                    <input
                        type="text"
                        value={age !== null ? `${age} años` : ''}
                        disabled
                        readOnly
                        className="read-only-input"
                    />
                </div>

                {/* Campo Número Social */}
                <div className="form-field">
                    <label>Número Social:<span className="required-star">*</span></label>
                    <input
                        type="text"
                        name="social"
                        value={formData.social}
                        onChange={handleChange}
                        maxLength="9"
                        pattern="\d{9}"
                        title="El número social debe contener exactamente 9 dígitos."
                        inputMode="numeric"
                    />
                </div>

                {/* Campo Estatus Migratorio */}
                <div className="form-field">
                    <label>Estatus Migratorio:<span className="required-star">*</span></label>
                    <select name="estatus_migratorio" value={formData.estatus_migratorio} onChange={handleChange} required>
                        <option value="">Selecciona una opción</option>
                        {estatusMigratorioOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                </div>

                <div className="form-section-separator">
                    <h4>Información de Contacto y Ubicación</h4>
                </div>

                {/* Campo Dirección */}
                <div className="form-field">
                    <label>Dirección:<span className="required-star">*</span></label>
                    <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} required />
                </div>

                {/* Campo Tipo de Vivienda */}
                <div className="form-field">
                    <label>Tipo de Vivienda:<span className="required-star">*</span></label>
                    <input type="text" name="tipo_vivienda" value={formData.tipo_vivienda} onChange={handleChange} />
                </div>

                {/* Componente LocationSelector */}
                <LocationSelector
                    location={{
                        estado: formData.estado,
                        condado: formData.condado,
                        ciudad: formData.ciudad
                    }}
                    onLocationChange={handleLocationChange}
                />

                {/* Campo Código Postal */}
                <div className="form-field">
                    <label>Código Postal:<span className="required-star">*</span></label>
                    <input type="text" name="codigo_postal" value={formData.codigo_postal} onChange={handleChange} />
                </div>

                {/* Campo Correo Electrónico */}
                <div className="form-field">
                    <label>Correo Electrónico:<span className="required-star">*</span></label>
                    <input type="email" name="correo_electronico" value={formData.correo_electronico} onChange={handleChange} required />
                </div>

                {/* Campo Teléfono 1 */}
                <div className="form-field">
                    <label>Teléfono 1:<span className="required-star">*</span></label>
                    <input type="tel" name="phone_1" value={formData.phone_1} onChange={handleChange} required />
                </div>

                {/* Campo Teléfono 2 (opcional) */}
                <div className="form-field">
                    <label>Teléfono 2 (opcional):</label>
                    <input type="tel" name="phone_2" value={formData.phone_2} onChange={handleChange} />
                </div>

                <div className="form-section-separator">
                    <h4>Información de Origen de la Venta y Seguridad</h4>
                </div>

                {/* Campo Origen de la Venta */}
                <div className="form-field">
                    <label>Origen de la Venta:<span className="required-star">*</span></label>
                    <select name="origen_venta" value={formData.origen_venta} onChange={handleChange} required>
                        <option value="">Selecciona una opción</option>
                        <option value="Leard">Leard</option>
                        <option value="Referido">Referido</option>
                        <option value="Base">Base</option>
                    </select>
                </div>

                {/* Campo Pregunta de Seguridad */}
                <div className="form-field">
                    <label>Pregunta de Seguridad:<span className="required-star">*</span></label>
                    <input type="text" name="pregunta_seguridad" value={formData.pregunta_seguridad} onChange={handleChange} required />
                </div>

                {/* Campo Respuesta de Seguridad */}
                <div className="form-field">
                    <label>Respuesta de Seguridad:<span className="required-star">*</span></label>
                    <input type="password" name="respuesta_seguridad" value={formData.respuesta_seguridad} onChange={handleChange} required />
                </div>
            </div>

            <button type="submit">
                {userIdForUpdate ? 'Actualizar Usuario' : 'Registrar Usuario Principal'}
            </button>
        </form>
    );
}

export default UserForm;