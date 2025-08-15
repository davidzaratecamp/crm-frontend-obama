// frontend/src/pages/PrincipalData.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // Assuming react-router-dom is available
import axios from 'axios'; // Assuming axios is available

// --- Mock Components to make the file self-contained ---
// In a real application, these would be in separate files.

const Navbar = () => (
    <nav style={{ background: '#333', color: 'white', padding: '1rem', textAlign: 'center' }}>
        <h2>Navbar Placeholder</h2>
    </nav>
);

const Accordion = ({ children, defaultOpenIndex, onToggle }) => {
    return <div>{children}</div>;
};

const AccordionItem = ({ title, isOpen, toggleOpen, showCheck, children, disabled }) => (
    <div style={{ border: '1px solid #ccc', margin: '10px 0', borderRadius: '8px', opacity: disabled ? 0.5 : 1 }}>
        <button onClick={toggleOpen} disabled={disabled} style={{ width: '100%', background: '#f0f0f0', border: 'none', padding: '15px', textAlign: 'left', fontSize: '1.1em', cursor: 'pointer' }}>
            {title} {showCheck && '✅'}
        </button>
        {isOpen && !disabled && <div style={{ padding: '15px' }}>{children}</div>}
    </div>
);

const FormPlaceholder = ({ title, onComplete }) => (
    <div>
        <h3>{title}</h3>
        <p>This is a placeholder for the form. In a real app, form fields would be here.</p>
        <button onClick={onComplete}>Complete Step</button>
    </div>
);

const UserForm = ({ onUserCreated, onUserUpdated, asesorId }) => <FormPlaceholder title="User Form" onComplete={() => (onUserCreated ? onUserCreated('new-user-123') : onUserUpdated())} />;
const ConyugeForm = ({ onContinueToDependientes }) => <FormPlaceholder title="Conyuge Form" onComplete={() => onContinueToDependientes()} />;
const DependienteForm = ({ onContinueToIngresos }) => <FormPlaceholder title="Dependiente Form" onComplete={() => onContinueToIngresos()} />;
const IngresoForm = ({ onIngresosCompleted }) => <FormPlaceholder title="Ingreso Form" onComplete={onIngresosCompleted} />;
const PlanSaludForm = ({ onPlanSaludCompleted }) => <FormPlaceholder title="Plan Salud Form" onComplete={onPlanSaludCompleted} />;
const PagoForm = ({ onPagoCompleted }) => <FormPlaceholder title="Pago Form" onComplete={onPagoCompleted} />;
const EvidenciaUploader = ({ onEvidenciasCompleted }) => <FormPlaceholder title="Evidencia Uploader" onComplete={onEvidenciasCompleted} />;

// --- Main Component ---

const API_BASE_URL = 'http://localhost:3001';

