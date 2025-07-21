// frontend/src/components/forms/PagoForm.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Importa las imágenes de los logos de las tarjetas
import visaLogo from '/images/visa.png'; // Asegúrate de que la ruta sea correcta
import mastercardLogo from '/images/mastercard.png'; // Asegúrate de que la ruta sea correcta
import defaultCardLogo from '/images/default_card.png'; // Un logo genérico si no se detecta tipo

function PagoForm({ userId, onPagoCompleted, onPagoUpdated }) {
    const [formData, setFormData] = useState({
        cardNumberFull: '', // Temporal: para la detección del tipo de tarjeta
        ultimos_4_digitos_tarjeta: '',
        token_pago: '',
        fecha_expiracion_mes: '',
        fecha_expiracion_ano: ''
    });
    const [cardType, setCardType] = useState('unknown'); // 'visa', 'mastercard', 'unknown'
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear + i);
    const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

    // Función para detectar el tipo de tarjeta
    const detectCardType = (cardNumber) => {
        const visaRegex = /^4/;
        const mastercardRegex = /^5[1-5]/;
        if (visaRegex.test(cardNumber)) {
            return 'visa';
        } else if (mastercardRegex.test(cardNumber)) {
            return 'mastercard';
        }
        return 'unknown';
    };

    // --- Efecto para precargar datos de pago ---
    useEffect(() => {
        const fetchPagoInfo = async () => {
            if (userId) {
                try {
                    const res = await axios.get(`http://localhost:3001/api/usuario/${userId}`);
                    if (res.data.length > 0) {
                        const pagoData = res.data[0];
                        setFormData({
                            cardNumberFull: '', // No precargamos el número completo por seguridad
                            ultimos_4_digitos_tarjeta: pagoData.ultimos_4_digitos_tarjeta || '',
                            token_pago: pagoData.token_pago || '',
                            fecha_expiracion_mes: String(pagoData.fecha_expiracion_mes).padStart(2, '0') || '',
                            fecha_expiracion_ano: pagoData.fecha_expiracion_ano || ''
                        });
                        setCardType(pagoData.ultimos_4_digitos_tarjeta ? 'unknown' : 'unknown');
                    } else {
                        setFormData({
                            cardNumberFull: '',
                            ultimos_4_digitos_tarjeta: '',
                            token_pago: '',
                            fecha_expiracion_mes: '',
                            fecha_expiracion_ano: ''
                        });
                        setCardType('unknown');
                    }
                } catch (err) {
                    console.error('Error al cargar la información de pago existente:', err);
                    setError('Error al cargar la información de pago.');
                }
            }
        };

        fetchPagoInfo();
        setMessage('');
        setError('');
    }, [userId]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'cardNumberFull') {
            const cleanValue = value.replace(/\D/g, '');
            setFormData(prev => ({
                ...prev,
                [name]: cleanValue,
                ultimos_4_digitos_tarjeta: cleanValue.slice(-4)
            }));
            setCardType(detectCardType(cleanValue));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const getCardLogo = () => {
        switch (cardType) {
            case 'visa':
                return visaLogo;
            case 'mastercard':
                return mastercardLogo;
            default:
                return defaultCardLogo;
        }
    };

    // ✅ Función para generar un token único simulado
    const generateUniqueSimulatedToken = () => {
        // Usa una combinación de la fecha actual y un número aleatorio para mayor unicidad
        return `SIMULADO_${Date.now()}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        const { cardNumberFull, ultimos_4_digitos_tarjeta, token_pago, fecha_expiracion_mes, fecha_expiracion_ano } = formData;

        if (!cardNumberFull || cardNumberFull.length < 13 || !/^\d+$/.test(cardNumberFull)) {
            setError('❌ Por favor, ingresa un número de tarjeta válido.');
            return;
        }
        if (!token_pago || token_pago.trim() === '') {
            setError('❌ El token de pago es obligatorio.');
            return;
        }
        if (!fecha_expiracion_mes || !fecha_expiracion_ano) {
            setError('❌ La fecha de expiración es obligatoria.');
            return;
        }

        const selectedMonth = parseInt(fecha_expiracion_mes, 10);
        const selectedYear = parseInt(fecha_expiracion_ano, 10);
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        if (selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < currentMonth)) {
            setError('❌ La fecha de expiración no puede ser en el pasado.');
            return;
        }

        try {
            const dataToSend = {
                usuario_id: userId,
                ultimos_4_digitos_tarjeta: ultimos_4_digitos_tarjeta,
                token_pago: token_pago,
                fecha_expiracion_mes: selectedMonth,
                fecha_expiracion_ano: selectedYear
            };

            const response = await axios.post(`http://localhost:3001/api`, dataToSend);
            setMessage(response.data.message);

            if (onPagoUpdated) {
                onPagoUpdated();
            } else if (onPagoCompleted) {
                onPagoCompleted();
            }
        } catch (err) {
            console.error('Error al guardar la información de pago:', err.response ? err.response.data : err.message);
            setError(err.response ? err.response.data.message : '❌ Error al conectar con el servidor.');
        }
    };

    return (
        <div className="form-container">
            <h3>Información de Pago</h3>
            {message && <p className="form-messages success">{message}</p>}
            {error && <p className="form-messages error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-field">
                        <label>Número de Tarjeta:</label>
                        <input
                            type="password"
                            name="cardNumberFull"
                            value={formData.cardNumberFull}
                            onChange={handleChange}
                            placeholder="Número completo de la tarjeta"
                            inputMode="numeric"
                            maxLength="19"
                            autoComplete="cc-number"
                        />
                        <div className="card-logo-container">
                            <img src={getCardLogo()} alt={`${cardType} logo`} className="card-logo" />
                        </div>
                    </div>

                    <div className="form-field">
                        <label>Últimos 4 Dígitos:</label>
                        <input
                            type="text"
                            name="ultimos_4_digitos_tarjeta"
                            value={formData.ultimos_4_digitos_tarjeta}
                            readOnly
                            placeholder="XXXX"
                        />
                         <p className="help-text">Estos son los únicos dígitos almacenados por seguridad.</p>
                    </div>

                    <div className="form-field">
                        <label>Token de Pago:<span className="required-star">*</span></label>
                        <input
                            type="text"
                            name="token_pago"
                            value={formData.token_pago}
                            onChange={handleChange}
                            placeholder="Token del procesador de pagos (ej: tok_xyz)"
                            required
                            // La lógica de deshabilitar el campo si ya hay un token persistirá
                            disabled={!!formData.token_pago && formData.token_pago.startsWith('SIMULADO_')}
                        />
                        <p className="help-text">Este campo es normalmente generado por un servicio de pago seguro.</p>
                        <button
                            type="button"
                            // ✅ Llama a la nueva función para generar un token único
                            onClick={() => setFormData(prev => ({ ...prev, token_pago: generateUniqueSimulatedToken() }))}
                        >
                            Generar Token Simulado
                        </button>
                    </div>

                    <div className="form-field">
                        <label>Mes de Expiración:<span className="required-star">*</span></label>
                        <select
                            name="fecha_expiracion_mes"
                            value={formData.fecha_expiracion_mes}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Mes</option>
                            {months.map(month => (
                                <option key={month} value={month}>{month}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Año de Expiración:<span className="required-star">*</span></label>
                        <select
                            name="fecha_expiracion_ano"
                            value={formData.fecha_expiracion_ano}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Año</option>
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button type="submit">Guardar Información de Pago</button>
            </form>
        </div>
    );
}

export default PagoForm;