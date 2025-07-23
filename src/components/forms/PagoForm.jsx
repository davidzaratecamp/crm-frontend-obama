import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
// Importa las imágenes de los logos de las tarjetas
import visaLogo from '/images/visa.png'; // Asegúrate de que la ruta sea correcta
import mastercardLogo from '/images/mastercard.png'; // Asegúrate de que la ruta sea correcta
import defaultCardLogo from '/images/default_card.png'; // Un logo genérico si no se detecta tipo

function PagoForm({ userId, onPagoCompleted, onPagoUpdated }) {
    const [formData, setFormData] = useState({
        cardNumberFull: '', // Temporal: para la detección del tipo de tarjeta
        ultimos_4_digitos_tarjeta: '',
        cvv: '', // ✅ Nuevo campo para CVV
        fecha_expiracion_mes: '', // Cambiado de 'mesExpiracion'
        fecha_expiracion_ano: '', // Cambiado de 'anoExpiracion'
    });
    const [cardType, setCardType] = useState('unknown'); // 'visa', 'mastercard', 'unknown'
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // --- NEW STATE & REF FOR MASKING ---
    const [showCardNumber, setShowCardNumber] = useState(false); // Controls if input type is 'text' or 'password'
    const maskTimeoutRef = useRef(null); // Ref to store the timeout ID

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
                    const res = await axios.get(`${API_BASE_URL}/api/usuario/${userId}`);
                    if (res.data.length > 0) {
                        const pagoData = res.data[0];
                        setFormData({
                            cardNumberFull: '', // No precargamos el número completo por seguridad
                            ultimos_4_digitos_tarjeta: pagoData.ultimos_4_digitos_tarjeta || '',
                            cvv: '', // No precargamos CVV por seguridad
                            fecha_expiracion_mes: String(pagoData.fecha_expiracion_mes).padStart(2, '0') || '',
                            fecha_expiracion_ano: pagoData.fecha_expiracion_ano || ''
                        });
                        // Actualizar el tipo de tarjeta si hay últimos 4 dígitos cargados
                        setCardType(pagoData.ultimos_4_digitos_tarjeta ? detectCardType(pagoData.ultimos_4_digitos_tarjeta) : 'unknown');
                    } else {
                        setFormData({
                            cardNumberFull: '',
                            ultimos_4_digitos_tarjeta: '',
                            cvv: '',
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

    // --- Cleanup for the timeout ref ---
    useEffect(() => {
        return () => {
            if (maskTimeoutRef.current) {
                clearTimeout(maskTimeoutRef.current);
            }
        };
    }, []);


    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'cardNumberFull') {
            const cleanValue = value.replace(/\D/g, ''); // Keep only digits

            // Clear any existing timeout
            if (maskTimeoutRef.current) {
                clearTimeout(maskTimeoutRef.current);
            }

            // Temporarily show the full number
            setShowCardNumber(true);

            // Set a timeout to mask the number after 500ms (0.5 seconds)
            maskTimeoutRef.current = setTimeout(() => {
                setShowCardNumber(false);
            }, 500);

            setFormData(prev => ({
                ...prev,
                [name]: cleanValue,
                ultimos_4_digitos_tarjeta: cleanValue.slice(-4) // Always keep the last 4 for display
            }));
            setCardType(detectCardType(cleanValue));
        } else if (name === 'cvv') {
            const cleanValue = value.replace(/\D/g, '').slice(0, 3);
            setFormData(prev => ({
                ...prev,
                [name]: cleanValue
            }));
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        const { cardNumberFull, ultimos_4_digitos_tarjeta, cvv, fecha_expiracion_mes, fecha_expiracion_ano } = formData;

        if (!cardNumberFull || cardNumberFull.length < 13 || !/^\d+$/.test(cardNumberFull)) {
            setError('❌ Por favor, ingresa un número de tarjeta válido.');
            return;
        }
        if (!cvv || !/^\d{3}$/.test(cvv)) {
            setError('❌ El CVV es obligatorio y debe tener 3 dígitos numéricos.');
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
                cvv: cvv,
                fecha_expiracion_mes: selectedMonth,
                fecha_expiracion_ano: selectedYear
            };

            const response = await axios.post(`${API_BASE_URL}/api`, dataToSend);
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

    // Function to display the masked card number (e.g., **** **** **** 1234)
    const getMaskedCardNumber = (cardNumber) => {
        if (cardNumber.length <= 4) {
            // If less than or equal to 4 digits, show them directly when not masked
            return cardNumber;
        }
        // Mask all but the last 4 digits
        return '*'.repeat(cardNumber.length - 4) + cardNumber.slice(-4);
    };


    return (
        <div className="form-container">
            <h3>Información de Pago</h3>
            {message && <p className="form-messages success">{message}</p>}
            {error && <p className="form-messages error">{error}</p>}
            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    {/* Número de Tarjeta */}
                    <div className="form-field full-width"> {/* Added full-width for clarity if grid has multiple columns */}
                        <label htmlFor="cardNumberFull">Número de Tarjeta:</label>
                        <input
                            type={showCardNumber ? "text" : "password"} // Dynamic type
                            id="cardNumberFull"
                            name="cardNumberFull"
                            value={showCardNumber ? formData.cardNumberFull : getMaskedCardNumber(formData.cardNumberFull)} // Apply masking
                            onChange={handleChange}
                            placeholder="Número completo de la tarjeta"
                            inputMode="numeric"
                            maxLength="19"
                            autoComplete="cc-number"
                        />
                         {/* Moved card logo inside the card number field for better visual grouping */}
                        <div className="card-logo-container">
                            <img src={getCardLogo()} alt={`${cardType} logo`} className="card-logo" />
                        </div>
                    </div>

                    {/* Últimos 4 Dígitos */}
                    <div className="form-field">
                        <label htmlFor="ultimos_4_digitos_tarjeta">Últimos 4 Dígitos:</label>
                        <input
                            type="text"
                            id="ultimos_4_digitos_tarjeta"
                            name="ultimos_4_digitos_tarjeta"
                            value={formData.ultimos_4_digitos_tarjeta}
                            readOnly
                            placeholder="XXXX"
                        />
                         <p className="help-text">Estos son los únicos dígitos almacenados por seguridad.</p>
                    </div>

                    {/* CVV */}
                    <div className="form-field">
                        <label htmlFor="cvv">CVV:<span className="required-star">*</span></label>
                        <input
                            type="text"
                            id="cvv"
                            name="cvv"
                            value={formData.cvv}
                            onChange={handleChange}
                            placeholder="Ej: 123"
                            inputMode="numeric"
                            maxLength="3"
                            pattern="[0-9]{3}"
                            required
                        />
                        <p className="help-text">Código de seguridad de 3 dígitos al reverso de tu tarjeta.</p>
                    </div>

                    {/* Mes y Año de Expiración - Ahora en una misma fila si el grid lo permite, o con un contenedor flex */}
                    <div className="form-field-group horizontal-group"> {/* New container for grouping */}
                        <div className="form-field half-width"> {/* Adjusted width for two fields in one row */}
                            <label htmlFor="fecha_expiracion_mes">Mes Exp.:<span className="required-star">*</span></label>
                            <select
                                id="fecha_expiracion_mes"
                                name="fecha_expiracion_mes"
                                value={formData.fecha_expiracion_mes}
                                onChange={handleChange}
                                required
                            >
                                <option value="">MM</option>
                                {months.map(month => (
                                    <option key={month} value={month}>{month}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-field half-width"> {/* Adjusted width for two fields in one row */}
                            <label htmlFor="fecha_expiracion_ano">Año Exp.:<span className="required-star">*</span></label>
                            <select
                                id="fecha_expiracion_ano"
                                name="fecha_expiracion_ano"
                                value={formData.fecha_expiracion_ano}
                                onChange={handleChange}
                                required
                            >
                                <option value="">AA</option>
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Tipo de Tarjeta - This field needs to be handled differently if it's meant for display only */}
                    {/* Assuming cardType is derived from cardNumberFull, it shouldn't be an input field for user entry */}
                    <div className="form-field full-width">
                        <label>Tipo de Tarjeta:</label>
                        <div className="card-logo-display-container"> {/* Renamed for clarity */}
                            {cardType === 'visa' && <img src={visaLogo} alt="Visa" className="card-logo" />}
                            {cardType === 'mastercard' && <img src={mastercardLogo} alt="Mastercard" className="card-logo" />}
                            {cardType === 'unknown' && formData.cardNumberFull === '' && <span className="help-text">Ingresa el número de tarjeta para ver el tipo</span>}
                            {cardType === 'unknown' && formData.cardNumberFull !== '' && <span className="help-text">Tipo de tarjeta desconocido</span>}
                        </div>
                    </div>
                </div>

                <button type="submit">Guardar Información de Pago</button>
            </form>
        </div>
    );
}

export default PagoForm;