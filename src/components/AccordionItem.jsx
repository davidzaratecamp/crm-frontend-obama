// frontend/src/components/AccordionItem.jsx
import React from 'react';
import '../styles/Accordion.css';

function AccordionItem({ title, children, isOpen, toggleOpen, isDisabled = false, showCheck = false }) {
    return (
        <div className={`accordion-item ${isDisabled ? 'disabled' : ''}`}>
            <button
                className={`accordion-header ${isOpen ? 'is-open' : ''}`}
                onClick={toggleOpen} // <-- Usa el toggleOpen pasado por props
                disabled={isDisabled}
            >
                {showCheck && <span className="check-icon">✓</span>}
                <h3>{title}</h3>
                <span className="accordion-icon">{isOpen ? '−' : '+'}</span>
            </button>
            {/* Solo renderiza el contenido si está abierto */}
            {isOpen && (
                <div className="accordion-content">
                    {children}
                </div>
            )}
        </div>
    );
}

export default AccordionItem;