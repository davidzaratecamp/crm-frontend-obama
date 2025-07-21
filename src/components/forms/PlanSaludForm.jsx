// frontend/src/components/forms/PlanSaludForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PlanSaludForm({ userId, onPlanSaludCompleted, onPlanSaludUpdated }) {
    const [formData, setFormData] = useState({
        aseguradora: '',
        nombre_plan: '',
        tipo_plan: '',
        deducible: '', // Stored as raw number
        gasto_max_bolsillo: '', // Stored as raw number
        valor_prima: '' // Stored as raw number
    });

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    // ✅ Nuevo estado para controlar qué campo numérico se está editando
    const [editingField, setEditingField] = useState(null);

    // Formatter for displaying numbers with thousands separators
    const numberFormatter = new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const aseguradorasOptions = [
        "Aetna", "Ambetter", "Anthem", "Bluecross", "Cigna", "Molina",
        "Oscar", "United", "Wellpoint", "Horizon", "Kaiser"
    ];

    const tipoPlanOptions = ["Bronce", "Plata", "Oro", "Platino"];

    // Required fields for validation
    const requiredFields = [
        'aseguradora', 'nombre_plan', 'tipo_plan', 'valor_prima'
    ];

    // --- Effect to preload data for editing ---
    useEffect(() => {
        const fetchPlanSalud = async () => {
            if (userId) {
                try {
                    const res = await axios.get(`http://10.255.255.85:3001/api/planes_salud/usuario/${userId}`);
                    if (res.data.length > 0) {
                        const planData = res.data[0];
                        setFormData({
                            aseguradora: planData.aseguradora || '',
                            nombre_plan: planData.nombre_plan || '',
                            tipo_plan: planData.tipo_plan || '',
                            deducible: planData.deducible === null ? '' : planData.deducible,
                            gasto_max_bolsillo: planData.gasto_max_bolsillo === null ? '' : planData.gasto_max_bolsillo,
                            valor_prima: planData.valor_prima || ''
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
            // Permitir la entrada de números, comas, puntos y que esté vacío
            // Eliminar cualquier cosa que no sea un dígito o un punto/coma
            let cleanValue = value.replace(/[^\d.,]/g, ''); 
            // Reemplazar coma por punto para que parseFloat funcione correctamente
            cleanValue = cleanValue.replace(/,/g, '.');

            // Solo permitir un punto decimal
            const parts = cleanValue.split('.');
            if (parts.length > 2) {
                cleanValue = parts[0] + '.' + parts.slice(1).join('');
            }

            // Convertir a float o mantener como string si no es un número válido aún o está vacío
            const numValue = cleanValue === '' ? '' : parseFloat(cleanValue);

            setFormData(prev => ({
                ...prev,
                [name]: numValue // Almacena el número o un string vacío si la entrada es inválida/vacía
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // ✅ Nueva función para manejar el foco en el input
    const handleFocus = (e) => {
        setEditingField(e.target.name);
    };

    // ✅ Nueva función para manejar la pérdida de foco en el input
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
        if (formData.deducible !== '' && (isNaN(formData.deducible) || parseFloat(formData.deducible) < 0)) {
            setError(`❌ El campo 'Deducible' debe ser un número positivo.`);
            return;
        }
        if (formData.gasto_max_bolsillo !== '' && (isNaN(formData.gasto_max_bolsillo) || parseFloat(formData.gasto_max_bolsillo) < 0)) {
            setError(`❌ El campo 'Gasto Máximo de Bolsillo' debe ser un número positivo.`);
            return;
        }
        if (isNaN(formData.valor_prima) || parseFloat(formData.valor_prima) <= 0) { // Prima must be a positive number
            setError(`❌ El campo 'Valor de la Prima' debe ser un número positivo.`);
            return;
        }


        try {
            const dataToSend = {
                usuario_id: userId,
                aseguradora: formData.aseguradora,
                nombre_plan: formData.nombre_plan,
                tipo_plan: formData.tipo_plan,
                deducible: formData.deducible === '' ? null : parseFloat(formData.deducible),
                gasto_max_bolsillo: formData.gasto_max_bolsillo === '' ? null : parseFloat(formData.gasto_max_bolsillo),
                valor_prima: parseFloat(formData.valor_prima)
            };

            const response = await axios.post('http://10.255.255.85:3001/api/planes_salud', dataToSend);
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
        if (editingField === fieldName) {
            return value;
        }
        // Si el campo no está vacío, lo formatea para la visualización
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
                            // ✅ Usa la nueva función getInputValue
                            value={getInputValue('deducible')}
                            onChange={handleChange}
                            onFocus={handleFocus} // ✅ Añadir onFocus
                            onBlur={handleBlur}   // ✅ Añadir onBlur
                            placeholder="0.00" 
                            inputMode="decimal" // Más apropiado para números con decimales
                        />
                    </div>

                    <div className="form-field">
                        <label>Gasto Máximo de Bolsillo ($):</label>
                        <input
                            type="text"
                            name="gasto_max_bolsillo"
                            // ✅ Usa la nueva función getInputValue
                            value={getInputValue('gasto_max_bolsillo')}
                            onChange={handleChange}
                            onFocus={handleFocus} // ✅ Añadir onFocus
                            onBlur={handleBlur}   // ✅ Añadir onBlur
                            placeholder="0.00"
                            inputMode="decimal"
                        />
                    </div>

                    <div className="form-field">
                        <label>Valor de la Prima ($):<span className="required-star">*</span></label>
                        <input
                            type="text"
                            name="valor_prima"
                            // ✅ Usa la nueva función getInputValue
                            value={getInputValue('valor_prima')}
                            onChange={handleChange}
                            onFocus={handleFocus} // ✅ Añadir onFocus
                            onBlur={handleBlur}   // ✅ Añadir onBlur
                            required
                            placeholder="0.00"
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