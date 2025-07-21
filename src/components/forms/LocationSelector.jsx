// frontend/src/components/forms/LocationSelector.jsx
import React, { useState, useEffect } from 'react';
import { data as allLocations } from '../../data/locationsData';
// import '../forms/FormStyles.css'; // Asegúrate de que esta línea esté comentada o el archivo exista

function LocationSelector({ onLocationChange, initialLocation = {} }) {
    // Usar initialLocation solo para la inicialización
    const [selectedState, setSelectedState] = useState(initialLocation.estado || '');
    const [selectedCounty, setSelectedCounty] = useState(initialLocation.condado || '');
    const [selectedCity, setSelectedCity] = useState(initialLocation.ciudad || '');

    const [states, setStates] = useState([]);
    const [counties, setCounties] = useState([]);
    const [cities, setCities] = useState([]);

    // Efecto para cargar los estados disponibles al inicio
    useEffect(() => {
        const uniqueStates = [...new Set(allLocations.map(item => item.estado))].sort();
        setStates(uniqueStates);
    }, []);

    // Efecto para actualizar los condados
    useEffect(() => {
        if (selectedState) {
            const countiesForState = [...new Set(
                allLocations
                    .filter(item => item.estado === selectedState)
                    .map(item => item.condado)
            )].sort();
            setCounties(countiesForState);
            // Esto es crucial: Si el condado actual ya no es válido, resetearlo
            if (!countiesForState.includes(selectedCounty)) {
                setSelectedCounty('');
                setSelectedCity('');
            }
        } else {
            setCounties([]);
            setSelectedCounty('');
            setCities([]);
            setSelectedCity('');
        }
    }, [selectedState]); // Depende SOLO de selectedState

    // Efecto para actualizar las ciudades
    useEffect(() => {
        if (selectedState && selectedCounty) {
            const citiesForCounty = [...new Set(
                allLocations
                    .filter(item => item.estado === selectedState && item.condado === selectedCounty)
                    .map(item => item.ciudad)
            )].sort();
            setCities(citiesForCounty);
            // Esto es crucial: Si la ciudad actual ya no es válida, resetearla
            if (!citiesForCounty.includes(selectedCity)) {
                setSelectedCity('');
            }
        } else {
            setCities([]);
            setSelectedCity('');
        }
    }, [selectedState, selectedCounty]); // Depende SOLO de selectedState y selectedCounty

    // Efecto para notificar al componente padre sobre cualquier cambio en la ubicación
    // Este es el que potencialmente causa el bucle si no se maneja bien
    useEffect(() => {
        // Solo llamar a onLocationChange si los valores han cambiado realmente
        // Esto evita llamar setFormData en el padre si el LocationSelector se re-renderiza
        // pero sus valores seleccionados no han cambiado.
        if (selectedState !== initialLocation.estado ||
            selectedCounty !== initialLocation.condado ||
            selectedCity !== initialLocation.ciudad) {
            
            // Si hay un estado, condado y ciudad válidos, envía el cambio
            // O envía siempre el estado actual para que el padre lo registre
            onLocationChange({
                estado: selectedState,
                condado: selectedCounty,
                ciudad: selectedCity
            });
        }
    }, [selectedState, selectedCounty, selectedCity, onLocationChange, initialLocation]); // <-- initialLocation como dependencia

    return (
        <>
            <div className="form-field">
                <label>Estado:<span className="required-star">*</span></label>
                <select value={selectedState} onChange={(e) => { setSelectedState(e.target.value); }} required>
                    <option value="">Selecciona un Estado</option>
                    {states.map(state => (
                        <option key={state} value={state}>{state}</option>
                    ))}
                </select>
            </div>

            <div className="form-field">
                <label>Condado:<span className="required-star">*</span></label>
                <select value={selectedCounty} onChange={(e) => { setSelectedCounty(e.target.value); }} disabled={!selectedState} required>
                    <option value="">Selecciona un Condado</option>
                    {counties.map(county => (
                        <option key={county} value={county}>{county}</option>
                    ))}
                </select>
            </div>

            <div className="form-field">
                <label>Ciudad:<span className="required-star">*</span></label>
                <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} disabled={!selectedCounty} required>
                    <option value="">Selecciona una Ciudad</option>
                    {cities.map(city => (
                        <option key={city} value={city}>{city}</option>
                    ))}
                </select>
            </div>
        </>
    );
}

export default LocationSelector;