// frontend/src/components/forms/ConyugeForm.jsx
import React from 'react';
import DependienteForm from './DependienteForm';

function ConyugeForm({ userId, onConyugeChanged, initialData, onContinueToDependientes }) {

    return (
        <DependienteForm
            userId={userId}
            onDependienteAdded={onConyugeChanged} // Reutilizamos el callback, pero su significado es para el cónyuge
            initialData={initialData}
            onContinueToIngresos={onContinueToDependientes} // Reutilizamos, pero significa avanzar a dependientes
            isConyugeForm={true} // Nueva prop para indicar que es el formulario del cónyuge
        />
    );
}

export default ConyugeForm;