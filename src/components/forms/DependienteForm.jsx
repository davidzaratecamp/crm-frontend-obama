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

    // --- Lógica de precarga de datos y estado `noDependientesDeclared` ---
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
            let completed = countCompletedFields();
            setCompletedRequiredFields(completed);
            setTotalRequiredFields(totalRequiredFieldsBase);
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
    }, [formData, noDependientesDeclared, dependientesList, isConyugeForm]);


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
        // Si el usuario empieza a añadir un dependiente/cónyuge, deseleccionar "No tiene dependientes"
        if (!isConyugeForm && noDependientesDeclared) { // Solo aplica a dependientes
            setNoDependientesDeclared(false);
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
            }

            if (onDependienteAdded) { // Este callback será onConyugeChanged o onDependienteAdded
                onDependienteAdded(editingDependienteId || response.data.dependienteId);
            }

            // For Cónyuge form, after successful add/update, the form should be ready to edit the existing one
            // or we might immediately transition if the user is done with this step.
            if (isConyugeForm) {
                // If it was an add, now it's editing the newly added one.
                setEditingDependienteId(editingDependienteId || response.data.dependienteId);
                // Optionally, clear form for a new entry if we allowed multiple, but for spouse we don't.
                // Instead, the form will display the just-saved spouse's data.
            } else {
                clearForm(); // For dependents, always clear to add another.
            }

            // If it's the spouse form and an action (add/update) was successful,
            // we might want to advance to the next step (Dependientes).
            // This assumes the user adds/edits the spouse and then moves on.
            if (isConyugeForm) {
                onContinueToIngresos(); // Advances to Dependientes (next logical step)
            }


        } catch (err) {
            console.error('Error al añadir/actualizar dependiente/cónyuge:', err.response ? err.response.data : err.message);
            setError(err.response ? err.response.data.message : '❌ Error al conectar con el servidor.');
        }
    };

    const editDependiente = (dependiente) => {
        setNoDependientesDeclared(false); // Solo aplica a dependientes
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
                // and the form reflects an empty state, ready for a new spouse or to indicate none.
                if (isConyugeForm) {
                     setEditingDependienteId(null); // No spouse is being edited anymore
                     // No need to call onContinueToIngresos immediately; the form itself will show "No spouse" state.
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
        setMessage('No se ha añadido cónyuge. Continuando al siguiente paso.');
        setError('');
        onContinueToIngresos(); // Advance to Dependientes
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

            {/* Si es formulario de dependientes y se declaró que no tiene, no mostrar el formulario */}
            {!(isConyugeForm ? false : noDependientesDeclared) && (
                // For the Cónyuge form, only show the form if we're adding or editing.
                // If a spouse exists and we're not explicitly editing, we might hide the form
                // or ensure it's pre-filled with the existing spouse's data.
                // The current `editingDependienteId` check covers this well.
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">

                        <div className="form-field">
                            <label>Parentesco:<span className="required-star">*</span></label>
                            {isConyugeForm ? (
                                <input type="text" value="Cónyuge" disabled className="read-only-input" />
                            ) : (
                                <select name="parentesco" value={formData.parentesco} onChange={handleChange} required>
                                    <option value="">Selecciona</option>
                                    {/* <option value="Cónyuge">Cónyuge</option> YA NO AQUÍ */}
                                    <option value="Hijo">Hijo</option>
                                    <option value="Hijastro">Hijastro</option>
                                    <option value="Padre">Padre</option>
                                    <option value="Madre">Madre</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            )}
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
                        {editingDependienteId ?
                            `Actualizar ${isConyugeForm ? 'Cónyuge' : 'Dependiente'}` :
                            `Añadir ${isConyugeForm ? 'Cónyuge' : 'Dependiente'}`
                        }
                    </button>
                    {isConyugeForm && editingDependienteId && ( // Only show "Clear Form" for cónyuge when editing
                        <button type="button" onClick={clearForm} style={{ backgroundColor: '#ffc107', marginLeft: '10px' }}>
                            Borrar Formulario
                        </button>
                    )}
                    {!isConyugeForm && editingDependienteId && ( // Only show "Add New Dependiente" for dependents when editing
                        <button type="button" onClick={clearForm} style={{ backgroundColor: '#ffc107', marginLeft: '10px' }}>
                            Añadir Nuevo Dependiente
                        </button>
                    )}
                </form>
            )}

            {/* Sección para mostrar cónyuge/dependientes o el botón "No tiene..." */}
            <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                {isConyugeForm ? ( // Si es el formulario de Cónyuge
                    editingDependienteId ? ( // Si ya hay un cónyuge cargado (means initialData was present or one was just added/edited)
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
                                <button type="button" onClick={onContinueToIngresos} style={{ backgroundColor: '#007bff', marginLeft: '10px', padding: '8px 12px', fontSize: '0.9em' }}>
                                    Continuar a Dependientes
                                </button>
                            </div>
                        </div>
                    ) : ( // No cónyuge is currently loaded/being edited
                        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#e9ecef', borderRadius: '8px' }}>
                            <p>No hay cónyuge registrado. Añada uno arriba o avance si no aplica.</p>
                            <button type="button" onClick={handleNoConyuge} style={{ backgroundColor: '#28a745', marginTop: '10px' }}>
                                No tiene Cónyuge (y avanzar)
                            </button>
                        </div>
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
                            {/* The "No tiene dependientes" button should be available even if there are dependents
                                if the user wants to explicitly state they only want to list the primary applicant.
                                However, its primary use case is when no dependents have been added yet.
                            */}
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