// frontend/src/components/statusIndicators/FormStatusIndicator.jsx
import React from 'react';
import '../../styles/FormStatusIndicator.css'; // For styling the indicator

function FormStatusIndicator({ totalFields, completedFields }) {
    const remainingFields = totalFields - completedFields;

    if (remainingFields <= 0) {
        return (
            <span className="form-status-indicator completed">
                ✓ Completo
            </span>
        );
    } else {
        return (
            <span className="form-status-indicator incomplete">
                {remainingFields} campo{remainingFields !== 1 ? 's' : ''} faltante{remainingFields !== 1 ? 's' : ''}
            </span>
        );
    }
}

export default FormStatusIndicator;