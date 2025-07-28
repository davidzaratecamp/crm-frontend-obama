import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import FormStatusIndicator from '../statusIndicators/FormStatusIndicator';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const formatCurrency = (value) => {
    if (value === '' || value === null || typeof value === 'undefined' || isNaN(value)) {
        return '';
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

function IngresoForm({ userId, onIngresosCompleted, initialData, onIngresosUpdated }) {
    const [ingresosUsuario, setIngresosUsuario] = useState({
        tipo_declaracion: 'W2',
        ingresos_semanales: '',
        ingresos_anuales: ''
    });
    const [dependientes, setDependientes] = useState([]);
    const [ingresosDependientes, setIngresosDependientes] = useState({});
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [totalIngresosAnuales, setTotalIngresosAnuales] = useState(0);
    const [loading, setLoading] = useState(true);

    const [completedRequiredFields, setCompletedRequiredFields] = useState(0);
    const [totalRequiredFields, setTotalRequiredFields] = useState(1);

    const calculateAnnualIncome = useCallback((weeklyIncome) => {
        const weekly = parseFloat(weeklyIncome);
        return isNaN(weekly) ? '' : (weekly * 52).toFixed(2);
    }, []);

    // ** Lógica MODIFICADA para cargar ingresos **
    const fetchDependientesAndTheirIngresos = useCallback(async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        try {
            // 1. Cargar dependientes del usuario principal
            const dependientesRes = await axios.get(`${API_BASE_URL}/api/${userId}/dependientes`);
            const loadedDependientes = dependientesRes.data;
            setDependientes(loadedDependientes);

            // 2. Cargar el ingreso del usuario principal
            const userIngresosRes = await axios.get(`${API_BASE_URL}/api/ingresos/Usuario/${userId}`);
            // La API de getIngresosByEntidad devuelve un array, tomamos el primer elemento si existe
            const existingUserIngreso = userIngresosRes.data[0];

            console.log("Existing User Ingreso fetched:", existingUserIngreso); // DEBUG

            if (existingUserIngreso) {
                setIngresosUsuario({
                    tipo_declaracion: String(existingUserIngreso.tipo_declaracion) || 'W2',
                    ingresos_semanales: existingUserIngreso.ingresos_semanales ?? '',
                    ingresos_anuales: existingUserIngreso.ingresos_anuales ?? ''
                });
            } else {
                setIngresosUsuario({ tipo_declaracion: 'W2', ingresos_semanales: '', ingresos_anuales: '' });
            }

            // 3. Cargar ingresos para cada dependiente
            const initialIngresosDep = {};
            const fetchDependentIngresosPromises = loadedDependientes.map(async (dep) => {
                try {
                    const depIngresosRes = await axios.get(`${API_BASE_URL}/api/ingresos/Dependiente/${dep.id}`);
                    const existingDepIngreso = depIngresosRes.data[0]; // Tomar el primer elemento

                    console.log(`For Dependent ${dep.nombres} (ID: ${dep.id}), fetched Ingreso:`, existingDepIngreso); // DEBUG

                    initialIngresosDep[dep.id] = {
                        hasIngresos: !!existingDepIngreso,
                        tipo_declaracion: existingDepIngreso?.tipo_declaracion ? String(existingDepIngreso.tipo_declaracion) : 'W2',
                        ingresos_semanales: existingDepIngreso?.ingresos_semanales ?? '',
                        ingresos_anuales: existingDepIngreso?.ingresos_anuales ?? ''
                    };
                } catch (depErr) {
                    console.warn(`No se encontraron ingresos para el dependiente ID ${dep.id} o error al cargar:`, depErr.message);
                    initialIngresosDep[dep.id] = { // Inicializar con valores por defecto si hay error o no existe
                        hasIngresos: false,
                        tipo_declaracion: 'W2',
                        ingresos_semanales: '',
                        ingresos_anuales: ''
                    };
                }
            });

            await Promise.all(fetchDependentIngresosPromises);
            setIngresosDependientes(initialIngresosDep);

        } catch (err) {
            console.error('Error al cargar dependientes o ingresos existentes:', err);
            setError('Error al cargar dependientes o sus ingresos.');
            // Asegúrate de que los estados se reseteen correctamente en caso de error
            setDependientes([]);
            setIngresosUsuario({ tipo_declaracion: 'W2', ingresos_semanales: '', ingresos_anuales: '' });
            setIngresosDependientes({});
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchDependientesAndTheirIngresos();
    }, [fetchDependientesAndTheirIngresos]);


    useEffect(() => {
        let sum = 0;

        const userAnnual = parseFloat(ingresosUsuario.ingresos_anuales);
        if (!isNaN(userAnnual) && userAnnual > 0) {
            sum += userAnnual;
        }

        for (const depId in ingresosDependientes) {
            const depIngreso = ingresosDependientes[depId];
            if (depIngreso.hasIngresos) { // Sumar solo si el dependiente tiene ingresos marcados
                const depAnnual = parseFloat(depIngreso.ingresos_anuales);
                if (!isNaN(depAnnual) && depAnnual > 0) {
                    sum += depAnnual;
                }
            }
        }
        setTotalIngresosAnuales(sum);
    }, [ingresosUsuario, ingresosDependientes]);


    // --- Lógica para el FormStatusIndicator (SOLO PARA EL INDICADOR VISUAL) ---
    useEffect(() => {
        let completed = 0;
        let total = 0;

        // **Usuario Principal**
        total += 1;
        if (ingresosUsuario.ingresos_semanales !== '' && parseFloat(ingresosUsuario.ingresos_semanales) >= 0) {
            completed++;
            if (parseFloat(ingresosUsuario.ingresos_semanales) > 0) {
                total += 1;
                if (ingresosUsuario.tipo_declaracion !== '') {
                    completed++;
                }
            }
        } else if (ingresosUsuario.ingresos_semanales === '') {
            completed++;
        }

        // **Dependientes**
        dependientes.forEach(dep => {
            const depIngreso = ingresosDependientes[dep.id];
            total += 1; // El checkbox 'hasIngresos' es siempre un campo para cada dependiente

            if (depIngreso?.hasIngresos) {
                completed++;
                total += 1;
                if (depIngreso.tipo_declaracion !== '') {
                    completed++;
                }
                total += 1;
                if (depIngreso.ingresos_semanales !== '' && !isNaN(parseFloat(depIngreso.ingresos_semanales)) && parseFloat(depIngreso.ingresos_semanales) >= 0) {
                    completed++;
                }
            } else {
                completed++;
            }
        });

        setCompletedRequiredFields(completed);
        setTotalRequiredFields(total > 0 ? total : 1);
    }, [ingresosUsuario, ingresosDependientes, dependientes]);


    const handleUsuarioIngresosChange = (e) => {
        const { name, value } = e.target;

        if (name === 'tipo_declaracion') {
            setIngresosUsuario(prev => ({
                ...prev,
                [name]: value
            }));
        } else { // ingresos_semanales
            const newWeekly = value === '' ? '' : parseFloat(value);
            const newAnnual = calculateAnnualIncome(newWeekly);

            setIngresosUsuario(prev => ({
                ...prev,
                ingresos_semanales: newWeekly,
                ingresos_anuales: newAnnual
            }));
        }
    };

    const handleDependienteIngresosChange = (dependienteId, e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'hasIngresos') {
            setIngresosDependientes(prev => ({
                ...prev,
                [dependienteId]: {
                    ...prev[dependienteId],
                    hasIngresos: checked,
                    // Si se desmarca, resetear ingresos y tipo de declaración
                    // Si se marca, mantener los valores previos si existen o valores por defecto
                    ...(checked ?
                        {
                            tipo_declaracion: prev[dependienteId]?.tipo_declaracion || 'W2',
                            ingresos_semanales: prev[dependienteId]?.ingresos_semanales ?? '',
                            ingresos_anuales: prev[dependienteId]?.ingresos_anuales ?? ''
                        } :
                        {
                            tipo_declaracion: 'W2',
                            ingresos_semanales: '',
                            ingresos_anuales: ''
                        }
                    )
                }
            }));
        } else if (name === 'tipo_declaracion') {
            setIngresosDependientes(prev => ({
                ...prev,
                [dependienteId]: {
                    ...prev[dependienteId],
                    [name]: value
                }
            }));
        } else { // ingresos_semanales
            const newWeekly = value === '' ? '' : parseFloat(value);
            const newAnnual = calculateAnnualIncome(newWeekly);
            setIngresosDependientes(prev => ({
                ...prev,
                [dependienteId]: {
                    ...prev[dependienteId],
                    ingresos_semanales: newWeekly,
                    ingresos_anuales: newAnnual
                }
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        const allIngresosToSubmit = [];
        const ingresosUsuarioVal = parseFloat(ingresosUsuario.ingresos_semanales);

        // VALIDACIÓN Y DATOS DEL USUARIO PRINCIPAL
        // Solo añadir el ingreso del usuario si hay un valor (incluso 0) o si no se ha borrado el campo.
        if (ingresosUsuario.ingresos_semanales !== '' && !isNaN(ingresosUsuarioVal)) {
            if (ingresosUsuarioVal < 0) {
                setError('Los ingresos semanales del solicitante principal no pueden ser negativos.');
                return;
            }
            if (!['W2', '1099'].includes(ingresosUsuario.tipo_declaracion)) {
                setError(`El tipo de declaración para el solicitante principal no es válido.`);
                return;
            }
            // Incluir el registro si es 0 o positivo.
            allIngresosToSubmit.push({
                tipo_entidad: 'Usuario',
                entidad_id: userId,
                tipo_declaracion: ingresosUsuario.tipo_declaracion,
                ingresos_semanales: ingresosUsuarioVal,
                ingresos_anuales: parseFloat(ingresosUsuario.ingresos_anuales)
            });
        } else if (ingresosUsuario.ingresos_semanales !== '') {
            // Esto captura si el usuario escribió algo que no es un número.
            setError('Ingresos semanales del solicitante principal no válidos.');
            return;
        }


        // VALIDACIÓN Y DATOS DE LOS DEPENDIENTES
        for (const dep of dependientes) {
            const depIngresos = ingresosDependientes[dep.id];

            if (depIngresos?.hasIngresos) { // Solo si el checkbox está marcado
                const depIngresosVal = parseFloat(depIngresos.ingresos_semanales);

                if (depIngresos.ingresos_semanales === '' || isNaN(depIngresosVal)) {
                    setError(`Los ingresos semanales de ${dep.nombres} no pueden estar vacíos si se indica que tiene ingresos.`);
                    return;
                }
                if (depIngresosVal < 0) {
                    setError(`Los ingresos semanales de ${dep.nombres} no pueden ser negativos.`);
                    return;
                }

                if (!['W2', '1099'].includes(depIngresos.tipo_declaracion)) {
                    setError(`El tipo de declaración para ${dep.nombres} no es válido.`);
                    return;
                }
                
                // Incluir el registro si es 0 o positivo.
                allIngresosToSubmit.push({
                    tipo_entidad: 'Dependiente',
                    entidad_id: dep.id,
                    tipo_declaracion: depIngresos.tipo_declaracion,
                    ingresos_semanales: depIngresosVal,
                    ingresos_anuales: parseFloat(depIngresos.ingresos_anuales)
                });
            }
        }

        try {
            // Obtenemos los ingresos existentes de forma individual para sincronizar
            const existingUserIngresoRes = await axios.get(`${API_BASE_URL}/api/ingresos/Usuario/${userId}`);
            const existingUserIngreso = existingUserIngresoRes.data[0];

            const existingDepIngresosPromises = dependientes.map(async (dep) => {
                try {
                    const res = await axios.get(`${API_BASE_URL}/api/ingresos/Dependiente/${dep.id}`);
                    return res.data[0];
                } catch (error) {
                    return null; // Si no hay ingresos, devolver null
                }
            });
            const existingDependentsIngresos = (await Promise.all(existingDepIngresosPromises)).filter(Boolean); // Filtrar nulos

            const existingIngresos = [];
            if (existingUserIngreso) existingIngresos.push(existingUserIngreso);
            existingIngresos.push(...existingDependentsIngresos);

            // Eliminar ingresos que ya no existen en el formulario
            const deletions = existingIngresos.map(async (existingIng) => {
                const foundInSubmit = allIngresosToSubmit.some(
                    subIng => String(subIng.tipo_entidad) === String(existingIng.tipo_entidad) && String(subIng.entidad_id) === String(existingIng.entidad_id)
                );
                if (!foundInSubmit) {
                    await axios.delete(`${API_BASE_URL}/api/ingresos/${existingIng.id}`);
                }
            });
            await Promise.all(deletions);

            // Crear o actualizar ingresos
            const upserts = allIngresosToSubmit.map(async (ingreso) => {
                const existingEntry = existingIngresos.find(
                    ex => String(ex.tipo_entidad) === String(ingreso.tipo_entidad) && String(ex.entidad_id) === String(ingreso.entidad_id)
                );

                if (existingEntry) {
                    await axios.put(`${API_BASE_URL}/api/ingresos/${existingEntry.id}`, ingreso);
                } else {
                    await axios.post(`${API_BASE_URL}/api/ingresos`, ingreso);
                }
            });
            await Promise.all(upserts);

            setMessage('✅ Ingresos registrados/actualizados con éxito.');

            // Llama al callback para notificar al componente padre
            if (onIngresosUpdated) {
                onIngresosUpdated();
            } else if (onIngresosCompleted) {
                onIngresosCompleted();
            }

        } catch (err) {
            console.error('Error al registrar/actualizar ingresos:', err.response ? err.response.data : err.message);
            setError(err.response ? err.response.data.message : '❌ Error al conectar con el servidor.');
        }
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '20px' }}>Cargando datos de ingresos...</div>;
    }

    return (
        <div className="ingreso-form-container">
            <div className="form-title-status">
                <h3>Ingresos</h3>
                <FormStatusIndicator
                    totalFields={totalRequiredFields}
                    completedFields={completedRequiredFields}
                />
            </div>
            {message && <p className="form-messages success">{message}</p>}
            {error && <p className="form-messages error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="form-section">
                    <h4>Ingresos del Solicitante Principal</h4>
                    <div className="form-field">
                        <label>
                            Tipo de Declaración:
                            <select name="tipo_declaracion" value={ingresosUsuario.tipo_declaracion} onChange={handleUsuarioIngresosChange}>
                                <option value="W2">W2</option>
                                <option value="1099">1099</option>
                            </select>
                        </label>
                    </div>
                    <div className="form-field">
                        <label>
                            Ingresos Semanales ($):
                            <input
                                type="number"
                                name="ingresos_semanales"
                                value={ingresosUsuario.ingresos_semanales}
                                onChange={handleUsuarioIngresosChange}
                                min="0"
                                placeholder="Ej: 500.00"
                            />
                        </label>
                    </div>
                    <div className="form-field">
                        <label>
                            Ingresos Semanales (Formato):
                            <input
                                type="text"
                                value={formatCurrency(ingresosUsuario.ingresos_semanales)}
                                readOnly
                                disabled
                                className="read-only-input"
                            />
                        </label>
                    </div>
                    <div className="form-field">
                        <label>
                            Ingresos Anuales ($):
                            <input
                                type="text"
                                value={formatCurrency(ingresosUsuario.ingresos_anuales)}
                                readOnly
                                disabled
                                className="read-only-input"
                            />
                        </label>
                    </div>
                </div>

                {dependientes.length > 0 && (
                    <div className="form-section">
                        <h4>Ingresos de Dependientes</h4>
                        {dependientes.map(dep => (
                            <div key={dep.id} className="dependiente-ingreso-item">
                                <h5>{dep.nombres} {dep.apellidos}</h5>
                                <div className="form-field">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="hasIngresos"
                                            checked={ingresosDependientes[dep.id]?.hasIngresos || false}
                                            onChange={(e) => handleDependienteIngresosChange(dep.id, e)}
                                        />
                                        Este dependiente tiene ingresos
                                    </label>
                                </div>
                                {(ingresosDependientes[dep.id]?.hasIngresos) && (
                                    <>
                                        <div className="form-field">
                                            <label>
                                                Tipo de Declaración:
                                                <select
                                                    name="tipo_declaracion"
                                                    value={ingresosDependientes[dep.id]?.tipo_declaracion || 'W2'}
                                                    onChange={(e) => handleDependienteIngresosChange(dep.id, e)}
                                                >
                                                    <option value="W2">W2</option>
                                                    <option value="1099">1099</option>
                                                </select>
                                            </label>
                                        </div>
                                        <div className="form-field">
                                            <label>
                                                Ingresos Semanales ($):
                                                <input
                                                    type="number"
                                                    name="ingresos_semanales"
                                                    value={ingresosDependientes[dep.id]?.ingresos_semanales}
                                                    onChange={(e) => handleDependienteIngresosChange(dep.id, e)}
                                                    min="0"
                                                    placeholder="Ej: 300.00"
                                                />
                                            </label>
                                        </div>
                                        <div className="form-field">
                                            <label>
                                                Ingresos Semanales (Formato):
                                                <input
                                                    type="text"
                                                    value={formatCurrency(ingresosDependientes[dep.id]?.ingresos_semanales)}
                                                    readOnly
                                                    disabled
                                                    className="read-only-input"
                                                />
                                            </label>
                                        </div>
                                        <div className="form-field">
                                            <label>
                                                Ingresos Anuales ($):
                                                <input
                                                    type="text"
                                                    value={formatCurrency(ingresosDependientes[dep.id]?.ingresos_anuales)}
                                                    readOnly
                                                    disabled
                                                    className="read-only-input"
                                                />
                                            </label>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <div className="form-section total-ingresos-section" style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '15px' }}>
                    <h4>Suma Total de Ingresos Anuales del Grupo Familiar:</h4>
                    <div className="form-field total-ingresos-display">
                        <label>
                            Total Anual Estimado:
                            <input
                                type="text"
                                value={formatCurrency(totalIngresosAnuales)}
                                readOnly
                                disabled
                                className="read-only-input total-ingresos-value"
                                style={{ fontWeight: 'bold', fontSize: '1.2em', color: '#28a745' }}
                            />
                        </label>
                    </div>
                </div>

                <button type="submit">Guardar Ingresos</button>
            </form>
        </div>
    );
}

export default IngresoForm;