// frontend/src/components/forms/PlanSaludForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

function PlanSaludForm({ userId, onPlanSaludCompleted, onPlanSaludUpdated }) {
    const [formData, setFormData] = useState({
        aseguradora: '',
        nombre_plan: '',
        tipo_plan: '',
        deducible: '', // Stored as raw number (or empty string)
        gasto_max_bolsillo: '', // Stored as raw number (or empty string)
        valor_prima: '' // Stored as raw number (or empty string)
    });

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [editingField, setEditingField] = useState(null);

    // Formatter for displaying numbers with thousands separators and two decimal places (using comma for decimals)
    const numberFormatter = new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const aseguradorasOptions = [
        "Aetna", "Ambetter", "Anthem", "Bluecross", "Cigna", "Molina",
        "Oscar", "United", "Wellpoint", "Horizon", "Kaiser"
    ];

    // ✅ Opciones actualizadas para Tipo de Plan
    const tipoPlanOptions = [
        "Bronce HMO", "Bronce PPO", "Bronce EPO",
        "Plata HMO", "Plata PPO", "Plata EPO",
        "Oro HMO", "Oro PPO", "Oro EPO",
        "Platino HMO", "Platino PPO", "Platino EPO" // Añadí PPO y EPO para Platino para completar
    ];

    // Required fields for validation
    const requiredFields = [
        'aseguradora', 'nombre_plan', 'tipo_plan', 'valor_prima'
    ];

    // --- Effect to preload data for editing ---
    useEffect(() => {
        const fetchPlanSalud = async () => {
            if (userId) {
                try {
                    const res = await axios.get(`${API_BASE_URL}/api/planes_salud/usuario/${userId}`);
                    if (res.data.length > 0) {
                        const planData = res.data[0];
                        setFormData({
                            aseguradora: planData.aseguradora || '',
                            nombre_plan: planData.nombre_plan || '',
                            tipo_plan: planData.tipo_plan || '',
                            // ✅ Asegúrate de que los valores numéricos se carguen como números o string vacío
                            deducible: planData.deducible === null ? '' : parseFloat(planData.deducible),
                            gasto_max_bolsillo: planData.gasto_max_bolsillo === null ? '' : parseFloat(planData.gasto_max_bolsillo),
                            valor_prima: planData.valor_prima === null ? '' : parseFloat(planData.valor_prima)
                        });
                    } else {
                        setFormData({
                            aseguradora: '',
                            nombre_plan: '',
                            tipo_plan: '',
                            deducible: '',
                            gasto_max_bolsillo: '',
                            valor_prima: ''
                        });
                    }
                } catch (err) {
                    console.error('Error al cargar el plan de salud existente:', err.response ? err.response.data : err.message);
                    setError('Error al cargar el plan de salud.');
                }
            }
        };

        fetchPlanSalud();
        setMessage('');
        setError('');
    }, [userId]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (['deducible', 'gasto_max_bolsillo', 'valor_prima'].includes(name)) {
            // ✅ Permitir la entrada de números y coma como separador decimal.
            // Eliminar cualquier cosa que no sea un dígito o una coma.
            let cleanValue = value.replace(/[^\d,]/g, '');
            
            // Reemplazar la coma por un punto para que parseFloat funcione correctamente.
            // Esto es crucial para almacenar el valor numérico en el estado.
            cleanValue = cleanValue.replace(/,/g, '.');

            // Asegurarse de que solo haya un punto decimal (si el usuario escribe múltiples comas/puntos)
            const parts = cleanValue.split('.');
            if (parts.length > 2) {
                cleanValue = parts[0] + '.' + parts.slice(1).join('');
            }

            // Convertir a float. Si no es un número válido (ej. solo "-"), o está vacío, mantener como string vacío
            const numValue = cleanValue === '' ? '' : parseFloat(cleanValue);

            setFormData(prev => ({
                ...prev,
                [name]: numValue // Almacena el número (ej. 1.50) o un string vacío si la entrada es inválida/vacía
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleFocus = (e) => {
        setEditingField(e.target.name);
    };

    const handleBlur = () => {
        setEditingField(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        // Basic validation for required fields
        for (const field of requiredFields) {
            if (!formData[field] || String(formData[field]).trim() === '') {
                setError(`❌ El campo '${field}' es obligatorio.`);
                return;
            }
        }

        // Validate numerical fields (deducible, gasto_max_bolsillo are optional, valor_prima is required)
        // Check if value is not an empty string AND (is not a number OR is negative)
        if (formData.deducible !== '' && (isNaN(formData.deducible) || parseFloat(formData.deducible) < 0)) {
            setError(`❌ El campo 'Deducible' debe ser un número positivo.`);
            return;
        }
        if (formData.gasto_max_bolsillo !== '' && (isNaN(formData.gasto_max_bolsillo) || parseFloat(formData.gasto_max_bolsillo) < 0)) {
            setError(`❌ El campo 'Gasto Máximo de Bolsillo' debe ser un número positivo.`);
            return;
        }
        // Valor de la prima es obligatorio y debe ser un número positivo
        if (isNaN(formData.valor_prima) || parseFloat(formData.valor_prima) <= 0) {
            setError(`❌ El campo 'Valor de la Prima' debe ser un número positivo.`);
            return;
        }


        try {
            // Asegúrate de enviar null a la DB si los campos opcionales están vacíos
            const dataToSend = {
                usuario_id: userId,
                aseguradora: formData.aseguradora,
                nombre_plan: formData.nombre_plan,
                tipo_plan: formData.tipo_plan,
                deducible: formData.deducible === '' ? null : parseFloat(formData.deducible),
                gasto_max_bolsillo: formData.gasto_max_bolsillo === '' ? null : parseFloat(formData.gasto_max_bolsillo),
                valor_prima: parseFloat(formData.valor_prima)
            };

            const response = await axios.post(`${API_BASE_URL}/api/planes_salud`, dataToSend); 
            setMessage(response.data.message);

            if (onPlanSaludUpdated) {
                onPlanSaludUpdated();
            } else if (onPlanSaludCompleted) {
                onPlanSaludCompleted();
            }

        } catch (err) {
            console.error('Error al guardar el plan de salud:', err.response ? err.response.data : err.message);
            setError(err.response ? err.response.data.message : '❌ Error al conectar con el servidor.');
        }
    };

    // Función auxiliar para obtener el valor a mostrar en el input
    const getInputValue = (fieldName) => {
        const value = formData[fieldName];
        // Si el campo está siendo editado, muestra el valor tal como está en el estado (sin formatear)
        // Esto permite al usuario editar el número sin preocuparse por el formato mientras escribe.
        if (editingField === fieldName) {
            // Asegúrate de que se muestre el punto como coma para el usuario si es un número válido
            return value !== '' && !isNaN(value) ? String(value).replace(/\./g, ',') : '';
        }
        // Si el campo no está vacío, lo formatea para la visualización con separadores de miles y coma decimal.
        if (value !== '' && !isNaN(value)) {
            return numberFormatter.format(value);
        }
        // Si está vacío o no es un número válido, muestra un string vacío
        return '';
    };


    return (
        <div className="form-container">
            <h3>Plan de Salud</h3>
            {message && <p className="form-messages success">{message}</p>}
            {error && <p className="form-messages error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-field">
                        <label>Aseguradora:<span className="required-star">*</span></label>
                        <select
                            name="aseguradora"
                            value={formData.aseguradora}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Selecciona una aseguradora</option>
                            {aseguradorasOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Nombre del Plan:<span className="required-star">*</span></label>
                        <input
                            type="text"
                            name="nombre_plan"
                            value={formData.nombre_plan}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label>Tipo de Plan:<span className="required-star">*</span></label>
                        <select
                            name="tipo_plan"
                            value={formData.tipo_plan}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Selecciona un tipo</option>
                            {tipoPlanOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Deducible ($):</label>
                        <input
                            type="text"
                            name="deducible"
                            value={getInputValue('deducible')}
                            onChange={handleChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            placeholder="0,00" 
                            inputMode="decimal"
                        />
                    </div>

                    <div className="form-field">
                        <label>Gasto Máximo de Bolsillo ($):</label>
                        <input
                            type="text"
                            name="gasto_max_bolsillo"
                            value={getInputValue('gasto_max_bolsillo')}
                            onChange={handleChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            placeholder="0,00" 
                            inputMode="decimal"
                        />
                    </div>

                    <div className="form-field">
                        <label>Valor de la Prima ($):<span className="required-star">*</span></label>
                        <input
                            type="text"
                            name="valor_prima"
                            value={getInputValue('valor_prima')}
                            onChange={handleChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            required
                            placeholder="0,00" 
                            inputMode="decimal"
                        />
                    </div>
                </div>

                <button type="submit">Guardar Plan de Salud</button>
            </form>
        </div>
    );
}

export default PlanSaludForm;