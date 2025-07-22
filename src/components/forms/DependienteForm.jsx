// frontend/src/components/forms/DependienteForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { calculateAge } from '../../utils/dateCalculations';
import LocationSelector from './LocationSelector';
import FormStatusIndicator from '../statusIndicators/FormStatusIndicator'; // Importa el indicador

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

function DependienteForm({ userId, onDependienteAdded, initialData, onContinueToIngresos }) {
    const [formData, setFormData] = useState({
        parentesco: 'Hijo',
        solicita_cobertura: false,
        nombres: '',
        apellidos: '',
        sexo: '', // Cambiado a vacío
        direccion: '',
        fecha_nacimiento: '',
        social: '', // Mantener como string para permitir el control de 9 dígitos
        estatus_migratorio: '', // Cambiado a vacío
        medicare_medicaid: false,
        estado: '',
        condado: '',
        ciudad: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [dependientesList, setDependientesList] = useState([]); // Lista de dependientes ya añadidos
    const [editingDependienteId, setEditingDependienteId] = useState(null); // ID del dependiente que se está editando
    const [age, setAge] = useState(null);

    // Estado local para la ubicación, inicializado desde formData/initialData
    const [currentLocation, setCurrentLocation] = useState({
        estado: formData.estado,
        condado: formData.condado,
        ciudad: formData.ciudad
    });

    // Opciones para el desplegable de Estatus Migratorio
    const estatusMigratorioOptions = [
        "RESIDENTE", "CIUDADANO", "PERMISO DE TRABAJO", "PASAPORTE",
        "VISA DE TRABAJO", "ASILO/REFUGIADO", "ASILO/POLÍTICO",
        "PAROLE HUMANITARIO", "TPS", "GREEN CARD", "I-220A"
    ];

    // Define los campos requeridos para un dependiente
    const requiredFields = [
        'parentesco', 'nombres', 'apellidos', 'sexo', 'fecha_nacimiento',
        'estatus_migratorio', 'direccion'
        // 'social' no está aquí, lo que significa que no es un campo obligatorio para el llenado del formulario.
        // Si necesitas que social sea obligatorio, añádelo aquí y también el atributo 'required' al input.
    ];
    const totalRequiredFields = requiredFields.length + 3; // +3 para Estado, Condado, Ciudad

    const [completedRequiredFields, setCompletedRequiredFields] = useState(0);

    // --- Lógica de precarga de datos (cuando initialData cambia) ---
    useEffect(() => {
        if (initialData && initialData.length > 0) {
            setDependientesList(initialData);
            // La lógica para editar un dependiente específico se manejará al hacer clic en 'Editar'
        } else {
            setDependientesList([]);
            clearForm(); // Resetea el formulario completamente
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
                completed++;
            }
        });
        if (formData.estado && formData.estado !== '') completed++;
        if (formData.condado && formData.condado !== '') completed++;
        if (formData.ciudad && formData.ciudad !== '') completed++;
        return completed;
    };


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'social') {
            // Eliminar cualquier cosa que no sea un dígito
            const cleanedValue = value.replace(/\D/g, '');
            // Limitar a 9 dígitos
            const limitedValue = cleanedValue.slice(0, 9);
            setFormData(prev => ({
                ...prev,
                [name]: limitedValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
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
        if (!userId) {
            setError('Error: ID de usuario principal no proporcionado.');
            return;
        }

        const fieldsRemaining = totalRequiredFields - countCompletedFields();
        if (fieldsRemaining > 0) {
            setError(`❌ Faltan ${fieldsRemaining} campo(s) obligatorio(s) por completar.`);
            return;
        }

        // Validación específica para el número social (si se ha ingresado, debe tener 9 dígitos)
        // Solo valida si el campo 'social' tiene algún valor.
        if (formData.social && (formData.social.length !== 9 || !/^\d{9}$/.test(formData.social))) {
            setError('❌ El número social debe contener exactamente 9 dígitos.');
            return;
        }


        try {
            let response;
            const dataToSend = { ...formData };

            if (editingDependienteId) {
                // Si estamos editando, hacemos un PUT
                response = await axios.put(`${API_BASE_URL}/api/dependientes/${editingDependienteId}`, dataToSend);
                setMessage('✅ Dependiente actualizado con éxito.');
            } else {
                // Si no, hacemos un POST para crear uno nuevo
                response = await axios.post(`${API_BASE_URL}/api/${userId}/dependientes`, dataToSend);
                setMessage('✅ Dependiente añadido con éxito. ID: ' + response.data.dependienteId);
            }

            if (onDependienteAdded) {
                onDependienteAdded(editingDependienteId || response.data.dependienteId);
            }

            clearForm(); // Resetea el formulario después de añadir/actualizar

        } catch (err) {
            console.error('Error al añadir/actualizar dependiente:', err.response ? err.response.data : err.message);
            setError(err.response ? err.response.data.message : '❌ Error al conectar con el servidor.');
        }
    };

    const editDependiente = (dependiente) => {
        // Formatear fecha_nacimiento a 'YYYY-MM-DD' si viene de la DB (Date object)
        const formattedDate = dependiente.fecha_nacimiento ?
            new Date(dependiente.fecha_nacimiento).toISOString().split('T')[0] : '';

        setFormData({
            ...dependiente,
            fecha_nacimiento: formattedDate
        });
        setCurrentLocation({
            estado: dependiente.estado || '',
            condado: dependiente.condado || '',
            ciudad: dependiente.ciudad || ''
        });
        setEditingDependienteId(dependiente.id); // Guardar el ID del dependiente que se está editando
        setAge(calculateAge(formattedDate)); // Recalcular edad
        setMessage(''); // Limpiar mensajes al empezar a editar
        setError(''); // Limpiar errores al empezar a editar
    };

    const deleteDependiente = async (idToDelete) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este dependiente?')) {
            try {
                await axios.delete(`${API_BASE_URL}/api/dependientes/${idToDelete}`);
                setMessage('✅ Dependiente eliminado con éxito.');
                if (onDependienteAdded) {
                    onDependienteAdded();
                }
                if (editingDependienteId === idToDelete) {
                    clearForm(); // Limpiar el formulario si se elimina el que se estaba editando
                }
            } catch (err) {
                console.error('Error al eliminar dependiente:', err);
                setError('❌ Error al eliminar dependiente.');
            }
        }
    };

    const clearForm = () => {
        setFormData({
            parentesco: 'Hijo', solicita_cobertura: false, nombres: '', apellidos: '',
            sexo: '', direccion: '', fecha_nacimiento: '', social: '', estatus_migratorio: '',
            medicare_medicaid: false, estado: '', condado: '', ciudad: ''
        });
        setCurrentLocation({ estado: '', condado: '', ciudad: '' });
        setEditingDependienteId(null);
        setAge(null);
        setMessage('');
        setError('');
    };


    return (
        <div>
            <div className="form-title-status">
                <h3>Añadir/Editar Dependiente</h3>
                <FormStatusIndicator
                    totalFields={totalRequiredFields}
                    completedFields={completedRequiredFields}
                />
            </div>
            {message && <p className="form-messages success">{message}</p>}
            {error && <p className="form-messages error">{error}</p>}

            <form onSubmit={handleSubmit}>
                <div className="form-grid">

                    <div className="form-field">
                        <label>Parentesco:<span className="required-star">*</span></label>
                        <select name="parentesco" value={formData.parentesco} onChange={handleChange} required>
                            <option value="">Selecciona</option>
                            <option value="Cónyuge">Cónyuge</option>
                            <option value="Hijo">Hijo</option>
                            <option value="Hijastro">Hijastro</option>
                            <option value="Padre">Padre</option>
                            <option value="Madre">Madre</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>

                    <div className="form-field">
                        <label className="toggle-switch-label">
                            Solicita cobertura?:
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
                            <option value="Femenino">Femenino</option>
                            <option value="Masculino">Masculino</option>
                        </select>
                    </div>

                    <div className="form-section-separator">
                        <h4>Datos Demográficos y de Contacto</h4>
                    </div>

                    <div className="form-field">
                        <label>Dirección:<span className="required-star">*</span></label>
                        <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} required />
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
                        <label>Número Social:</label>
                        <input
                            type="text"
                            name="social"
                            value={formData.social}
                            onChange={handleChange}
                            maxLength="9" // Limita a 9 caracteres en el input
                            pattern="\d{9}" // Patrón para asegurar solo 9 dígitos (para navegadores que lo soporten)
                            title="El número social debe contener exactamente 9 dígitos." // Mensaje de ayuda
                            inputMode="numeric" // Optimizado para teclados numéricos en móviles
                        />
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

                    <LocationSelector
                        onLocationChange={handleLocationChange}
                        initialLocation={{ estado: currentLocation.estado, condado: currentLocation.condado, ciudad: currentLocation.ciudad }}
                    />

                    <div className="form-field">
                        <label>
                            Medicare o Medicaid?:
                            <input type="checkbox" name="medicare_medicaid" checked={formData.medicare_medicaid} onChange={handleChange} />
                        </label>
                    </div>

                </div> {/* Cierre de form-grid */}

                <button type="submit">
                    {editingDependienteId ? 'Actualizar Dependiente' : 'Añadir Dependiente'}
                </button>
                {editingDependienteId && (
                    <button type="button" onClick={clearForm} style={{ backgroundColor: '#ffc107', marginLeft: '10px' }}>
                        Añadir Nuevo
                    </button>
                )}
            </form>

            {/* Lista de dependientes ya añadidos con opciones para editar/eliminar */}
            {dependientesList.length > 0 && (
                <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    <h4>Dependientes Registrados:</h4>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {dependientesList.map((dep) => (
                            <li key={dep.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px 15px', marginBottom: '8px', backgroundColor: '#f8f9fa',
                                borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                                <span>
                                    {dep.nombres} {dep.apellidos} ({dep.parentesco}) - Edad: {calculateAge(dep.fecha_nacimiento)}
                                </span>
                                <div>
                                    <button type="button" onClick={() => editDependiente(dep)}
                                        style={{ backgroundColor: '#17a2b8', padding: '8px 12px', fontSize: '0.9em' }}>
                                        Editar
                                    </button>
                                    <button type="button" onClick={() => deleteDependiente(dep.id)}
                                        style={{ backgroundColor: '#dc3545', padding: '8px 12px', fontSize: '0.9em', marginLeft: '8px' }}>
                                        Eliminar
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    {/* Botón para pasar al siguiente formulario si ya no se van a añadir más dependientes */}
                    <button type="button" onClick={onContinueToIngresos} style={{ backgroundColor: '#007bff' }}>
                        Continuar a Ingresos
                    </button>
                </div>
            )}
        </div>
    );
}

export default DependienteForm;