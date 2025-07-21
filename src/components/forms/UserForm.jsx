// frontend/src/components/forms/UserForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { calculateAge } from '../../utils/dateCalculations';
import LocationSelector from './LocationSelector';
import FormStatusIndicator from '../statusIndicators/FormStatusIndicator';

// Añadir onUserUpdated a las props
function UserForm({ onUserCreated, initialData, userIdForUpdate, onUserUpdated }) {
    const [formData, setFormData] = useState({
        solicita_cobertura: false,
        nombres: '',
        apellidos: '',
        sexo: '',
        fecha_nacimiento: '',
        estado_cobertura: '',
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
        referido: '',
        base: '',
        pregunta_seguridad: '',
        respuesta_seguridad: ''
    });

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [age, setAge] = useState(null);

    const [currentLocation, setCurrentLocation] = useState({
        estado: formData.estado,
        condado: formData.condado,
        ciudad: formData.ciudad
    });

    const estatusMigratorioOptions = [
        "RESIDENTE", "CIUDADANO", "PERMISO DE TRABAJO", "PASAPORTE",
        "VISA DE TRABAJO", "ASILO/REFUGIADO", "ASILO/POLÍTICO",
        "PAROLE HUMANITARIO", "TPS", "GREEN CARD", "I-220A"
    ];

    // Define TODOS los campos obligatorios EXCEPTO phone_2
    const requiredFields = [
        'nombres', 'apellidos', 'sexo', 'fecha_nacimiento',
        'estado_cobertura', 'social', 'estatus_migratorio',
        'tipo_vivienda', 'direccion', 'codigo_postal',
        'correo_electronico', 'phone_1',
        'origen_venta', 'referido', 'base',
        'pregunta_seguridad', 'respuesta_seguridad'
    ];

    const totalRequiredFields = requiredFields.length + 3; // +3 por estado, condado, ciudad

    const [completedRequiredFields, setCompletedRequiredFields] = useState(0);

    // --- Lógica de precarga de datos (cuando initialData o userIdForUpdate cambian) ---
    useEffect(() => {
        if (initialData) {
            const formattedDate = initialData.fecha_nacimiento ?
                new Date(initialData.fecha_nacimiento).toISOString().split('T')[0] : '';

            setFormData({
                ...initialData,
                fecha_nacimiento: formattedDate,
                respuesta_seguridad: '' // Nunca precargar la respuesta de seguridad
            });
            setCurrentLocation({
                estado: initialData.estado || '',
                condado: initialData.condado || '',
                ciudad: initialData.ciudad || ''
            });
            setAge(calculateAge(formattedDate));
        } else {
            // Resetear el formulario si no hay initialData (para un nuevo registro)
            setFormData({
                solicita_cobertura: false, nombres: '', apellidos: '', sexo: '',
                fecha_nacimiento: '', estado_cobertura: '', social: '', estatus_migratorio: '',
                tipo_vivienda: '', direccion: '', codigo_postal: '', correo_electronico: '',
                phone_1: '', phone_2: '', origen_venta: '', referido: '', base: '',
                pregunta_seguridad: '', respuesta_seguridad: '',
                ciudad: '', estado: '', condado: ''
            });
            setCurrentLocation({ estado: '', condado: '', ciudad: '' });
            setAge(null);
            setMessage('');
            setError('');
        }
    }, [initialData]);

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
            if (formData[field] && String(formData[field]).trim() !== '' && String(formData[field]) !== 'Selecciona una opción') {
                if (typeof formData[field] === 'boolean') {
                    completed++;
                } else if (String(formData[field]).trim() !== '') {
                    completed++;
                }
            }
        });

        if (formData.estado && formData.estado !== '') completed++;
        if (formData.condado && formData.condado !== '') completed++;
        if (formData.ciudad && formData.ciudad !== '') completed++;

        return completed;
    };


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleLocationChange = (location) => {
        setFormData(prev => ({
            ...prev,
            estado: location.estado,
            condado: location.condado,
            ciudad: location.ciudad
        }));
        setCurrentLocation(location);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        const fieldsRemaining = totalRequiredFields - countCompletedFields();
        if (fieldsRemaining > 0) {
            setError(`❌ Faltan ${fieldsRemaining} campo(s) obligatorio(s) por completar.`);
            return;
        }

        try {
            let response;
            const dataToSend = { ...formData };

            if (userIdForUpdate) {
                // Hacemos un PUT para actualizar
                response = await axios.put(`http://10.255.255.85:3001/api/usuarios/${userIdForUpdate}`, dataToSend);
                setMessage('✅ Usuario actualizado con éxito.');
                // Llama al callback para notificar al padre que la actualización fue exitosa
                if (onUserUpdated) {
                    onUserUpdated();
                }
            } else {
                // Hacemos un POST para crear
                response = await axios.post('http://10.255.255.85:3001/api/usuarios', dataToSend);
                setMessage('✅ Usuario creado con éxito. ID: ' + response.data.userId);
                // Llama al callback para el nuevo usuario
                if (onUserCreated) {
                    onUserCreated(response.data.userId);
                }
                // Resetea el formulario solo si es una creación de usuario nuevo
                setFormData({
                    solicita_cobertura: false, nombres: '', apellidos: '', sexo: '',
                    fecha_nacimiento: '', estado_cobertura: '', social: '', estatus_migratorio: '',
                    tipo_vivienda: '', direccion: '', codigo_postal: '', correo_electronico: '',
                    phone_1: '', phone_2: '', origen_venta: '', referido: '', base: '',
                    pregunta_seguridad: '', respuesta_seguridad: '',
                    ciudad: '', estado: '', condado: ''
                });
                setCurrentLocation({ estado: '', condado: '', ciudad: '' });
            }

        } catch (err) {
            console.error('Error al procesar usuario:', err.response ? err.response.data : err.message);
            setError(err.response ? err.response.data.message : '❌ Error al conectar con el servidor.');
        }
    };


    return (
        <form onSubmit={handleSubmit}>
            <div className="form-title-status">
                <h3>Datos Personales del Solicitante Principal</h3>
                <FormStatusIndicator
                    totalFields={totalRequiredFields}
                    completedFields={completedRequiredFields}
                />
            </div>

            {message && <p className="form-messages success">{message}</p>}
            {error && <p className="form-messages error">{error}</p>}

            <div className="form-grid">

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

                <div className="form-field">
                    <label>Nombres:<span className="required-star">*</span></label>
                    <input type="text" name="nombres" value={formData.nombres} onChange={handleChange} required />
                </div>

                <div className="form-field">
                    <label>Apellidos:<span className="required-star">*</span></label>
                    <input type="text" name="apellidos" value={formData.apellidos} onChange={handleChange} required />
                </div>

                <div className="form-field">
                    <label>Sexo:<span className="required-star">*</span></label>
                    <select name="sexo" value={formData.sexo} onChange={handleChange} required>
                        <option value="">Selecciona</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                    </select>
                </div>

                <div className="form-field">
                    <label>Fecha de Nacimiento:<span className="required-star">*</span></label>
                    <input type="date" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} required />
                </div>

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

                <div className="form-field">
                    <label>Estado de Cobertura:<span className="required-star">*</span></label>
                    <input type="text" name="estado_cobertura" value={formData.estado_cobertura} onChange={handleChange} />
                </div>

                <div className="form-field">
                    <label>Número Social:<span className="required-star">*</span></label>
                    <input type="text" name="social" value={formData.social} onChange={handleChange} maxLength="20" />
                </div>

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

                <div className="form-field">
                    <label>Dirección:<span className="required-star">*</span></label>
                    <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} required />
                </div>

                <div className="form-field">
                    <label>Tipo de Vivienda:<span className="required-star">*</span></label>
                    <input type="text" name="tipo_vivienda" value={formData.tipo_vivienda} onChange={handleChange} />
                </div>

                <LocationSelector
                    onLocationChange={handleLocationChange}
                    initialLocation={{ estado: currentLocation.estado, condado: currentLocation.condado, ciudad: currentLocation.ciudad }}
                />

                <div className="form-field">
                    <label>Código Postal:<span className="required-star">*</span></label>
                    <input type="text" name="codigo_postal" value={formData.codigo_postal} onChange={handleChange} />
                </div>

                <div className="form-field">
                    <label>Correo Electrónico:<span className="required-star">*</span></label>
                    <input type="email" name="correo_electronico" value={formData.correo_electronico} onChange={handleChange} required />
                </div>

                <div className="form-field">
                    <label>Teléfono 1:<span className="required-star">*</span></label>
                    <input type="tel" name="phone_1" value={formData.phone_1} onChange={handleChange} required />
                </div>

                <div className="form-field">
                    <label>Teléfono 2 (opcional):</label>
                    <input type="tel" name="phone_2" value={formData.phone_2} onChange={handleChange} />
                </div>

                <div className="form-section-separator">
                    <h4>Información de Origen de la Venta y Seguridad</h4>
                </div>

                <div className="form-field">
                    <label>Origen de la Venta:<span className="required-star">*</span></label>
                    <input type="text" name="origen_venta" value={formData.origen_venta} onChange={handleChange} />
                </div>

                <div className="form-field">
                    <label>Referido:<span className="required-star">*</span></label>
                    <input type="text" name="referido" value={formData.referido} onChange={handleChange} />
                </div>

                <div className="form-field">
                    <label>Base:<span className="required-star">*</span></label>
                    <input type="text" name="base" value={formData.base} onChange={handleChange} />
                </div>

                <div className="form-field">
                    <label>Pregunta de Seguridad:<span className="required-star">*</span></label>
                    <input type="text" name="pregunta_seguridad" value={formData.pregunta_seguridad} onChange={handleChange} required />
                </div>

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