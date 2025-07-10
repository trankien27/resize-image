import React from 'react';
import './ComingSoonModal.css';

interface ComingSoonModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ComingSoonModal: React.FC<ComingSoonModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>
                <h1 className="modal-title">🚧 Coming Soon 🚧</h1>
                <p className="modal-subtitle">Tính năng đang được phát triển. Vui lòng quay lại sau!</p>
                <div className="loader"></div>
            </div>
        </div>
    );
};

export default ComingSoonModal;
