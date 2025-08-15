import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- Componentes Mocks de UI (para que el archivo sea autónomo) ---
const Navbar = () => (
    <nav style={{ background: '#333', color: 'white', padding: '1rem', textAlign: 'center', marginBottom: '20px' }}>
        <h2>Módulo de Corrección de Auditoría</h2>
    </nav>
);
const Accordion = ({ children }) => <div>{children}</div>;
const AccordionItem = ({ title, children }) => (
    <details open style={{ border: '1px solid #ccc', borderRadius: '8px', marginBottom: '10px' }}>
        <summary style={{ background: '#f0f0f0', padding: '15px', cursor: 'pointer', fontWeight: 'bold' }}>{title}</summary>
        <div style={{ padding: '15px' }}>{children}</div>
    </details>
);
// --- Fin de Mocks ---

const API_BASE_URL = 'http://localhost:3001';

// --- Componentes de Formulario Reutilizables ---
const FormRow = ({ children }) => <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '15px' }}>{children}</div>;
const FormField = ({ label, name, value, onChange, type = 'text', options = [], disabled = false }) => (
    <div>
        <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }} htmlFor={name}>{label}</label>
        {type === 'select' ? (<select style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} name={name} id={name} value={value || ''} onChange={onChange} disabled={disabled}><option value="">Seleccionar...</option>{options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select>) : (<input style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} type={type} name={name} id={name} value={value || ''} onChange={onChange} disabled={disabled} />)}
    </div>
);
const CheckboxField = ({ label, name, checked, onChange }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
        <input type="checkbox" id={name} name={name} checked={checked} onChange={onChange} style={{ width: '20px', height: '20px' }} />
        <label style={{ fontWeight: 'bold' }} htmlFor={name}>{label}</label>
    </div>
);
const SubmitButton = ({ isSubmitting, text }) => <button type="submit" disabled={isSubmitting} style={{ marginTop: '10px', padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>{isSubmitting ? 'Guardando...' : text}</button>;

// --- FORMULARIOS REALES INTEGRADOS ---

const UserFormEditable = ({ initialData, onUpdate }) => {
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => {
        if (initialData) {
            const formattedDate = initialData.fecha_nacimiento ? new Date(initialData.fecha_nacimiento).toISOString().split('T')[0] : '';
            setFormData({ ...initialData, fecha_nacimiento: formattedDate });
        }
    }, [initialData]);
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (checked ? 1 : 0) : value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.put(`${API_BASE_URL}/api/usuarios/${initialData.id}`, formData);
            onUpdate('Solicitante Principal');
        } catch (error) { alert("Error al guardar cambios del solicitante."); } finally { setIsSubmitting(false); }
    };
    return (
        <form onSubmit={handleSubmit}>
            <h4 style={{ borderBottom: '2px solid #007bff', paddingBottom: '5px', marginBottom: '15px' }}>Datos Personales</h4>
            <FormRow>
                <FormField label="Nombres" name="nombres" value={formData.nombres} onChange={handleChange} />
                <FormField label="Apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} />
                <FormField label="Sexo" name="sexo" value={formData.sexo} onChange={handleChange} type="select" options={[{value: 'Masculino', label: 'Masculino'}, {value: 'Femenino', label: 'Femenino'}]} />
            </FormRow>
            <FormRow>
                <FormField label="Fecha de Nacimiento" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} type="date" />
                <FormField label="Número Social" name="social" value={formData.social} onChange={handleChange} />
                <FormField label="Estatus Migratorio" name="estatus_migratorio" value={formData.estatus_migratorio} onChange={handleChange} />
            </FormRow>
            <CheckboxField label="¿Solicita Cobertura?" name="solicita_cobertura" checked={!!formData.solicita_cobertura} onChange={handleChange} />
            <h4 style={{ borderBottom: '2px solid #007bff', paddingBottom: '5px', margin: '30px 0 15px 0' }}>Dirección y Contacto</h4>
            <FormRow>
                <FormField label="Dirección" name="direccion" value={formData.direccion} onChange={handleChange} />
                <FormField label="Ciudad" name="ciudad" value={formData.ciudad} onChange={handleChange} />
                <FormField label="Estado" name="estado" value={formData.estado} onChange={handleChange} />
            </FormRow>
            <FormRow>
                <FormField label="Código Postal" name="codigo_postal" value={formData.codigo_postal} onChange={handleChange} />
                <FormField label="Condado" name="condado" value={formData.condado} onChange={handleChange} />
                <FormField label="Tipo de Vivienda" name="tipo_vivienda" value={formData.tipo_vivienda} onChange={handleChange} />
            </FormRow>
            <FormRow>
                <FormField label="Correo Electrónico" name="correo_electronico" value={formData.correo_electronico} onChange={handleChange} type="email"/>
                <FormField label="Teléfono 1" name="phone_1" value={formData.phone_1} onChange={handleChange} />
                <FormField label="Teléfono 2" name="phone_2" value={formData.phone_2} onChange={handleChange} />
            </FormRow>
            <h4 style={{ borderBottom: '2px solid #007bff', paddingBottom: '5px', margin: '30px 0 15px 0' }}>Información de Venta</h4>
             <FormRow>
                <FormField label="Origen de Venta" name="origen_venta" value={formData.origen_venta} onChange={handleChange} type="select" options={[ { value: 'Lear', label: 'Lear' }, { value: 'Rediferido', label: 'Rediferido' }, { value: 'Base', label: 'Base' } ]}/>
                <FormField label="Referido" name="referido" value={formData.referido} onChange={handleChange} />
                <FormField label="Base" name="base" value={formData.base} onChange={handleChange} />
            </FormRow>
            <SubmitButton isSubmitting={isSubmitting} text="Guardar Cambios del Solicitante" />
        </form>
    );
};

