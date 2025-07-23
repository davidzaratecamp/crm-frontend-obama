// frontend/src/components/forms/IngresoForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// Helper function to format currency
const formatCurrency = (value) => {
    if (value === '' || isNaN(value)) {
        return '';
    }
    // Convert to number, then to locale string for thousands separator
    // Adjust 'en-US' and 'USD' based on your desired locale and currency
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

// Helper function to parse formatted currency back to a number
// This is useful if you want to allow users to paste formatted numbers
const parseCurrency = (formattedValue) => {
    // Remove all non-numeric characters except the decimal point
    const cleanedValue = formattedValue.replace(/[^0-9.]/g, '');
    return parseFloat(cleanedValue);
};


function IngresoForm({ userId, onIngresosCompleted, initialData, onIngresosUpdated }) {
    const [ingresosUsuario, setIngresosUsuario] = useState({
        tipo_declaracion: 'W2', // Default to string 'W2'
        ingresos_semanales: '',
        ingresos_anuales: ''
    });
    const [dependientes, setDependientes] = useState([]);
    const [ingresosDependientes, setIngresosDependientes] = useState({});
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [totalIngresosAnuales, setTotalIngresosAnuales] = useState(0); // NUEVO ESTADO PARA LA SUMA TOTAL

    // Función para calcular ingresos anuales
    const calculateAnnualIncome = (weeklyIncome) => {
        const weekly = parseFloat(weeklyIncome);
        return isNaN(weekly) ? '' : (weekly * 52).toFixed(2);
    };

    // --- Efecto para precargar datos y dependientes ---
    useEffect(() => {
        const fetchDependientesAndTheirIngresos = async () => {
            if (userId) {
                try {
                    // Cargar dependientes
                    const dependientesRes = await axios.get(`${API_BASE_URL}/api/${userId}/dependientes`);
                    setDependientes(dependientesRes.data);

                    // Cargar ingresos existentes para el usuario principal y sus dependientes
                    const ingresosRes = await axios.get(`${API_BASE_URL}/api/ingresos/Usuario/${userId}`);
                    const allExistingIngresos = ingresosRes.data;

                    // Precargar los ingresos del usuario principal si existen
                    const existingUserIngreso = allExistingIngresos.find(
                        ing => ing.tipo_entidad === 'Usuario' && ing.entidad_id === userId
                    );
                    if (existingUserIngreso) {
                        setIngresosUsuario({
                            tipo_declaracion: String(existingUserIngreso.tipo_declaracion) || 'W2',
                            ingresos_semanales: existingUserIngreso.ingresos_semanales || '',
                            ingresos_anuales: existingUserIngreso.ingresos_anuales || ''
                        });
                    } else {
                        setIngresosUsuario({ tipo_declaracion: 'W2', ingresos_semanales: '', ingresos_anuales: '' });
                    }

                    // Inicializar estado de ingresos para cada dependiente
                    const initialIngresosDep = {};
                    dependientesRes.data.forEach(dep => {
                        const existingDepIngreso = allExistingIngresos.find(
                            ing => ing.tipo_entidad === 'Dependiente' && ing.entidad_id === dep.id
                        );
                        initialIngresosDep[dep.id] = {
                            hasIngresos: !!existingDepIngreso,
                            tipo_declaracion: existingDepIngreso?.tipo_declaracion ? String(existingDepIngreso.tipo_declaracion) : 'W2',
                            ingresos_semanales: existingDepIngreso?.ingresos_semanales || '',
                            ingresos_anuales: existingDepIngreso?.ingresos_anuales || ''
                        };
                    });
                    setIngresosDependientes(initialIngresosDep);

                } catch (err) {
                    console.error('Error al cargar dependientes o ingresos existentes:', err);
                    setError('Error al cargar dependientes o sus ingresos.');
                }
            }
        };
        fetchDependientesAndTheirIngresos();
    }, [userId]);

    // --- NUEVO EFECTO: Calcular la suma total de ingresos anuales ---
    useEffect(() => {
        let sum = 0;

        // Sumar ingresos del usuario principal
        const userAnnual = parseFloat(ingresosUsuario.ingresos_anuales);
        if (!isNaN(userAnnual) && userAnnual > 0) {
            sum += userAnnual;
        }

        // Sumar ingresos de los dependientes
        for (const depId in ingresosDependientes) {
            const depIngreso = ingresosDependientes[depId];
            if (depIngreso.hasIngresos) {
                const depAnnual = parseFloat(depIngreso.ingresos_anuales);
                if (!isNaN(depAnnual) && depAnnual > 0) {
                    sum += depAnnual;
                }
            }
        }
        setTotalIngresosAnuales(sum);
    }, [ingresosUsuario, ingresosDependientes]); // Depende de los cambios en los ingresos de usuario y dependientes


    const handleUsuarioIngresosChange = (e) => {
        const { name, value } = e.target;

        if (name === 'tipo_declaracion') {
            setIngresosUsuario(prev => ({
                ...prev,
                [name]: value
            }));
        } else {
            const newWeekly = value === '' ? '' : parseFloat(value);
            const newAnnual = calculateAnnualIncome(newWeekly);

            setIngresosUsuario(prev => ({
                ...prev,
                [name]: newWeekly,
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
                    ...(checked ? { tipo_declaracion: prev[dependienteId]?.tipo_declaracion || 'W2' } : { tipo_declaracion: 'W2', ingresos_semanales: '', ingresos_anuales: '' })
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
        } else {
            const newWeekly = value === '' ? '' : parseFloat(value);
            const newAnnual = calculateAnnualIncome(newWeekly);
            setIngresosDependientes(prev => ({
                ...prev,
                [dependienteId]: {
                    ...prev[dependienteId],
                    [name]: newWeekly,
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
        if (ingresosUsuario.ingresos_semanales !== '' && !isNaN(ingresosUsuarioVal)) {
            if (ingresosUsuarioVal < 0) {
                setError('Los ingresos semanales del solicitante principal no pueden ser negativos.');
                return;
            }
            if (!['W2', '1099'].includes(ingresosUsuario.tipo_declaracion)) {
                setError(`El tipo de declaración para el solicitante principal no es válido.`);
                return;
            }
            if (ingresosUsuarioVal > 0) {
                allIngresosToSubmit.push({
                    tipo_entidad: 'Usuario',
                    entidad_id: userId,
                    tipo_declaracion: ingresosUsuario.tipo_declaracion,
                    ingresos_semanales: ingresosUsuarioVal,
                    ingresos_anuales: parseFloat(ingresosUsuario.ingresos_anuales)
                });
            }
        }

        // VALIDACIÓN Y DATOS DE LOS DEPENDIENTES
        for (const dep of dependientes) {
            const depIngresos = ingresosDependientes[dep.id];

            if (depIngresos?.hasIngresos) {
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
                    setError(`El tipo de declaración para ${dep.nombres} no es válido. Valor actual: '${depIngresos.tipo_declaracion}'`);
                    return;
                }

                if (depIngresosVal > 0) {
                    allIngresosToSubmit.push({
                        tipo_entidad: 'Dependiente',
                        entidad_id: dep.id,
                        tipo_declaracion: depIngresos.tipo_declaracion,
                        ingresos_semanales: depIngresosVal,
                        ingresos_anuales: parseFloat(depIngresos.ingresos_anuales)
                    });
                }
            }
        }

        try {
            const currentIngresosRes = await axios.get(`${API_BASE_URL}/api/ingresos/Usuario/${userId}`);
            const existingIngresos = currentIngresosRes.data;

            for (const existingIng of existingIngresos) {
                const foundInSubmit = allIngresosToSubmit.some(
                    subIng => subIng.tipo_entidad === existingIng.tipo_entidad && subIng.entidad_id === existingIng.entidad_id
                );
                if (!foundInSubmit) {
                    await axios.delete(`${API_BASE_URL}/api/ingresos/${existingIng.id}`);
                }
            }

            for (const ingreso of allIngresosToSubmit) {
                const existingEntry = existingIngresos.find(
                    ex => ex.tipo_entidad === ingreso.tipo_entidad && ex.entidad_id === ingreso.entidad_id
                );

                if (existingEntry) {
                    await axios.put(`${API_BASE_URL}/api/ingresos/${existingEntry.id}`, ingreso);
                } else {
                    await axios.post(`${API_BASE_URL}/api/ingresos`, ingreso); 
                }
            }

            setMessage('✅ Ingresos registrados/actualizados con éxito.');
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

    return (
        <div className="ingreso-form-container">
            <h3>Ingresos</h3>
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
                                name="ingresos_anuales"
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
                                                    value={ingresosDependientes[dep.id]?.ingresos_semanales || ''}
                                                    onChange={(e) => handleDependienteIngresosChange(dep.id, e)}
                                                    min="0"
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
                
                {/* NUEVA SECCIÓN: SUMA TOTAL DE INGRESOS */}
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