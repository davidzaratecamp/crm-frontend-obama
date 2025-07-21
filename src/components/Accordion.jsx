// frontend/src/components/Accordion.jsx
import React from 'react';

// Se eliminó el estado interno `openIndex` y `setOpenIndex` porque `PrincipalData` lo manejará
function Accordion({ children, defaultOpenIndex = null, onToggle }) { // <-- Recibe onToggle

    // Pasamos la función onToggle y el estado de apertura/cierre a los hijos
    return React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, {
                // isOpen y toggleOpen serán manejados por el padre (PrincipalData)
                // y pasados directamente a AccordionItem.
                // Ya no necesitamos calcular 'isOpen' aquí, el padre lo sabe y lo pasa.
                // Ya no necesitamos 'toggleOpen' aquí, el padre lo sabe y lo pasa.
                // Simplemente aseguramos que el index se pasa al AccordionItem
                index: index // Para que AccordionItem sepa su propio índice si es necesario para lógica interna
            });
        }
        return child;
    });
}

export default Accordion;