const DependienteFormEditable = ({ userId, onUpdate, initialData, isConyugeForm = false, title }) => {
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    useEffect(() => {
        if (initialData) {
            const formattedDate = initialData.fecha_nacimiento ? new Date(initialData.fecha_nacimiento).toISOString().split('T')[0] : '';
            setFormData({ ...initialData, fecha_nacimiento: formattedDate, parentesco: isConyugeForm ? 'Cónyuge' : initialData.parentesco });
            setEditingId(initialData.id);
        } else {
            setFormData({ parentesco: isConyugeForm ? 'Cónyuge' : 'Hijo' });
            setEditingId(null);
        }
    }, [initialData, isConyugeForm]);
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (checked ? 1 : 0) : value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingId) {
                await axios.put(`${API_BASE_URL}/api/dependientes/${editingId}`, formData);
            } else {
                await axios.post(`${API_BASE_URL}/api/${userId}/dependientes`, formData);
            }
            onUpdate(title);
        } catch (error) { alert(`Error al guardar ${title}.`); } finally { setIsSubmitting(false); }
    };
    return (
        <form onSubmit={handleSubmit} style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '15px' }}>
            <FormRow>
                <FormField label="Nombres" name="nombres" value={formData.nombres} onChange={handleChange} />
                <FormField label="Apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} />
                <FormField label="Sexo" name="sexo" value={formData.sexo} onChange={handleChange} type="select" options={[{value: 'Masculino', label: 'Masculino'}, {value: 'Femenino', label: 'Femenino'}]} />
            </FormRow>
            <FormRow>
                <FormField label="Fecha de Nacimiento" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} type="date" />
                <FormField label="Número Social" name="social" value={formData.social} onChange={handleChange} />
                <FormField label="Parentesco" name="parentesco" value={formData.parentesco} onChange={handleChange} type="select" disabled={isConyugeForm} options={[{value: 'Cónyuge', label: 'Cónyuge'},{value: 'Hijo', label: 'Hijo'},{value: 'Hijastro', label: 'Hijastro'},{value: 'Padre', label: 'Padre'},{value: 'Madre', label: 'Madre'},{value: 'Otro', label: 'Otro'}]}/>
            </FormRow>
            <FormRow>
                <FormField label="Estatus Migratorio" name="estatus_migratorio" value={formData.estatus_migratorio} onChange={handleChange} />
            </FormRow>
            <div style={{display: 'flex', gap: '30px'}}>
                <CheckboxField label="¿Solicita Cobertura?" name="solicita_cobertura" checked={!!formData.solicita_cobertura} onChange={handleChange} />
                <CheckboxField label="¿Tiene Medicare/Medicaid?" name="medicare_medicaid" checked={!!formData.medicare_medicaid} onChange={handleChange} />
            </div>
            <SubmitButton isSubmitting={isSubmitting} text={`Guardar Cambios de ${title}`} />
        </form>
    );
};

