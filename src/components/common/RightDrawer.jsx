import React, { useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import './RightDrawer.css';

export default function RightDrawer({ isOpen, onClose, title, children, width = '500px', onBack }) {
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="drawer-overlay" onClick={onClose}>
            <div
                className="drawer-content"
                style={{ width }}
                onClick={e => e.stopPropagation()}
            >
                <div className="drawer-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {onBack && (
                            <button className="close-btn" onClick={onBack} title="Back">
                                <ArrowLeft size={20} />
                            </button>
                        )}
                        <h2>{title}</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <div className="drawer-body">
                    {children}
                </div>
            </div>
        </div>
    );
}
