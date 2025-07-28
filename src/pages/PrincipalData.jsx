import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Accordion from '../components/Accordion';
import AccordionItem from '../components/AccordionItem';

import UserForm from '../components/forms/UserForm';
import ConyugeForm from '../components/forms/ConyugeForm'; // Importar el nuevo formulario
import DependienteForm from '../components/forms/DependienteForm';
import IngresoForm from '../components/forms/IngresoForm';
import PlanSaludForm from '../components/forms/PlanSaludForm';
import PagoForm from '../components/forms/PagoForm';
import EvidenciaUploader from '../components/forms/EvidenciaUploader';
import Navbar from '../components/Navbar';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

function PrincipalData() {
    const { userId: userIdFromUrl } = useParams();
    const navigate = useNavigate();

    const [currentUserId, setCurrentUserId] = useState(userIdFromUrl || null);
    // Inicializar completedSteps con todos los pasos en false
    const [completedSteps, setCompletedSteps] = useState({
        user: false,
        conyuge: false, // NUEVO PASO
        dependiente: false,
        ingresos: false,
        planSalud: false,
        pago: false,
        evidencias: false,
    });

    // NUEVO ESTADO para el conyugue
    const [conyugeNotApplicable, setConyugeNotApplicable] = useState(false);

    // Ajustar el índice inicial a 0
    const [openAccordionIndex, setOpenAccordionIndex] = useState(0);

    const [userDataForEdit, setUserDataForEdit] = useState(null);
    const [conyugeDataForEdit, setConyugeDataForEdit] = useState(null); // NUEVO ESTADO para el cónyuge
    const [dependientesDataForEdit, setDependientesDataForEdit] = useState([]);
    const [ingresosDataForEdit, setIngresosDataForEdit] = useState(null);
    const [planSaludDataForEdit, setPlanSaludDataForEdit] = useState(null);
    const [pagoDataForEdit, setPagoDataForEdit] = useState(null);
    const [evidenciasDataForEdit, setEvidenciasDataForEdit] = useState([]);

    const [loadingData, setLoadingData] = useState(false);
    const [dataError, setDataError] = useState(null);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [userFormKey, setUserFormKey] = useState(0);

    // --- Funciones de Utilidad ---
    const markStepCompleted = useCallback((stepName) => {
        setCompletedSteps(prev => ({ ...prev, [stepName]: true }));
    }, []);

    const clearAllDataStates = useCallback(() => {
        setUserDataForEdit(null);
        setConyugeDataForEdit(null); // Limpiar cónyuge
        setDependientesDataForEdit([]);
        setIngresosDataForEdit(null);
        setPlanSaludDataForEdit(null);
        setPagoDataForEdit(null);
        setEvidenciasDataForEdit([]);
        // Resetear completedSteps a su estado inicial
         setCompletedSteps({
        user: false,
        conyuge: false,
        dependiente: false,
        ingresos: false,
        planSalud: false,
        pago: false,
        evidencias: false,
    });
    setConyugeNotApplicable(false); // Reiniciar este estado
    setOpenAccordionIndex(0);
    
        setOpenAccordionIndex(0);
        setMessage('');
        setError('');
        setUserFormKey(prevKey => prevKey + 1);
    }, []);

    // --- Lógica para manejar el userId de la URL y el estado interno ---
    useEffect(() => {
        if (userIdFromUrl && userIdFromUrl !== currentUserId) {
            setCurrentUserId(userIdFromUrl);
            clearAllDataStates();
        } else if (!userIdFromUrl && currentUserId) {
            setCurrentUserId(null);
            clearAllDataStates();
        }
    }, [userIdFromUrl, currentUserId, clearAllDataStates]);

    // --- Cargar datos del USUARIO PRINCIPAL (adaptado para userIdFromUrl) ---
    const fetchUserDataForEdit = useCallback(async () => {
        if (currentUserId) {
            setLoadingData(true);
            setDataError(null);
            try {
                const response = await axios.get(`${API_BASE_URL}/api/usuarios/${currentUserId}`);
                setUserDataForEdit(response.data);
                if (response.data && response.data.id) {
                    markStepCompleted('user');
                } else {
                    setCompletedSteps(prev => ({ ...prev, user: false }));
                }
            } catch (error) {
                console.error("Error cargando datos del usuario principal para edición:", error);
                setDataError("No se pudieron cargar los datos del usuario. El registro podría no existir o hubo un error.");
                setUserDataForEdit(null);
                setCurrentUserId(null);
                navigate('/', { replace: true });
            } finally {
                setLoadingData(false);
            }
        } else {
            setUserDataForEdit(null);
            setCompletedSteps(prev => ({ ...prev, user: false }));
        }
    }, [currentUserId, navigate, markStepCompleted]);

    useEffect(() => {
        if (currentUserId && userDataForEdit === null) {
            fetchUserDataForEdit();
        } else if (!currentUserId && userDataForEdit !== null) {
            setUserDataForEdit(null);
            setCompletedSteps(prev => ({ ...prev, user: false }));
        }
    }, [currentUserId, userDataForEdit, fetchUserDataForEdit]);

    // --- Callbacks de formularios ---

    const handleUserCreated = async (userId) => {
        setCurrentUserId(userId);
        markStepCompleted('user');
        setMessage('Datos del solicitante principal creados con éxito.');
        setError('');
        navigate(`/registro/${userId}`, { replace: true });
        setOpenAccordionIndex(null);
        setTimeout(() => {
            setOpenAccordionIndex(1); // Abre el acordeón de Cónyuge
        }, 300);
    };

    const handleUserUpdated = async () => {
        markStepCompleted('user');
        setMessage('Datos del solicitante principal actualizados con éxito.');
        setError('');
        setOpenAccordionIndex(null);
        setTimeout(() => {
            setOpenAccordionIndex(1); // Abre el acordeón de Cónyuge
        }, 300);
        await fetchUserDataForEdit();
        if (currentUserId) {
            try {
                await axios.put(`${API_BASE_URL}/api/usuarios/${currentUserId}`, {
                    estado_registro: 'nuevo'
                });
            } catch (err) {
                console.error("Error al actualizar estado_registro:", err);
            }
        }
    };

    // --- NUEVOS CALLBACKS PARA EL CÓNYUGE ---
    const handleConyugeChanged = () => {
        if (currentUserId) {
            fetchConyugeDataForEdit(); // Recargar datos del cónyuge
        }
    };

    // PrincipalData.jsx

const handleContinueToDependientes = (noConyuge = false) => { // Añade el parámetro
    if (noConyuge) {
        setConyugeNotApplicable(true); // Marca que el cónyuge no aplica
        markStepCompleted('conyuge'); // Marca el paso como completado
        setConyugeDataForEdit(null); // Asegúrate de que no haya datos de cónyuge
        setMessage('Sección de cónyuge completada.');
    } else {
        // Esto solo ocurriría si el ConyugeForm tuviera un botón "Continuar" después de guardar un cónyuge
        // o si queremos que la mera existencia de un cónyuge en initialData lo marque como completado.
        // Por ahora, asumimos que si se cargó un cónyuge, fetchConyugeDataForEdit lo manejará.
        // Si el cónyuge se creó/actualizó, el handleSubmit de DependienteForm llama a onContinueToIngresos,
        // pero ese ya llama a onConyugeChanged (que es onDependienteAdded)
        // Y luego fetchConyugeDataForEdit se encarga de marcarlo si hay datos.
        setMessage('Datos del cónyuge guardados con éxito.');
        // Puedes llamar markStepCompleted('conyuge') aquí también si lo deseas,
        // pero fetchConyugeDataForEdit ya lo hace si hay datos.
    }
    setError('');
    setOpenAccordionIndex(null);
    setTimeout(() => {
        setOpenAccordionIndex(2); // Abre el acordeón de Dependientes
    }, 300);
};

    const handleDependienteChanged = () => {
        if (currentUserId) {
            fetchDependientesDataForEdit(); // Recargar datos de dependientes
        }
    };

    // Este callback ya no es necesario ya que el DependienteForm tiene su propio manejo de "continuar"
    // const handleDependienteFormSubmitted = () => { ... }

    const handleContinueToIngresos = () => {
        markStepCompleted('dependiente');
        setOpenAccordionIndex(3); // Abre ingresos (índice 3 ahora)
        setMessage('Sección de dependientes completada.');
        setError('');
    };

    const handleIngresosCompleted = async () => {
        markStepCompleted('ingresos');
        setOpenAccordionIndex(null);
        setTimeout(() => setOpenAccordionIndex(4), 300); // Abre Plan de Salud (índice 4 ahora)
        setIngresosDataForEdit(null);
        setMessage('Datos de ingresos completados con éxito.');
        setError('');
        if (currentUserId) {
            try {
                await axios.put(`${API_BASE_URL}/api/usuarios/${currentUserId}`, {
                    estado_registro: 'pendiente'
                });
            } catch (err) {
                console.error("Error al actualizar estado_registro:", err);
            }
        }
    };
    const handleIngresosUpdated = async () => {
        markStepCompleted('ingresos');
        setOpenAccordionIndex(null);
        setTimeout(() => setOpenAccordionIndex(4), 300); // Abre Plan de Salud (índice 4 ahora)
        setIngresosDataForEdit(null);
        setMessage('Datos de ingresos actualizados con éxito.');
        setError('');
        if (currentUserId && openAccordionIndex === 3) { // Ajustado el índice
             axios.get(`${API_BASE_URL}/api/ingresos/Usuario/${currentUserId}`)
                .then(response => {
                    setIngresosDataForEdit(response.data.length > 0 ? response.data[0] : null);
                })
                .catch(error => console.error("Error recargando ingresos:", error));
        }
    };

    const handlePlanSaludCompleted = async () => {
        markStepCompleted('planSalud');
        setOpenAccordionIndex(null);
        setTimeout(() => setOpenAccordionIndex(5), 300); // Abre Pago (índice 5 ahora)
        setPlanSaludDataForEdit(null);
        setMessage('Datos de plan de salud completados con éxito.');
        setError('');
        if (currentUserId) {
            try {
                await axios.put(`${API_BASE_URL}/api/usuarios/${currentUserId}`, { estado_registro: 'pendiente' });
            } catch (err) { console.error("Error al actualizar estado_registro:", err); }
        }
    };
    const handlePlanSaludUpdated = async () => {
        markStepCompleted('planSalud');
        setOpenAccordionIndex(null);
        setTimeout(() => setOpenAccordionIndex(5), 300); // Abre Pago (índice 5 ahora)
        setPlanSaludDataForEdit(null);
        setMessage('Datos de plan de salud actualizados con éxito.');
        setError('');
        if (currentUserId && openAccordionIndex === 4) { // Ajustado el índice
            axios.get(`${API_BASE_URL}/api/planes_salud/usuario/${currentUserId}`)
                .then(response => {
                    setPlanSaludDataForEdit(response.data.length > 0 ? response.data[0] : null);
                })
                .catch(error => console.error("Error recargando plan de salud:", error));
        }
    };

    const handlePagoCompleted = async () => {
        markStepCompleted('pago');
        setOpenAccordionIndex(null);
        setTimeout(() => setOpenAccordionIndex(6), 300); // Abre Evidencias (índice 6 ahora)
        setPagoDataForEdit(null);
        setMessage('Información de pago completada con éxito.');
        setError('');
        if (currentUserId) {
            try {
                await axios.put(`${API_BASE_URL}/api/usuarios/${currentUserId}`, { estado_registro: 'pendiente' });
            } catch (err) { console.error("Error al actualizar estado_registro:", err); }
        }
    };
    const handlePagoUpdated = async () => {
        markStepCompleted('pago');
        setOpenAccordionIndex(null);
        setTimeout(() => setOpenAccordionIndex(6), 300); // Abre Evidencias (índice 6 ahora)
        setPagoDataForEdit(null);
        setMessage('Información de pago actualizada con éxito.');
        setError('');
        if (currentUserId && openAccordionIndex === 5) { // Ajustado el índice
            axios.get(`${API_BASE_URL}/api/usuario/${currentUserId}`)
                .then(response => {
                    setPagoDataForEdit(response.data.length > 0 ? response.data[0] : null);
                })
                .catch(error => console.error("Error recargando pago:", error));
        }
    };

    const handleEvidenciasCompleted = async () => {
        markStepCompleted('evidencias');
        alert('¡Todos los datos han sido registrados con éxito!');
        setOpenAccordionIndex(null);
        setEvidenciasDataForEdit([]);
        setMessage('Todas las evidencias han sido cargadas y el registro está completo.');
        setError('');

        if (currentUserId) {
            try {
                await axios.put(`${API_BASE_URL}/api/usuarios/${currentUserId}`, {
                    estado_registro: 'completado'
                });
            } catch (err) {
                console.error("Error al marcar registro como completado:", err);
            }
        }
    };
    const handleEvidenciasUpdated = async () => {
        markStepCompleted('evidencias');
        setOpenAccordionIndex(null);
        setEvidenciasDataForEdit([]);
        setMessage('Evidencias actualizadas con éxito.');
        setError('');
        if (currentUserId && openAccordionIndex === 6) { // Ajustado el índice
            axios.get(`${API_BASE_URL}/api/${currentUserId}/evidencias`)
                .then(response => {
                    setEvidenciasDataForEdit(response.data);
                })
                .catch(error => console.error("Error recargando evidencias:", error));
        }
    };

    const handleAccordionToggle = (index) => {
        setOpenAccordionIndex(prevIndex => (prevIndex === index ? null : index));
    };


 // --- Cargar datos del CÓNYUGE --- (NUEVA FUNCIÓN)
 // PrincipalData.jsx

const fetchConyugeDataForEdit = useCallback(async () => {
    if (currentUserId) {
        setLoadingData(true);
        setDataError(null);
        try {
            const url = `${API_BASE_URL}/api/dependientes/usuario/${currentUserId}/parentesco/Cónyuge`;
            const response = await axios.get(url);
            const conyuge = response.data;

            setConyugeDataForEdit(conyuge);

            // Lógica modificada:
            if (conyuge) {
                markStepCompleted('conyuge');
                setConyugeNotApplicable(false); // Si hay cónyuge, no aplica el "no tiene"
            } else {
                // Si no hay cónyuge en la DB, solo marcamos como completado
                // si el usuario ya había declarado "no tiene cónyuge" previamente.
                if (conyugeNotApplicable) {
                    markStepCompleted('conyuge');
                } else {
                    // Si no hay cónyuge y tampoco se declaró "no aplica", entonces no está completado.
                    setCompletedSteps(prev => ({ ...prev, conyuge: false }));
                }
            }
        } catch (error) {
            console.error("Error cargando datos del cónyuge para edición:", error);
            setDataError("No se pudieron cargar los datos del cónyuge. El registro podría no existir o hubo un error.");
            setConyugeDataForEdit(null);
            // Si hay un error, el paso no está completado a menos que se haya declarado "no aplica"
            if (conyugeNotApplicable) {
                 markStepCompleted('conyuge'); // A pesar del error de carga, si se declaró "no aplica", se mantiene
            } else {
                setCompletedSteps(prev => ({ ...prev, conyuge: false }));
            }
        } finally {
            setLoadingData(false);
        }
    } else {
        setConyugeDataForEdit(null);
        // Si no hay currentUserId, y no se había declarado "no aplica", el paso no está completado.
        if (!conyugeNotApplicable) {
            setCompletedSteps(prev => ({ ...prev, conyuge: false }));
        }
    }
}, [currentUserId, markStepCompleted, setCompletedSteps, conyugeNotApplicable]); // Añade conyugeNotApplicable aquí


    // Disparar carga de datos del cónyuge cuando se abre el acordeón o cambia el userId
    useEffect(() => {
        // Cargar SOLO si el acordeón está abierto y no hay datos cargados
        if (openAccordionIndex === 1 && currentUserId && conyugeDataForEdit === null) {
            fetchConyugeDataForEdit();
        } else if (openAccordionIndex !== 1 && conyugeDataForEdit !== null) {
            // Si el acordeón se cierra y hay datos, limpiar para forzar recarga al reabrir
            setConyugeDataForEdit(null);
        }
    }, [currentUserId, openAccordionIndex, conyugeDataForEdit, fetchConyugeDataForEdit]);


    // --- Cargar datos de DEPENDIENTES --- (ahora en índice 2)
    const fetchDependientesDataForEdit = useCallback(async () => {
        if (currentUserId) {
            setLoadingData(true);
            setDataError(null);
            try {
                // Excluir el cónyuge de la lista de dependientes generales si es necesario en el backend
                const url = `${API_BASE_URL}/api/${currentUserId}/dependientes/sin-conyuge`; // Puedes necesitar una ruta así
                const response = await axios.get(url);
                setDependientesDataForEdit(response.data);
                if (response.data && response.data.length > 0) {
                    markStepCompleted('dependiente');
                } else {
                    setCompletedSteps(prev => ({ ...prev, dependiente: false }));
                }
            } catch (error) {
                console.error("Error cargando datos de dependientes para edición:", error);
                setDataError("No se pudieron cargar los datos de los dependientes.");
                setDependientesDataForEdit([]);
                setCompletedSteps(prev => ({ ...prev, dependiente: false }));
            } finally {
                setLoadingData(false);
            }
        } else {
            setDependientesDataForEdit([]);
            setCompletedSteps(prev => ({ ...prev, dependiente: false }));
        }
    }, [currentUserId, markStepCompleted]);

    useEffect(() => {
        // Ajustar el índice para dependientes
        if (openAccordionIndex === 2 && currentUserId && dependientesDataForEdit.length === 0) {
            fetchDependientesDataForEdit();
        } else if (openAccordionIndex !== 2 && dependientesDataForEdit.length > 0) {
            setDependientesDataForEdit([]);
        }
    }, [currentUserId, openAccordionIndex, dependientesDataForEdit.length, fetchDependientesDataForEdit]);


    // --- Cargar datos de INGRESOS (principal y dependientes) --- (ahora en índice 3)
    useEffect(() => {
        if (currentUserId && openAccordionIndex === 3 && ingresosDataForEdit === null) {
            setLoadingData(true);
            setDataError(null);
            axios.get(`${API_BASE_URL}/api/ingresos/Usuario/${currentUserId}`)
                .then(response => {
                    setIngresosDataForEdit(response.data.length > 0 ? response.data[0] : null);
                    if (response.data.length > 0) {
                        markStepCompleted('ingresos');
                    } else {
                        setCompletedSteps(prev => ({ ...prev, ingresos: false }));
                    }
                })
                .catch(error => {
                    console.error("Error cargando ingresos del usuario:", error);
                    setDataError("No se pudieron cargar los datos de ingresos.");
                    setIngresosDataForEdit(null);
                    setCompletedSteps(prev => ({ ...prev, ingresos: false }));
                })
                .finally(() => {
                    setLoadingData(false);
                });
        } else if (openAccordionIndex !== 3 && ingresosDataForEdit !== null) {
            setIngresosDataForEdit(null);
        }
    }, [currentUserId, openAccordionIndex, ingresosDataForEdit, markStepCompleted]);

    // --- Cargar datos de PLAN DE SALUD --- (ahora en índice 4)
    useEffect(() => {
        if (currentUserId && openAccordionIndex === 4 && planSaludDataForEdit === null) {
            setLoadingData(true);
            setDataError(null);
            axios.get(`${API_BASE_URL}/api/planes_salud/usuario/${currentUserId}`)
                .then(response => {
                    setPlanSaludDataForEdit(response.data.length > 0 ? response.data[0] : null);
                    if (response.data.length > 0) {
                        markStepCompleted('planSalud');
                    } else {
                        setCompletedSteps(prev => ({ ...prev, planSalud: false }));
                    }
                })
                .catch(error => {
                    console.error("Error cargando plan de salud:", error);
                    setDataError("No se pudieron cargar los datos del plan de salud.");
                    setPlanSaludDataForEdit(null);
                    setCompletedSteps(prev => ({ ...prev, planSalud: false }));
                })
                .finally(() => {
                    setLoadingData(false);
                });
        } else if (openAccordionIndex !== 4 && planSaludDataForEdit !== null) {
            setPlanSaludDataForEdit(null);
        }
    }, [currentUserId, openAccordionIndex, planSaludDataForEdit, markStepCompleted]);

    // --- Cargar datos de INFORMACIÓN DE PAGO --- (ahora en índice 5)
    useEffect(() => {
        if (currentUserId && openAccordionIndex === 5 && pagoDataForEdit === null) {
            setLoadingData(true);
            setDataError(null);
            axios.get(`${API_BASE_URL}/api/usuario/${currentUserId}`)
                .then(response => {
                    setPagoDataForEdit(response.data.length > 0 ? response.data[0] : null);
                    if (response.data.length > 0) {
                        markStepCompleted('pago');
                    } else {
                        setCompletedSteps(prev => ({ ...prev, pago: false }));
                    }
                })
                .catch(error => {
                    console.error("Error cargando información de pago:", error);
                    setDataError("No se pudieron cargar los datos de pago.");
                    setPagoDataForEdit(null);
                    setCompletedSteps(prev => ({ ...prev, pago: false }));
                })
                .finally(() => {
                    setLoadingData(false);
                });
        } else if (openAccordionIndex !== 5 && pagoDataForEdit !== null) {
            setPagoDataForEdit(null);
        }
    }, [currentUserId, openAccordionIndex, pagoDataForEdit, markStepCompleted]);

    // --- Cargar datos de EVIDENCIAS --- (ahora en índice 6)
    useEffect(() => {
        if (currentUserId && openAccordionIndex === 6 && evidenciasDataForEdit.length === 0) {
            setLoadingData(true);
            setDataError(null);
            axios.get(`${API_BASE_URL}/api/${currentUserId}/evidencias`)
                .then(response => {
                    setEvidenciasDataForEdit(response.data);
                    if (response.data.length > 0) {
                        markStepCompleted('evidencias');
                    } else {
                        setCompletedSteps(prev => ({ ...prev, evidencias: false }));
                    }
                })
                .catch(error => {
                    console.error("Error cargando evidencias:", error);
                    setDataError("No se pudieron cargar las evidencias.");
                    setEvidenciasDataForEdit([]);
                    setCompletedSteps(prev => ({ ...prev, evidencias: false }));
                })
                .finally(() => {
                    setLoadingData(false);
                });
        } else if (openAccordionIndex !== 6 && evidenciasDataForEdit.length > 0) {
            setEvidenciasDataForEdit([]);
        }
    }, [currentUserId, openAccordionIndex, evidenciasDataForEdit.length, markStepCompleted]);


    // Lógica para determinar si todos los pasos están completados
    const allStepsCompleted = Object.keys(completedSteps).length === 7 && // Ahora son 7 pasos
                              Object.values(completedSteps).every(status => status === true);

    const handleResetForms = () => {
        clearAllDataStates();
        setCurrentUserId(null);
        navigate('/', { replace: true });
        alert('Se ha comenzado un nuevo registro.');
    };

    if (loadingData) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                Cargando datos...
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

            {message && <div style={{ color: 'green', textAlign: 'center', margin: '10px 0' }}>{message}</div>}
            {error && <div style={{ color: 'red', textAlign: 'center', margin: '10px 0' }}>{error}</div>}

            <Accordion defaultOpenIndex={openAccordionIndex} onToggle={handleAccordionToggle}>

                <AccordionItem
                    title="1. Datos Personales del Solicitante Principal"
                    isOpen={openAccordionIndex === 0}
                    toggleOpen={() => handleAccordionToggle(0)}
                    showCheck={completedSteps.user}
                >
                    <UserForm
                        key={userFormKey}
                        onUserCreated={handleUserCreated}
                        onUserUpdated={handleUserUpdated}
                        initialData={userDataForEdit}
                        userIdForUpdate={currentUserId}
                    />
                    {currentUserId && openAccordionIndex === 0 && (
                        <button onClick={() => setOpenAccordionIndex(1)} style={{ marginTop: '20px' }}>Saltar a Cónyuge</button>
                    )}
                </AccordionItem>

                {/* NUEVO ACCORDION ITEM PARA EL CÓNYUGE */}
                <AccordionItem
                    title="2. Datos del Cónyuge"
                    isOpen={openAccordionIndex === 1}
                    toggleOpen={() => handleAccordionToggle(1)}
                    showCheck={completedSteps.conyuge}
                >
                    {currentUserId ? (
                        <ConyugeForm
                            userId={currentUserId}
                            onConyugeChanged={handleConyugeChanged} // Para recargar datos del cónyuge
                            initialData={conyugeDataForEdit} // Datos del cónyuge
                            onContinueToDependientes={handleContinueToDependientes} // Para avanzar a dependientes
                        />
                    ) : (
                        <p>Por favor, complete los datos del solicitante principal primero para añadir al cónyuge.</p>
                    )}
                </AccordionItem>

                <AccordionItem
                    title="3. Dependientes"
                    isOpen={openAccordionIndex === 2} // Ajustar el índice
                    toggleOpen={() => handleAccordionToggle(2)}
                    showCheck={completedSteps.dependiente}
                >
                    {currentUserId ? (
                        <>
                            <DependienteForm
                                userId={currentUserId}
                                onDependienteAdded={handleDependienteChanged}
                                // onDependienteFormSubmitted ya no es necesario aquí, la lógica de continuar está dentro del DependienteForm
                                initialData={dependientesDataForEdit}
                                onContinueToIngresos={handleContinueToIngresos} // Alternativa para solo avanzar
                            />
                        </>
                    ) : (
                        <p>Por favor, complete los datos anteriores primero para añadir dependientes.</p>
                    )}
                </AccordionItem>

                <AccordionItem
                    title="4. Ingresos (Solicitante, Cónyuge y Dependientes)" // Actualizar título
                    isOpen={openAccordionIndex === 3} // Ajustar el índice
                    toggleOpen={() => handleAccordionToggle(3)}
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
                    title="5. Plan de Salud"
                    isOpen={openAccordionIndex === 4} // Ajustar el índice
                    toggleOpen={() => handleAccordionToggle(4)}
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
                    title="6. Información de Pago"
                    isOpen={openAccordionIndex === 5} // Ajustar el índice
                    toggleOpen={() => handleAccordionToggle(5)}
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
                    title="7. Evidencias y Documentos"
                    isOpen={openAccordionIndex === 6} // Ajustar el índice
                    toggleOpen={() => handleAccordionToggle(6)}
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

            {allStepsCompleted && (
                <div style={{ textAlign: 'center', marginTop: '30px', marginBottom: '50px' }}>
                    <button
                        onClick={handleResetForms}
                        style={{
                            padding: '15px 30px',
                            fontSize: '1.2em',
                            backgroundColor: '#28a745',
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
            {currentUserId && !allStepsCompleted && (
                <div style={{ textAlign: 'center', marginTop: '30px', marginBottom: '50px' }}>
                    <button
                        onClick={async () => {
                            if (currentUserId) {
                                try {
                                    await axios.put(`${API_BASE_URL}/api/usuarios/${currentUserId}`, {
                                        estado_registro: 'pendiente'
                                    });
                                    setMessage('Registro guardado para continuar después.');
                                    setError('');
                                    navigate('/');
                                } catch (err) {
                                    console.error("Error al guardar el estado del registro:", err);
                                    setError('Error al guardar el progreso. Intente de nuevo.');
                                    setMessage('');
                                }
                            }
                        }}
                        style={{
                            padding: '15px 30px',
                            fontSize: '1.2em',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                            transition: 'background-color 0.3s ease, transform 0.2s ease',
                            marginLeft: '20px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(1px)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        Enviar a seguimiento
                    </button>
                </div>
            )}
        </div>
    );
}

export default PrincipalData;