const ConyugeFormReal = ({ userId, onConyugeChanged, initialData }) => {
    return <DependienteFormEditable userId={userId} onUpdate={onConyugeChanged} initialData={initialData} isConyugeForm={true} title="Cónyuge" />;
};

const IngresosFormEditable = ({ personas, ingresosIniciales, onUpdate }) => {
    const [ingresos, setIngresos] = useState({});
    const [isSubmitting, setIsSubmitting] = useState({});
    useEffect(() => {
        const initialState = {};
        personas.forEach(p => {
            const ingresoExistente = ingresosIniciales.find(i => i.entidad_id === p.id);
            initialState[p.id] = {
                id: ingresoExistente?.id || null,
                tipo_declaracion: ingresoExistente?.tipo_declaracion || 'W2',
                ingresos_semanales: ingresoExistente?.ingresos_semanales || '',
                tipo_entidad: p.parentesco ? 'Dependiente' : 'Usuario',
                entidad_id: p.id,
            };
        });
        setIngresos(initialState);
    }, [personas, ingresosIniciales]);
    const handleChange = (personaId, e) => {
        const { name, value } = e.target;
        setIngresos(prev => ({ ...prev, [personaId]: { ...prev[personaId], [name]: value }}));
    };
    const handleSubmit = async (e, personaId) => {
        e.preventDefault();
        setIsSubmitting(prev => ({ ...prev, [personaId]: true }));
        const ingresoData = ingresos[personaId];
        try {
            if (ingresoData.id) {
                await axios.put(`${API_BASE_URL}/api/ingresos/${ingresoData.id}`, ingresoData);
            } else {
                await axios.post(`${API_BASE_URL}/api/ingresos`, ingresoData);
            }
            onUpdate('Ingresos');
        } catch (error) {
            alert(`Error al guardar los ingresos de ${personas.find(p=>p.id === personaId).nombres}.`);
        } finally {
            setIsSubmitting(prev => ({ ...prev, [personaId]: false }));
        }
    };
    return (
        <div>
            {personas.map(persona => (
                <form key={persona.id} onSubmit={(e) => handleSubmit(e, persona.id)} style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginTop: '15px' }}>
                    <h5 style={{ margin: '0 0 10px 0' }}>Ingresos de: {persona.nombres} {persona.apellidos} ({persona.parentesco || 'Solicitante'})</h5>
                    <FormRow>
                        <FormField label="Tipo de Declaración" name="tipo_declaracion" value={ingresos[persona.id]?.tipo_declaracion} onChange={(e) => handleChange(persona.id, e)} type="select" options={[{value: 'W2', label: 'W2'}, {value: '1099', label: '1099'}]}/>
                        <FormField label="Ingresos Semanales ($)" name="ingresos_semanales" value={ingresos[persona.id]?.ingresos_semanales} onChange={(e) => handleChange(persona.id, e)} type="number"/>
                    </FormRow>
                    <SubmitButton isSubmitting={isSubmitting[persona.id]} text={`Guardar Ingresos de ${persona.nombres}`} />
                </form>
            ))}
        </div>
    );
};

