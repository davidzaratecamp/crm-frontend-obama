// frontend/src/pages/PrincipalData.jsx
import React, { useState, useEffect, useCallback } from 'react'; // ✅ Importa useCallback
import axios from 'axios';
import Accordion from '../components/Accordion';
import AccordionItem from '../components/AccordionItem';

// Importa todos tus componentes de formulario
import UserForm from '../components/forms/UserForm';
import DependienteForm from '../components/forms/DependienteForm';
import IngresoForm from '../components/forms/IngresoForm';
import PlanSaludForm from '../components/forms/PlanSaludForm';
import PagoForm from '../components/forms/PagoForm';
import EvidenciaUploader from '../components/forms/EvidenciaUploader';
import Navbar from '../components/Navbar'; // Asegúrate de importar Navbar

function PrincipalData() {
    const [currentUserId, setCurrentUserId] = useState(null);
    const [completedSteps, setCompletedSteps] = useState({});

    // Estado para controlar qué acordeón está ABIERTO actualmente
    const [openAccordionIndex, setOpenAccordionIndex] = useState(0);

    // ESTADOS PARA ALMACENAR LOS DATOS CARGADOS PARA EDICIÓN
    const [userDataForEdit, setUserDataForEdit] = useState(null);
    const [dependientesDataForEdit, setDependientesDataForEdit] = useState([]);
    const [ingresosDataForEdit, setIngresosDataForEdit] = useState(null);
    const [planSaludDataForEdit, setPlanSaludDataForEdit] = useState(null);
    const [pagoDataForEdit, setPagoDataForEdit] = useState(null);
    const [evidenciasDataForEdit, setEvidenciasDataForEdit] = useState([]);

    const [loadingData, setLoadingData] = useState(false); // Para mostrar un spinner de carga
    const [dataError, setDataError] = useState(null); // Para errores de carga de datos


    const markStepCompleted = (stepName) => {
        setCompletedSteps(prev => ({ ...prev, [stepName]: true }));
    };

    // Callback para cuando el usuario principal es creado/actualizado
    const handleUserCreated = (userId) => {
        setCurrentUserId(userId);
        markStepCompleted('user');
        setOpenAccordionIndex(1); // Abrir el acordeón de Dependientes
        setUserDataForEdit(null);
    };

    // Callback cuando un usuario es ACTUALIZADO exitosamente
    const handleUserUpdated = () => {
        setOpenAccordionIndex(null);
        setUserDataForEdit(null);
        markStepCompleted('user');
    };

    // Cuando un dependiente es añadido/actualizado/eliminado
    const handleDependienteChanged = () => {
        if (currentUserId && openAccordionIndex === 1) {
            fetchDependientesDataForEdit();
        } else if (currentUserId) {
            // If accordion is not open, data will be fetched when it opens
        }
        markStepCompleted('dependiente');
    };

    const handleDependienteFormSubmitted = () => {
        fetchDependientesDataForEdit();
    };

    // Callback para el botón "Continuar a Ingresos" en DependienteForm
    const handleContinueToIngresos = () => {
        setOpenAccordionIndex(2); // Abrir Ingresos
    };

    const handleIngresosCompleted = () => {
        markStepCompleted('ingresos');
        setOpenAccordionIndex(3); // Abrir Plan de Salud
        setIngresosDataForEdit(null);
    };
    const handleIngresosUpdated = () => {
        setOpenAccordionIndex(null);
        setIngresosDataForEdit(null);
        markStepCompleted('ingresos');
    };


    const handlePlanSaludCompleted = () => {
        markStepCompleted('planSalud');
        setOpenAccordionIndex(4); // Abrir Información de Pago
        setPlanSaludDataForEdit(null);
    };
    const handlePlanSaludUpdated = () => {
        setOpenAccordionIndex(null);
        setPlanSaludDataForEdit(null);
        markStepCompleted('planSalud');
    };


    const handlePagoCompleted = () => {
        markStepCompleted('pago');
        setOpenAccordionIndex(5); // Abrir Evidencias
        setPagoDataForEdit(null);
    };
    const handlePagoUpdated = () => {
        setOpenAccordionIndex(null);
        setPagoDataForEdit(null);
        markStepCompleted('pago');
    };


    const handleEvidenciasCompleted = () => {
        markStepCompleted('evidencias');
        alert('¡Todos los datos han sido registrados con éxito!');
        setOpenAccordionIndex(null);
        setEvidenciasDataForEdit([]);
    };
    const handleEvidenciasUpdated = () => {
        setOpenAccordionIndex(null);
        setEvidenciasDataForEdit([]);
        markStepCompleted('evidencias');
    };


    // Función para manejar la apertura/cierre de los acordeones
    const handleAccordionToggle = (index) => {
        setOpenAccordionIndex(prevIndex => (prevIndex === index ? null : index));
    };

    // -----------------------------------------------------
    // LÓGICA DE CARGA DE DATOS PARA EDICIÓN (Fetching)
    // -----------------------------------------------------

    // --- Cargar datos del USUARIO PRINCIPAL ---
    useEffect(() => {
        if (currentUserId && openAccordionIndex === 0 && userDataForEdit === null) {
            setLoadingData(true);
            setDataError(null);
            axios.get(`http://10.255.255.85:3001/api/usuarios/${currentUserId}`)
                .then(response => {
                    setUserDataForEdit(response.data);
                })
                .catch(error => {
                    console.error("Error cargando datos del usuario principal para edición:", error);
                    setDataError("No se pudieron cargar los datos del usuario.");
                    setUserDataForEdit(null);
                })
                .finally(() => {
                    setLoadingData(false);
                });
        } else if (openAccordionIndex !== 0 && userDataForEdit !== null) {
            setUserDataForEdit(null);
        }
    }, [currentUserId, openAccordionIndex, userDataForEdit]);


    // --- Cargar datos de DEPENDIENTES ---
    // ✅ wrapped in useCallback
    const fetchDependientesDataForEdit = useCallback(async () => {
        if (currentUserId) {
            setLoadingData(true);
            setDataError(null);
            try {
                const url = `http://10.255.255.85:3001/api/${currentUserId}/dependientes`;
                const response = await axios.get(url);
                setDependientesDataForEdit(response.data);
            } catch (error) {
                console.error("Error cargando datos de dependientes para edición:", error);
                setDataError("No se pudieron cargar los datos de los dependientes.");
                setDependientesDataForEdit([]);
            } finally {
                setLoadingData(false);
            }
        } else {
            setDependientesDataForEdit([]);
        }
    }, [currentUserId]); // ✅ add currentUserId to dependencies


    useEffect(() => {
        if (currentUserId && openAccordionIndex === 1 && dependientesDataForEdit.length === 0) {
            fetchDependientesDataForEdit();
        } else if (openAccordionIndex !== 1 && dependientesDataForEdit.length > 0) {
            setDependientesDataForEdit([]);
        }
    }, [currentUserId, openAccordionIndex, dependientesDataForEdit.length, fetchDependientesDataForEdit]); // ✅ add fetchDependientesDataForEdit to dependencies


    // --- Cargar datos de INGRESOS (principal y dependientes) ---
    useEffect(() => {
        if (currentUserId && openAccordionIndex === 2 && ingresosDataForEdit === null) {
            setLoadingData(true);
            setDataError(null);
            axios.get(`http://10.255.255.85:3001/api/ingresos/Usuario/${currentUserId}`)
                .then(response => {
                    setIngresosDataForEdit(response.data.length > 0 ? response.data[0] : null);
                })
                .catch(error => {
                    console.error("Error cargando ingresos del usuario:", error);
                    setDataError("No se pudieron cargar los datos de ingresos.");
                    setIngresosDataForEdit(null);
                })
                .finally(() => {
                    setLoadingData(false);
                });
        } else if (openAccordionIndex !== 2 && ingresosDataForEdit !== null) {
            setIngresosDataForEdit(null);
        }
    }, [currentUserId, openAccordionIndex, ingresosDataForEdit]);


    // --- Cargar datos de PLAN DE SALUD ---
    useEffect(() => {
        if (currentUserId && openAccordionIndex === 3 && planSaludDataForEdit === null) {
            setLoadingData(true);
            setDataError(null);
            axios.get(`http://10.255.255.85:3001/api/planes_salud/usuario/${currentUserId}`)
                .then(response => {
                    setPlanSaludDataForEdit(response.data.length > 0 ? response.data[0] : null);
                })
                .catch(error => {
                    console.error("Error cargando plan de salud:", error);
                    setDataError("No se pudieron cargar los datos del plan de salud.");
                    setPlanSaludDataForEdit(null);
                })
                .finally(() => {
                    setLoadingData(false);
                });
        } else if (openAccordionIndex !== 3 && planSaludDataForEdit !== null) {
            setPlanSaludDataForEdit(null);
        }
    }, [currentUserId, openAccordionIndex, planSaludDataForEdit]);


    // --- Cargar datos de INFORMACIÓN DE PAGO ---
    useEffect(() => {
        if (currentUserId && openAccordionIndex === 4 && pagoDataForEdit === null) {
            setLoadingData(true);
            setDataError(null);
           axios.get(`http://10.255.255.85:3001/api/usuario/${currentUserId}`)
                .then(response => {
                    setPagoDataForEdit(response.data.length > 0 ? response.data[0] : null);
                })
                .catch(error => {
                    console.error("Error cargando información de pago:", error);
                    setDataError("No se pudieron cargar los datos de pago.");
                    setPagoDataForEdit(null);
                })
                .finally(() => {
                    setLoadingData(false);
                });
        } else if (openAccordionIndex !== 4 && pagoDataForEdit !== null) {
            setPagoDataForEdit(null);
        }
    }, [currentUserId, openAccordionIndex, pagoDataForEdit]);


    // --- Cargar datos de EVIDENCIAS ---
    useEffect(() => {
        if (currentUserId && openAccordionIndex === 5 && evidenciasDataForEdit.length === 0) {
            setLoadingData(true);
            setDataError(null);
            axios.get(`http://10.255.255.85:3001/api/${currentUserId}/evidencias`)
                .then(response => {
                    setEvidenciasDataForEdit(response.data);
                })
                .catch(error => {
                    console.error("Error cargando evidencias:", error);
                    setDataError("No se pudieron cargar las evidencias.");
                    setEvidenciasDataForEdit([]);
                })
                .finally(() => {
                    setLoadingData(false);
                });
        } else if (openAccordionIndex !== 5 && evidenciasDataForEdit.length > 0) {
            setEvidenciasDataForEdit([]);
        }
    }, [currentUserId, openAccordionIndex, evidenciasDataForEdit.length]);


    // ✅ Lógica para determinar si todos los pasos están completados
    const allStepsCompleted = Object.keys(completedSteps).length === 6 && // Ensure all step names are present
                              Object.values(completedSteps).every(status => status === true); // Ensure all are true

    // ✅ Función para reiniciar todos los formularios
    const handleResetForms = () => {
        setCurrentUserId(null);
        setCompletedSteps({});
        setOpenAccordionIndex(0); // Abrir el primer acordeón por defecto
        setUserDataForEdit(null);
        setDependientesDataForEdit([]);
        setIngresosDataForEdit(null);
        setPlanSaludDataForEdit(null);
        setPagoDataForEdit(null);
        setEvidenciasDataForEdit([]);
        setMessage(''); // Clear any success/error messages from previous user
        setError('');
        // You might want to also add logic to clear any messages/errors from child components
    };

    // Mensajes de carga y error globales
    if (loadingData) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                Cargando datos...
                {/* Puedes añadir un spinner CSS aquí */}
            </div>
        );
    }

    if (dataError) {
        return (
            <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
                Error: {dataError} Por favor, intente de nuevo.
            </div>
        );
    }


    return (
        <div>
            <Navbar />
            <h1>Registro Completo de Datos</h1>

            <Accordion defaultOpenIndex={openAccordionIndex} onToggle={handleAccordionToggle}>

                <AccordionItem
                    title="1. Datos Personales del Solicitante Principal"
                    isOpen={openAccordionIndex === 0}
                    toggleOpen={() => handleAccordionToggle(0)}
                    showCheck={completedSteps.user}
                >
                    <UserForm
                        onUserCreated={handleUserCreated}
                        onUserUpdated={handleUserUpdated}
                        initialData={userDataForEdit}
                        userIdForUpdate={currentUserId}
                    />
                    {currentUserId && openAccordionIndex === 0 && (
                        <button onClick={() => setOpenAccordionIndex(1)} style={{ marginTop: '20px' }}>Saltar a Dependientes</button>
                    )}
                </AccordionItem>

                <AccordionItem
                    title="2. Dependientes"
                    isOpen={openAccordionIndex === 1}
                    toggleOpen={() => handleAccordionToggle(1)}
                    showCheck={completedSteps.dependiente}
                >
                    {currentUserId ? (
                        <>
                            <DependienteForm
                                userId={currentUserId}
                                onDependienteAdded={handleDependienteChanged}
                                onDependienteFormSubmitted={handleDependienteFormSubmitted}
                                initialData={dependientesDataForEdit}
                                onContinueToIngresos={handleContinueToIngresos}
                            />
                        </>
                    ) : (
                        <p>Por favor, complete los datos del solicitante principal primero para añadir dependientes.</p>
                    )}
                </AccordionItem>

                <AccordionItem
                    title="3. Ingresos (Solicitante y Dependientes)"
                    isOpen={openAccordionIndex === 2}
                    toggleOpen={() => handleAccordionToggle(2)}
                    showCheck={completedSteps.ingresos}
                >
                    {currentUserId ? (
                        <IngresoForm
                            userId={currentUserId}
                            onIngresosCompleted={handleIngresosCompleted}
                            onIngresosUpdated={handleIngresosUpdated}
                            initialData={ingresosDataForEdit}
                        />
                    ) : (
                        <p>Por favor, complete los datos anteriores primero.</p>
                    )}
                </AccordionItem>

                <AccordionItem
                    title="4. Plan de Salud"
                    isOpen={openAccordionIndex === 3}
                    toggleOpen={() => handleAccordionToggle(3)}
                    showCheck={completedSteps.planSalud}
                >
                    {currentUserId ? (
                        <PlanSaludForm
                            userId={currentUserId}
                            onPlanSaludCompleted={handlePlanSaludCompleted}
                            onPlanSaludUpdated={handlePlanSaludUpdated}
                            initialData={planSaludDataForEdit}
                        />
                    ) : (
                        <p>Por favor, complete los datos anteriores primero.</p>
                    )}
                </AccordionItem>

                <AccordionItem
                    title="5. Información de Pago"
                    isOpen={openAccordionIndex === 4}
                    toggleOpen={() => handleAccordionToggle(4)}
                    showCheck={completedSteps.pago}
                >
                    {currentUserId ? (
                        <PagoForm
                            userId={currentUserId}
                            onPagoCompleted={handlePagoCompleted}
                            onPagoUpdated={handlePagoUpdated}
                            initialData={pagoDataForEdit}
                        />
                    ) : (
                        <p>Por favor, complete los datos anteriores primero.</p>
                    )}
                </AccordionItem>

                <AccordionItem
                    title="6. Evidencias y Documentos"
                    isOpen={openAccordionIndex === 5}
                    toggleOpen={() => handleAccordionToggle(5)}
                    showCheck={completedSteps.evidencias}
                >
                    {currentUserId ? (
                        <EvidenciaUploader
                            userId={currentUserId}
                            onEvidenciasCompleted={handleEvidenciasCompleted}
                            onEvidenciasUpdated={handleEvidenciasUpdated}
                            initialData={evidenciasDataForEdit}
                        />
                    ) : (
                        <p>Por favor, complete los datos anteriores primero.</p>
                    )}
                </AccordionItem>

            </Accordion>

            {/* ✅ Botón "Comenzar Nuevo Usuario" */}
            {allStepsCompleted && (
                <div style={{ textAlign: 'center', marginTop: '30px', marginBottom: '50px' }}>
                    <button
                        onClick={handleResetForms}
                        style={{
                            padding: '15px 30px',
                            fontSize: '1.2em',
                            backgroundColor: '#28a745', /* Green color for positive action */
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                            transition: 'background-color 0.3s ease, transform 0.2s ease',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#218838'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#28a745'}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        Comenzar Nuevo Usuario
                    </button>
                </div>
            )}
        </div>
    );
}

export default PrincipalData;