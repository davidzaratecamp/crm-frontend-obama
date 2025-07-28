// frontend/src/components/forms/LocationSelector.jsx
import React, { useState, useEffect } from 'react';
import { data as allLocations } from '../../data/locationsData';

// El componente LocationSelector ahora es completamente controlado
// Recibe los valores actuales como 'location' y un manejador de cambios
// ✅ Añadir un valor por defecto para 'location'
function LocationSelector({ location = {}, onLocationChange }) { // Default to an empty object
    const [states, setStates] = useState([]);
    const [counties, setCounties] = useState([]);
    const [cities, setCities] = useState([]);

    // Efecto para cargar los estados disponibles al inicio
    useEffect(() => {
        const uniqueStates = [...new Set(allLocations.map(item => item.estado))].sort();
        setStates(uniqueStates);
    }, []);

    // Efecto para actualizar los condados cuando cambia el estado en la prop 'location'
    useEffect(() => {
        // ✅ Usar optional chaining o asegurar que location.estado exista
        if (location.estado) {
            const countiesForState = [...new Set(
                allLocations
                    .filter(item => item.estado === location.estado)
                    .map(item => item.condado)
            )].sort();
            setCounties(countiesForState);
        } else {
            setCounties([]);
            setCities([]);
        }
    }, [location.estado, location.condado]);

    // Efecto para actualizar las ciudades cuando cambia el estado o condado en la prop 'location'
    useEffect(() => {
        // ✅ Usar optional chaining o asegurar que location.estado y location.condado existan
        if (location.estado && location.condado) {
            const citiesForCounty = [...new Set(
                allLocations
                    .filter(item => item.estado === location.estado && item.condado === location.condado)
                    .map(item => item.ciudad)
            )].sort();
            setCities(citiesForCounty);
        } else {
            setCities([]);
        }
    }, [location.estado, location.condado, location.ciudad]);

    // Manejadores de cambio internos que llaman directamente a onLocationChange
    const handleStateChange = (e) => {
        const newState = e.target.value;
        onLocationChange({
            estado: newState,
            condado: '', // Resetear condado
            ciudad: ''   // Resetear ciudad
        });
    };

    const handleCountyChange = (e) => {
        const newCounty = e.target.value;
        onLocationChange({
            estado: location.estado, // Mantener el estado actual
            condado: newCounty,
            ciudad: '' // Resetear ciudad
        });
    };

    const handleCityChange = (e) => {
        const newCity = e.target.value;
        onLocationChange({
            estado: location.estado,
            condado: location.condado,
            ciudad: newCity
        });
    };

    return (
        <>
            <div className="form-field">
                <label>Estado:<span className="required-star">*</span></label>
                {/* ✅ Usar location.estado o un string vacío como fallback */}
                <select value={location.estado || ''} onChange={handleStateChange} required>
                    <option value="">Selecciona un Estado</option>
                    {states.map(state => (
                        <option key={state} value={state}>{state}</option>
                    ))}
                </select>
            </div>

            <div className="form-field">
                <label>Condado:<span className="required-star">*</span></label>
                {/* ✅ Usar location.condado o un string vacío como fallback */}
                <select value={location.condado || ''} onChange={handleCountyChange} disabled={!location.estado} required>
                    <option value="">Selecciona un Condado</option>
                    {counties.map(county => (
                        <option key={county} value={county}>{county}</option>
                    ))}
                </select>
            </div>

            <div className="form-field">
                <label>Ciudad:<span className="required-star">*</span></label>
                {/* ✅ Usar location.ciudad o un string vacío como fallback */}
                <select value={location.ciudad || ''} onChange={handleCityChange} disabled={!location.condado} required>
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