// ✅ FORMULARIO REAL PARA PLAN DE SALUD
const PlanSaludFormEditable = ({ userId, initialData, onUpdate }) => {
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const aseguradoraOptions = [
        'Aetna', 'Ambetter', 'Anthem', 'Bluecross', 'Cigna', 'Molina', 
        'Oscar', 'United', 'Wellpoint', 'Horizon', 'Kaiser'
    ].map(val => ({ value: val, label: val }));

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                aseguradora: '', nombre_plan: '', tipo_plan: '', deducible: '', 
                gasto_max_bolsillo: '', valor_prima: ''
            });
        }
    }, [initialData]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // El controlador `crearOActualizarPlanSalud` maneja la lógica de si es POST o PUT.
            await axios.post(`${API_BASE_URL}/api/planes_salud`, { ...formData, usuario_id: userId });
            onUpdate('Plan de Salud');
        } catch (error) {
            alert("Error al guardar el Plan de Salud.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <FormRow>
                <FormField 
                    label="Aseguradora" 
                    name="aseguradora" 
                    value={formData.aseguradora} 
                    onChange={handleChange} 
                    type="select"
                    options={aseguradoraOptions}
                />
                <FormField label="Nombre del Plan" name="nombre_plan" value={formData.nombre_plan} onChange={handleChange} />
                <FormField label="Tipo de Plan" name="tipo_plan" value={formData.tipo_plan} onChange={handleChange} />
            </FormRow>
            <FormRow>
                <FormField label="Deducible ($)" name="deducible" value={formData.deducible} onChange={handleChange} type="number" />
                <FormField label="Gasto Máximo de Bolsillo ($)" name="gasto_max_bolsillo" value={formData.gasto_max_bolsillo} onChange={handleChange} type="number" />
                <FormField label="Valor de la Prima ($)" name="valor_prima" value={formData.valor_prima} onChange={handleChange} type="number" />
            </FormRow>
            <SubmitButton isSubmitting={isSubmitting} text="Guardar Cambios del Plan de Salud" />
        </form>
    );
};



// ✅ FORMULARIO REAL PARA INFORMACIÓN DE PAGO
const InformacionPagoFormEditable = ({ userId, initialData, onUpdate }) => {
    const [formData, setFormData] = useState({
        ultimos_4_digitos_tarjeta: '',
        cvv: '',
        fecha_expiracion_mes: '',
        fecha_expiracion_ano: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const mesOptions = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: String(i + 1).padStart(2, '0') }));
    const currentYear = new Date().getFullYear();
    const anoOptions = Array.from({ length: 11 }, (_, i) => ({ value: currentYear + i, label: currentYear + i }));

    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData, cvv: '' }); // CVV siempre en blanco por seguridad
        } else {
             setFormData({ ultimos_4_digitos_tarjeta: '', cvv: '', fecha_expiracion_mes: '', fecha_expiracion_ano: '' });
        }
    }, [initialData]);

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post(`${API_BASE_URL}/api/informacion_pago`, { ...formData, usuario_id: userId });
            onUpdate('Información de Pago');
        } catch (error) {
            alert("Error al guardar la Información de Pago. Revise los datos.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <FormRow>
                <FormField label="Últimos 4 Dígitos de la Tarjeta" name="ultimos_4_digitos_tarjeta" value={formData.ultimos_4_digitos_tarjeta} onChange={handleChange} type="text" />
                <FormField label="CVV" name="cvv" value={formData.cvv} onChange={handleChange} type="password" />
            </FormRow>
            <FormRow>
                <FormField label="Mes de Expiración" name="fecha_expiracion_mes" value={formData.fecha_expiracion_mes} onChange={handleChange} type="select" options={mesOptions} />
                <FormField label="Año de Expiración" name="fecha_expiracion_ano" value={formData.fecha_expiracion_ano} onChange={handleChange} type="select" options={anoOptions} />
            </FormRow>
            <SubmitButton isSubmitting={isSubmitting} text="Guardar Información de Pago" />
        </form>
    );
};

