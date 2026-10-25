import React, { useEffect } from 'react';

export const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = '540px', hideHeader = false }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(20, 20, 20, 0.55)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        width: '100%',
        maxWidth: maxWidth,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
        border: '1px solid #E8E5DC',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        {!hideHeader && (
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #F0EDE5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div>
              {title && (
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#242424', margin: 0 }}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p style={{ fontSize: '0.8rem', color: '#707070', margin: '4px 0 0 0' }}>
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#F8F8F6',
                border: 'none',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#707070',
                cursor: 'pointer',
                fontSize: '1.2rem',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
