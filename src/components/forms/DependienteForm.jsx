// frontend/src/components/forms/DependienteForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { calculateAge } from '../../utils/dateCalculations';
import FormStatusIndicator from '../statusIndicators/FormStatusIndicator';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Añadimos `isConyugeForm` como prop
function DependienteForm({ userId, onDependienteAdded, initialData, onContinueToIngresos, isConyugeForm = false }) {
    const [formData, setFormData] = useState({
        // Si es formulario de cónyuge, el parentesco ya viene fijado, si no, es 'Hijo' por defecto
        parentesco: isConyugeForm ? 'Cónyuge' : 'Hijo',
        solicita_cobertura: false,
        nombres: '',
        apellidos: '',
        sexo: '',
        fecha_nacimiento: '',
        social: '',
        estatus_migratorio: '',
        medicare_medicaid: false,
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [dependientesList, setDependientesList] = useState([]); // Esta lista solo se usa para dependientes, no para cónyuge
    const [editingDependienteId, setEditingDependienteId] = useState(null);
    const [age, setAge] = useState(null);
    const [noDependientesDeclared, setNoDependientesDeclared] = useState(false);
    // NUEVO ESTADO para controlar si se ha seleccionado "No tiene Cónyuge" en este formulario específico
    const [noConyugeDeclared, setNoConyugeDeclared] = useState(false);


    const estatusMigratorioOptions = [
        "RESIDENTE", "CIUDADANO", "PERMISO DE TRABAJO", "PASAPORTE",
        "VISA DE TRABAJO", "ASILO/REFUGIADO", "ASILO/POLÍTICO",
        "PAROLE HUMANITARIO", "TPS", "GREEN CARD", "I-220A"
    ];

    // Define los campos requeridos para un dependiente/cónyuge
    const requiredFields = [
        'parentesco', 'nombres', 'apellidos', 'sexo', 'fecha_nacimiento',
        'estatus_migratorio'
    ];
    const totalRequiredFieldsBase = requiredFields.length;
    const [totalRequiredFields, setTotalRequiredFields] = useState(1); // Inicialmente 1 por el caso "no tiene" o el cónyuge

    const [completedRequiredFields, setCompletedRequiredFields] = useState(0);

    // --- Lógica de precarga de datos y estado `noDependientesDeclared` y `noConyugeDeclared` ---
    useEffect(() => {
        if (isConyugeForm) {
            // Para el formulario del cónyuge, initialData será un solo objeto o null
            if (initialData) {
                const formattedDate = initialData.fecha_nacimiento ?
                    new Date(initialData.fecha_nacimiento).toISOString().split('T')[0] : '';
                setFormData({
                    ...initialData,
                    parentesco: 'Cónyuge', // Aseguramos que siempre sea Cónyuge
                    fecha_nacimiento: formattedDate
                });
                setEditingDependienteId(initialData.id); // Si hay initialData, estamos editando
                setAge(calculateAge(formattedDate));
                setNoConyugeDeclared(false); // Si hay datos iniciales, no se ha declarado "no tiene cónyuge"
            } else {
                // Si no hay initialData para el cónyuge, limpiar el formulario
                setFormData(prev => ({
                    parentesco: 'Cónyuge', // Siempre cónyuge
                    solicita_cobertura: false, nombres: '', apellidos: '',
                    sexo: '', fecha_nacimiento: '', social: '',
                    estatus_migratorio: '', medicare_medicaid: false,
                }));
                setEditingDependienteId(null);
                setAge(null);
                // Si no hay initialData, asumimos que no se ha declarado 'no cónyuge' aún,
                // a menos que venga ya de un estado previo del padre (PrincipalData) que lo indique.
                // Sin embargo, para la inicialización directa de este componente, siempre empezamos sin declarar.
                setNoConyugeDeclared(false);
            }
            // El concepto de 'noDependientesDeclared' no aplica a un formulario de cónyuge
            setNoDependientesDeclared(false);
            setDependientesList([]); // Asegurar que esta lista esté vacía para el cónyuge
        } else {
            // Lógica original para dependientes
            if (initialData && initialData.length > 0) {
                setDependientesList(initialData);
                setNoDependientesDeclared(false);
            } else {
                setDependientesList([]);
                clearForm();
                setNoDependientesDeclared(false);
            }
            setNoConyugeDeclared(false); // Asegurar que este estado está en false para dependientes
        }
        setMessage('');
        setError('');
    }, [initialData, isConyugeForm]); // Añadir isConyugeForm a las dependencias

    useEffect(() => {
        const calculatedAge = calculateAge(formData.fecha_nacimiento);
        setAge(calculatedAge);
    }, [formData.fecha_nacimiento]);

    useEffect(() => {
        if (formData.medicare_medicaid && formData.solicita_cobertura) {
            setFormData(prev => ({
                ...prev,
                solicita_cobertura: false
            }));
        }
    }, [formData.medicare_medicaid]);

    useEffect(() => {
        if (formData.solicita_cobertura && formData.medicare_medicaid) {
            setFormData(prev => ({
                ...prev,
                medicare_medicaid: false
            }));
        }
    }, [formData.solicita_cobertura]);

    // Lógica para el FormStatusIndicator
    useEffect(() => {
        if (isConyugeForm) {
            // Para el formulario de cónyuge:
            if (noConyugeDeclared || editingDependienteId) { // Si se declaró "no cónyuge" o si hay un cónyuge
                setCompletedRequiredFields(1);
                setTotalRequiredFields(1);
            } else {
                let completed = countCompletedFields();
                setCompletedRequiredFields(completed);
                setTotalRequiredFields(totalRequiredFieldsBase);
            }
        } else {
            // Para el formulario de dependientes:
            if (noDependientesDeclared) {
                setCompletedRequiredFields(1);
                setTotalRequiredFields(1);
            } else {
                // Si hay dependientes en la lista, el paso se considera "completado"
                if (dependientesList.length > 0) {
                    setCompletedRequiredFields(1);
                    setTotalRequiredFields(1);
                } else {
                    // Si no hay dependientes en la lista Y no se ha declarado 'noDependientesDeclared'
                    // entonces el progreso es el del formulario actual de añadir uno.
                    setCompletedRequiredFields(countCompletedFields());
                    setTotalRequiredFields(totalRequiredFieldsBase);
                }
            }
        }
    }, [formData, noDependientesDeclared, dependientesList, isConyugeForm, noConyugeDeclared, editingDependienteId]);


    const countCompletedFields = () => {
        let completed = 0;
        requiredFields.forEach(field => {
            // Para el cónyuge, 'parentesco' ya está fijo y no necesita ser validado por el usuario
            if (isConyugeForm && field === 'parentesco') {
                completed++;
                return;
            }
            if (formData[field] && String(formData[field]).trim() !== '' && String(formData[field]) !== 'Selecciona') {
                completed++;
            }
        });
        return completed;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'social') {
            const cleanedValue = value.replace(/\D/g, '');
            const limitedValue = cleanedValue.slice(0, 9);
            setFormData(prev => ({
                ...prev,
                [name]: limitedValue
            }));
        } else if (name === 'medicare_medicaid') {
            if (checked) {
                setFormData(prev => ({
                    ...prev,
                    [name]: checked,
                    solicita_cobertura: false
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    [name]: checked
                }));
            }
        } else if (name === 'solicita_cobertura') {
            if (checked) {
                setFormData(prev => ({
                    ...prev,
                    [name]: checked,
                    medicare_medicaid: false
                }));
            } else {
                setFormData(prev => ({
                    ...prev,
                    [name]: checked
                }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
        // Si el usuario empieza a añadir un dependiente/cónyuge, deseleccionar "No tiene dependientes/cónyuge"
        if (!isConyugeForm && noDependientesDeclared) { // Solo aplica a dependientes
            setNoDependientesDeclared(false);
        }
        if (isConyugeForm && noConyugeDeclared) { // Solo aplica a cónyuge
            setNoConyugeDeclared(false);
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        if (!userId) {
            setError('Error: ID de usuario principal no proporcionado.');
            return;
        }

        // Esta lógica solo aplica al formulario de dependientes
        if (!isConyugeForm && noDependientesDeclared) {
            onContinueToIngresos(); // Aquí significa 'Continuar a Ingresos' para dependientes
            return;
        }

        // Si es el formulario de cónyuge y se declaró que no tiene, no intentar guardar
        if (isConyugeForm && noConyugeDeclared) {
            onContinueToIngresos(true); // Avanzar directamente a dependientes (con el flag de 'no cónyuge')
            return;
        }

        const fieldsRemaining = totalRequiredFieldsBase - countCompletedFields();
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
            delete dataToSend.estado;
            delete dataToSend.condado;
            delete dataToSend.ciudad;

            // Asegurarse de que el parentesco sea 'Cónyuge' si es el formulario de cónyuge
            if (isConyugeForm) {
                dataToSend.parentesco = 'Cónyuge';
            }

            if (editingDependienteId) {
                response = await axios.put(`${API_BASE_URL}/api/dependientes/${editingDependienteId}`, dataToSend);
                setMessage(`${isConyugeForm ? 'Cónyuge' : 'Dependiente'} actualizado con éxito.`);
            } else {
                response = await axios.post(`${API_BASE_URL}/api/${userId}/dependientes`, dataToSend);
                setMessage(`${isConyugeForm ? 'Cónyuge' : 'Dependiente'} añadido con éxito. ID: ${response.data.dependienteId}`);
            }

            if (!isConyugeForm) { // Solo para dependientes
                setNoDependientesDeclared(false);
            } else {
                setNoConyugeDeclared(false); // Si se añade/actualiza un cónyuge, ya no se ha declarado "no tiene"
            }

            if (onDependienteAdded) { // Este callback será onConyugeChanged o onDependienteAdded
                onDependienteAdded(editingDependienteId || response.data.dependienteId);
            }

            // For Cónyuge form, after successful add/update, the form should be ready to edit the existing one
            if (isConyugeForm) {
                setEditingDependienteId(editingDependienteId || response.data.dependienteId);
            } else {
                clearForm(); // For dependents, always clear to add another.
            }

        } catch (err) {
            console.error('Error al añadir/actualizar dependiente/cónyuge:', err.response ? err.response.data : err.message);
            setError(err.response ? err.response.data.message : '❌ Error al conectar con el servidor.');
        }
    };

    const editDependiente = (dependiente) => {
        setNoDependientesDeclared(false); // Solo aplica a dependientes
        setNoConyugeDeclared(false); // Si se va a editar, no se ha declarado "no tiene"
        const formattedDate = dependiente.fecha_nacimiento ?
            new Date(dependiente.fecha_nacimiento).toISOString().split('T')[0] : '';

        setFormData({
            ...dependiente,
            fecha_nacimiento: formattedDate,
            estado: undefined,
            condado: undefined,
            ciudad: undefined
        });

        setEditingDependienteId(dependiente.id);
        setAge(calculateAge(formattedDate));
        setMessage('');
        setError('');
    };

    const deleteDependiente = async (idToDelete) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar ${isConyugeForm ? 'al cónyuge' : 'este dependiente'}?`)) {
            try {
                await axios.delete(`${API_BASE_URL}/api/dependientes/${idToDelete}`);
                setMessage(`✅ ${isConyugeForm ? 'Cónyuge' : 'Dependiente'} eliminado con éxito.`);
                if (onDependienteAdded) {
                    onDependienteAdded(); // Refresh data in parent component
                }
                clearForm(); // Clear the form after deletion
                // If it was the cónyuge form and it's deleted, ensure the editingDependienteId is null
                if (isConyugeForm) {
                     setEditingDependienteId(null); // No spouse is being edited anymore
                     setNoConyugeDeclared(false); // Si se elimina, no se ha declarado "no tiene"
                }
            } catch (err) {
                console.error('Error al eliminar dependiente/cónyuge:', err);
                setError('❌ Error al eliminar dependiente/cónyuge.');
            }
        }
    };

    const clearForm = () => {
        setFormData({
            parentesco: isConyugeForm ? 'Cónyuge' : 'Hijo', // Mantener 'Cónyuge' si aplica
            solicita_cobertura: false, nombres: '', apellidos: '',
            sexo: '',
            fecha_nacimiento: '', social: '', estatus_migratorio: '',
            medicare_medicaid: false,
        });
        setEditingDependienteId(null);
        setAge(null);
        setMessage('');
        setError('');
        // Importante: no resetear noConyugeDeclared aquí. Solo se resetea si se empieza a llenar el form o se elimina.
    };

    // Función para manejar el botón "No tiene dependientes" (solo en DependienteForm)
    const handleNoDependientes = () => {
        setDependientesList([]);
        clearForm();
        setNoDependientesDeclared(true);
        setMessage('No se han añadido dependientes. Continuando al siguiente paso.');
        setError('');
        onContinueToIngresos(); // Avanzar al siguiente paso (Ingresos)
    };

    // Function to handle "No tiene Cónyuge" specifically for the spouse form
    const handleNoConyuge = () => {
        clearForm(); // Ensure the form is cleared
        setEditingDependienteId(null); // Ensure no spouse is considered "editing"
        setNoConyugeDeclared(true); // <--- Marcamos que se declaró "No tiene Cónyuge"
        setMessage('✅ No se ha añadido cónyuge.'); // Mensaje de confirmación
        setError('');
        // **CRUCIAL**: Notificar al componente padre que se ha elegido "no cónyuge" para que active el check.
        // También avanzamos al siguiente paso del acordeón.
        onContinueToIngresos(true); // <--- Pasar 'true' para indicar que no hay cónyuge.
    };


    // Renderizado condicional basado en `isConyugeForm`
    return (
        <div>
            <div className="form-title-status">
                <h3>{isConyugeForm ? 'Añadir/Editar Cónyuge' : 'Añadir/Editar Dependiente'}</h3>
                <FormStatusIndicator
                    totalFields={totalRequiredFields}
                    completedFields={completedRequiredFields}
                />
            </div>
            {message && <p className="form-messages success">{message}</p>}
            {error && <p className="form-messages error">{error}</p>}

            {/* Renderizado condicional del formulario del cónyuge */}
            {isConyugeForm ? (
                noConyugeDeclared ? (
                    <div className="checklist-confirmation" style={{ textAlign: 'center', padding: '20px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', border: '1px solid #c3e6cb', marginTop: '20px' }}>
                        <p style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                            ✅ Usted ha declarado que no tiene cónyuge.
                        </p>
                        {/* Estos botones son para cuando el usuario ya vio el mensaje y quiere continuar o cambiar de opinión */}
                        <button type="button" onClick={() => onContinueToIngresos(true)} style={{ backgroundColor: '#007bff', marginTop: '15px', padding: '10px 20px', fontSize: '1em', borderRadius: '5px' }}>
                            Continuar a Dependientes
                        </button>
                        <button type="button" onClick={() => setNoConyugeDeclared(false)} style={{ backgroundColor: '#6c757d', marginLeft: '10px', marginTop: '15px', padding: '10px 20px', fontSize: '1em', borderRadius: '5px' }}>
                            Volver y Añadir Cónyuge
                        </button>
                    </div>
                ) : (
                    // Si no se ha declarado "no cónyuge", muestra el formulario normal
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">

                            <div className="form-field">
                                <label>Parentesco:<span className="required-star">*</span></label>
                                <input type="text" value="Cónyuge" disabled className="read-only-input" />
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
                                    maxLength="9"
                                    pattern="\d{9}"
                                    title="El número social debe contener exactamente 9 dígitos."
                                    inputMode="numeric"
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

                            <div className="form-field">
                                <label className="toggle-switch-label">
                                    Medicare o Medicaid?:
                                    <input
                                        type="checkbox"
                                        name="medicare_medicaid"
                                        checked={formData.medicare_medicaid}
                                        onChange={handleChange}
                                        className="toggle-switch-input"
                                    />
                                    <span className="toggle-switch-slider"></span>
                                </label>
                            </div>

                        </div> {/* Cierre de form-grid */}

                        <button type="submit">
                            {editingDependienteId ? 'Actualizar Cónyuge' : 'Añadir Cónyuge'}
                        </button>
                        {editingDependienteId && ( // Only show "Clear Form" for cónyuge when editing
                            <button type="button" onClick={clearForm} style={{ backgroundColor: '#ffc107', marginLeft: '10px' }}>
                                Borrar Formulario
                            </button>
                        )}
                    </form>
                )
            ) : (
                // Lógica existente para el formulario de dependientes, oculta si se declaró no tener dependientes
                !(noDependientesDeclared) && (
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">

                            <div className="form-field">
                                <label>Parentesco:<span className="required-star">*</span></label>
                                <select name="parentesco" value={formData.parentesco} onChange={handleChange} required>
                                    <option value="">Selecciona</option>
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
                                    maxLength="9"
                                    pattern="\d{9}"
                                    title="El número social debe contener exactamente 9 dígitos."
                                    inputMode="numeric"
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

                            <div className="form-field">
                                <label className="toggle-switch-label">
                                    Medicare o Medicaid?:
                                    <input
                                        type="checkbox"
                                        name="medicare_medicaid"
                                        checked={formData.medicare_medicaid}
                                        onChange={handleChange}
                                        className="toggle-switch-input"
                                    />
                                    <span className="toggle-switch-slider"></span>
                                </label>
                            </div>

                        </div> {/* Cierre de form-grid */}

                        <button type="submit">
                            {editingDependienteId ? 'Actualizar Dependiente' : 'Añadir Dependiente'}
                        </button>
                        {editingDependienteId && ( // Only show "Add New Dependiente" for dependents when editing
                            <button type="button" onClick={clearForm} style={{ backgroundColor: '#ffc107', marginLeft: '10px' }}>
                                Añadir Nuevo Dependiente
                            </button>
                        )}
                    </form>
                )
            )}

            {/* Sección para mostrar cónyuge/dependientes o el botón "No tiene..." */}
            <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                {isConyugeForm ? ( // Si es el formulario de Cónyuge
                    editingDependienteId ? ( // Si ya hay un cónyuge cargado (means initialData was present or one was just added/edited)
                        // Este bloque se muestra si hay un cónyuge existente y estamos en el modo de edición/visualización.
                        // Ya se ha llenado el formulario o se ha cargado.
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 15px', marginBottom: '8px', backgroundColor: '#f8f9fa',
                            borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                            <span>
                                {formData.nombres} {formData.apellidos} (Cónyuge) - Edad: {age}
                            </span>
                            <div>
                                <button type="button" onClick={() => editDependiente(formData)}
                                    style={{ backgroundColor: '#17a2b8', padding: '8px 12px', fontSize: '0.9em' }}>
                                    Editar
                                </button>
                                <button type="button" onClick={() => deleteDependiente(editingDependienteId)}
                                    style={{ backgroundColor: '#dc3545', padding: '8px 12px', fontSize: '0.9em', marginLeft: '8px' }}>
                                    Eliminar
                                </button>
                                <button type="button" onClick={() => onContinueToIngresos(false)} style={{ backgroundColor: '#007bff', marginLeft: '10px', padding: '8px 12px', fontSize: '0.9em' }}>
                                    Continuar a Dependientes
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Si no hay cónyuge cargado/editándose Y NO se ha declarado "no cónyuge",
                        // muestra el botón para declarar que no tiene o el mensaje si ya se declaró.
                        !noConyugeDeclared && ( // Solo muestra este bloque si NO se ha declarado "no cónyuge"
                            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
                                <p>No hay cónyuge registrado. Añada uno arriba o avance si no aplica.</p>
                                <button type="button" onClick={handleNoConyuge} style={{ backgroundColor: '#28a745', marginTop: '10px' }}>
                                    No tiene Cónyuge (y avanzar)
                                </button>
                            </div>
                        )
                    )
                ) : ( // Si es el formulario de Dependientes
                    dependientesList.length > 0 ? (
                        <>
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
                            <button type="button" onClick={onContinueToIngresos} style={{ backgroundColor: '#007bff', marginTop: '10px' }}>
                                Continuar a Ingresos
                            </button>
                            <button type="button" onClick={handleNoDependientes} style={{ backgroundColor: '#6c757d', marginLeft: '10px', marginTop: '10px' }}>
                                No tiene dependientes (y avanzar)
                            </button>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
                            <p>{noDependientesDeclared ? "No se han añadido dependientes. Haga clic en 'Continuar a Ingresos' si ya está listo." : "No hay dependientes registrados."}</p>
                            {!noDependientesDeclared && (
                                <button type="button" onClick={handleNoDependientes} style={{ backgroundColor: '#28a745', marginTop: '10px' }}>
                                    No tiene dependientes (y avanzar)
                                </button>
                            )}
                            {noDependientesDeclared && (
                                <button type="button" onClick={onContinueToIngresos} style={{ backgroundColor: '#007bff', marginTop: '10px' }}>
                                    Continuar a Ingresos
                                </button>
                            )}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

export default DependienteForm;