// --- Componente Principal ---
export default function CorreccionAuditoria() {
    const { userId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    
    const [userData, setUserData] = useState(null);
    const [conyugeData, setConyugeData] = useState(null);
    const [dependientesData, setDependientesData] = useState([]);
    const [ingresosData, setIngresosData] = useState([]);
    const [planSaludData, setPlanSaludData] = useState(null);
    const [pagoData, setPagoData] = useState(null);

    const fetchAllDataForCorrection = useCallback(async () => {
        if (!userId) {
            setError("No se proporcionó un ID de usuario.");
            return;
        }
        setLoading(true);
        try {
            const [userRes, conyugeRes, dependientesRes, ingresosRes, planSaludRes, pagoRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/usuarios/${userId}`),
                axios.get(`${API_BASE_URL}/api/dependientes/usuario/${userId}/parentesco/Cónyuge`),
                axios.get(`${API_BASE_URL}/api/${userId}/dependientes/sin-conyuge`),
                axios.get(`${API_BASE_URL}/api/ingresos/all/${userId}`),
                axios.get(`${API_BASE_URL}/api/planes_salud/usuario/${userId}`),
                axios.get(`${API_BASE_URL}/api/usuario/{usuarioId}}`),
                // ✅ URL CORREGIDA Y FINAL
                axios.get(``)
            ]);
            setUserData(userRes.data);
            setConyugeData(conyugeRes.data);
            setDependientesData(dependientesRes.data);
            setIngresosData(ingresosRes.data);
            setPlanSaludData(planSaludRes.data[0] || null);
            setPagoData(pagoRes.data[0] || null);
        } catch (err) {
            // Si una de las llamadas falla, Promise.all se detiene.
            // Es posible que un usuario no tenga info de pago, lo cual no es un error fatal.
            // Para manejar esto, se podrían envolver las llamadas en try/catch individuales
            // o ajustar los endpoints para que no devuelvan 404 si no encuentran datos.
            // Por ahora, mostramos un error general.
            console.error("Error en una de las llamadas de carga de datos:", err);
            setError("No se pudieron cargar todos los datos del registro. Es posible que falte alguna información en la base de datos.");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchAllDataForCorrection();
    }, [fetchAllDataForCorrection]);

    const handleGenericUpdate = (dataType) => {
        setMessage(`¡Datos de '${dataType}' actualizados con éxito!`);
        setTimeout(() => setMessage(''), 4000);
        fetchAllDataForCorrection();
    };

    const handleResubmit = async () => { /* ...código sin cambios... */ };

    if (loading) return <div style={{padding: '20px'}}>Cargando datos para corrección...</div>;
    if (error) return <div style={{padding: '20px', color: 'red'}}>{error}</div>;

    const todasLasPersonas = [userData, conyugeData, ...dependientesData].filter(Boolean);

    return (
        <div style={{ fontFamily: 'sans-serif', maxWidth: '900px', margin: 'auto' }}>
            <Navbar />
            <div style={{ padding: '0 20px' }}>
                <h1>Corregir Registro de Cliente: {userData?.nombres} {userData?.apellidos}</h1>
                <p style={{ background: '#eef2f7', padding: '10px', borderRadius: '8px' }}>
                    Modifica los datos necesarios y guarda los cambios en cada sección. Cuando termines, haz clic en "Reenviar a Auditoría".
                </p>
                {message && <p style={{ padding: '10px', color: 'green', background: '#e8f5e9', border: '1px solid green', borderRadius: '5px', fontWeight: 'bold' }}>{message}</p>}

                <Accordion>
                    <AccordionItem title="1. Datos Personales del Solicitante Principal">{userData && <UserFormEditable initialData={userData} onUpdate={handleGenericUpdate} />}</AccordionItem>
                    <AccordionItem title="2. Datos del Cónyuge"><ConyugeFormReal userId={userId} initialData={conyugeData} onConyugeChanged={handleGenericUpdate} /></AccordionItem>
                    <AccordionItem title="3. Dependientes">{dependientesData.length > 0 ? (dependientesData.map(dep => (<DependienteFormEditable key={dep.id} userId={userId} initialData={dep} onUpdate={handleGenericUpdate} title={`Dependiente ${dep.nombres}`} />))) : (<p>No se registraron otros dependientes.</p>)}</AccordionItem>
                    <AccordionItem title="4. Ingresos"><IngresosFormEditable personas={todasLasPersonas} ingresosIniciales={ingresosData} onUpdate={handleGenericUpdate} /></AccordionItem>
                    <AccordionItem title="5. Plan de Salud"><PlanSaludFormEditable userId={userId} initialData={planSaludData} onUpdate={handleGenericUpdate} /></AccordionItem>
                    <AccordionItem title="6. Información de Pago">
                        <InformacionPagoFormEditable 
                            userId={userId}
                            initialData={pagoData}
                            onUpdate={handleGenericUpdate}
                        />
                    </AccordionItem>
                </Accordion>

                <div style={{ textAlign: 'center', margin: '40px 0' }}>
                    <button onClick={handleResubmit} disabled={loading} style={{ padding: '15px 40px', fontSize: '1.2em', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        {loading ? 'Enviando...' : 'Reenviar a Auditoría'}
                    </button>
                </div>
            </div>
        </div>
    );
}
