// frontend/src/utils/dateCalculations.js

/**
 * Calcula la edad actual de una persona basándose en su fecha de nacimiento.
 * @param {string} dateString - La fecha de nacimiento en formato 'YYYY-MM-DD'.
 * @returns {number | null} La edad en años o null si la fecha es inválida o no está presente.
 */
export const calculateAge = (dateString) => {
    if (!dateString) {
        return null;
    }
    const birthDate = new Date(dateString);
    const today = new Date();

    // Validar si la fecha es válida (ej. evita 'Invalid Date')
    if (isNaN(birthDate.getTime())) {
        return null;
    }

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    // Ajustar la edad si aún no ha cumplido años en el mes o día actual
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};