function PrincipalData() {
    // Hooks for navigation and params, assuming they are provided by a Router context
    const { userId: userIdFromUrl } = useParams() || {}; 
    const navigate = useNavigate() || (() => {});

    const [currentUserId, setCurrentUserId] = useState(userIdFromUrl || null);
    const [completedSteps, setCompletedSteps] = useState({
        user: false,
        conyuge: false,
        dependiente: false,
        ingresos: false,
        planSalud: false,
        pago: false,
        evidencias: false,
    });

    const [asesorId, setAsesorId] = useState(null);
    const [openAccordionIndex, setOpenAccordionIndex] = useState(0);

    const [loadingData, setLoadingData] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [userFormKey, setUserFormKey] = useState(0);

    const markStepCompleted = useCallback((stepName) => {
        setCompletedSteps(prev => ({ ...prev, [stepName]: true }));
        setMessage(`Step "${stepName}" marked as complete.`);
    }, []);

    const clearAllDataStates = useCallback(() => {
        setCurrentUserId(null);
        setCompletedSteps({ user: false, conyuge: false, dependiente: false, ingresos: false, planSalud: false, pago: false, evidencias: false });
        setOpenAccordionIndex(0);
        setMessage('');
        setError('');
        setUserFormKey(prevKey => prevKey + 1);
        if (navigate) navigate('/', { replace: true });
    }, [navigate]);

    useEffect(() => {
        if (userIdFromUrl && userIdFromUrl !== currentUserId) {
            setCurrentUserId(userIdFromUrl);
        } else if (!userIdFromUrl && currentUserId) {
            setCurrentUserId(null);
            clearAllDataStates();
        }
    }, [userIdFromUrl, currentUserId, clearAllDataStates]);

    useEffect(() => {
        try {
            const personalInfoString = localStorage.getItem('personalInfo');
            if (personalInfoString) {
                const personalInfo = JSON.parse(personalInfoString);
                if (personalInfo && personalInfo.id) setAsesorId(personalInfo.id);
            }
        } catch (e) {
            console.error("Failed to parse personalInfo from localStorage", e);
        }
    }, []);

    const handleUserCreated = (userId) => {
        setCurrentUserId(userId);
        markStepCompleted('user');
        if (navigate) navigate(`/registro/${userId}`, { replace: true });
        setOpenAccordionIndex(1);
    };
    const handleUserUpdated = () => {
        markStepCompleted('user');
        setOpenAccordionIndex(1);
    };
    const handleContinueToDependientes = () => {
        markStepCompleted('conyuge');
        setOpenAccordionIndex(2);
    };
    const handleContinueToIngresos = () => {
        markStepCompleted('dependiente');
        setOpenAccordionIndex(3);
    };
    const handleIngresosCompleted = () => {
        markStepCompleted('ingresos');
        setOpenAccordionIndex(4);
    };
    const handlePlanSaludCompleted = () => {
        markStepCompleted('planSalud');
        setOpenAccordionIndex(5);
    };
    const handlePagoCompleted = () => {
        markStepCompleted('pago');
        setOpenAccordionIndex(6);
    };
    const handleEvidenciasCompleted = () => {
        markStepCompleted('evidencias');
    };
    const handleAccordionToggle = (index) => setOpenAccordionIndex(prevIndex => (prevIndex === index ? null : index));

    const allStepsCompleted = Object.values(completedSteps).every(status => status === true);

    const handleSendToAudit = async () => {
        if (!currentUserId || !asesorId) {
            setError("Falta información del usuario o del asesor para enviar a auditoría.");
            return;
        }
        setLoadingData(true);
        try {
            await axios.put(`${API_BASE_URL}/api/usuarios/${currentUserId}`, {
                estado_registro: 'pendiente_auditoria'
            });
            await axios.post(`${API_BASE_URL}/api/audits`, {
                id_usuario: currentUserId,
                id_agente: asesorId,
            });
            alert('Registro enviado a auditoría con éxito.');
            clearAllDataStates();
        } catch (err) {
            console.error("Error al enviar a auditoría:", err);
            setError("Ocurrió un error al enviar el registro a auditoría. Por favor, intente de nuevo.");
        } finally {
            setLoadingData(false);
        }
    };

    const handleSendToFollowUp = async () => {
        if (currentUserId) {
            try {
                await axios.put(`${API_BASE_URL}/api/usuarios/${currentUserId}`, {
                    estado_registro: 'pendiente'
                });
                setMessage('Registro guardado para continuar después.');
                setError('');
                if (navigate) navigate('/');
            } catch (err) {
                console.error("Error al guardar el estado del registro:", err);
                setError('Error al guardar el progreso. Intente de nuevo.');
            }
        }
    };

    if (loadingData) return <div>Cargando datos...</div>;

    return (
        <div>
            <Navbar />
            <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
                <h1>Registro Completo de Datos</h1>
                {message && <div style={{ color: 'green', padding: '10px', background: '#e8f5e9', border: '1px solid green', borderRadius: '4px' }}>{message}</div>}
                {error && <div style={{ color: 'red', padding: '10px', background: '#ffebee', border: '1px solid red', borderRadius: '4px' }}>{error}</div>}

                <Accordion defaultOpenIndex={openAccordionIndex} onToggle={handleAccordionToggle}>
                    <AccordionItem title="1. Datos Personales del Solicitante Principal" isOpen={openAccordionIndex === 0} toggleOpen={() => handleAccordionToggle(0)} showCheck={completedSteps.user}>
                        <UserForm key={userFormKey} onUserCreated={handleUserCreated} onUserUpdated={handleUserUpdated} asesorId={asesorId} />
                    </AccordionItem>
                    <AccordionItem title="2. Datos del Cónyuge" isOpen={openAccordionIndex === 1} toggleOpen={() => handleAccordionToggle(1)} showCheck={completedSteps.conyuge} disabled={!completedSteps.user}>
                        <ConyugeForm onContinueToDependientes={handleContinueToDependientes} />
                    </AccordionItem>
                    <AccordionItem title="3. Dependientes" isOpen={openAccordionIndex === 2} toggleOpen={() => handleAccordionToggle(2)} showCheck={completedSteps.dependiente} disabled={!completedSteps.conyuge}>
                        <DependienteForm onContinueToIngresos={handleContinueToIngresos} />
                    </AccordionItem>
                    <AccordionItem title="4. Ingresos" isOpen={openAccordionIndex === 3} toggleOpen={() => handleAccordionToggle(3)} showCheck={completedSteps.ingresos} disabled={!completedSteps.dependiente}>
                        <IngresoForm onIngresosCompleted={handleIngresosCompleted} />
                    </AccordionItem>
                    <AccordionItem title="5. Plan de Salud" isOpen={openAccordionIndex === 4} toggleOpen={() => handleAccordionToggle(4)} showCheck={completedSteps.planSalud} disabled={!completedSteps.ingresos}>
                        <PlanSaludForm onPlanSaludCompleted={handlePlanSaludCompleted} />
                    </AccordionItem>
                    <AccordionItem title="6. Información de Pago" isOpen={openAccordionIndex === 5} toggleOpen={() => handleAccordionToggle(5)} showCheck={completedSteps.pago} disabled={!completedSteps.planSalud}>
                        <PagoForm onPagoCompleted={handlePagoCompleted} />
                    </AccordionItem>
                    <AccordionItem title="7. Evidencias y Documentos" isOpen={openAccordionIndex === 6} toggleOpen={() => handleAccordionToggle(6)} showCheck={completedSteps.evidencias} disabled={!completedSteps.pago}>
                        <EvidenciaUploader onEvidenciasCompleted={handleEvidenciasCompleted} />
                    </AccordionItem>
                </Accordion>

                <div style={{ textAlign: 'center', marginTop: '30px', marginBottom: '50px' }}>
                    {currentUserId && !allStepsCompleted && (
                        <button onClick={handleSendToFollowUp} style={{ padding: '15px 30px', fontSize: '1.2em', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                            Guardar para Seguimiento
                        </button>
                    )}
                    {allStepsCompleted && (
                        <button onClick={handleSendToAudit} style={{ padding: '15px 30px', fontSize: '1.2em', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                            Enviar a Auditoría
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// In a real setup, you would export the component to be used by your app's router.
// export default PrincipalData;
