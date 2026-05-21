import React from 'react';
import './ShoesPageSkeleton.css';

const ShoesPageSkeleton = () => {
    return (
        <div className="shoe-card skeleton-card">
            {/* Header del esqueleto (Círculo de la marca y botón borrar) */}
            <div className="shoe-card-header" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <div className="sk-shoe-anim" style={{ width: '55px', height: '55px', borderRadius: '12px' }}></div>
                <div className="sk-shoe-anim" style={{ width: '80px', height: '24px', borderRadius: '20px' }}></div>
            </div>
            
            {/* Cuerpo del esqueleto (Títulos y barra) */}
            <div style={{ width: '100%', marginTop: '15px' }}>
                <div className="sk-shoe-anim" style={{ width: '70%', height: '28px', marginBottom: '25px', borderRadius: '4px' }}></div>
                
                {/* Textos arriba de la barra */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div className="sk-shoe-anim" style={{ width: '60px', height: '12px', borderRadius: '4px' }}></div>
                    <div className="sk-shoe-anim" style={{ width: '80px', height: '16px', borderRadius: '4px' }}></div>
                </div>

                {/* La barra de progreso fantasma */}
                <div className="sk-shoe-anim" style={{ width: '100%', height: '10px', borderRadius: '5px', marginBottom: '12px' }}></div>
                
                {/* Textos abajo de la barra */}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="sk-shoe-anim" style={{ width: '90px', height: '12px', borderRadius: '4px' }}></div>
                    <div className="sk-shoe-anim" style={{ width: '70px', height: '12px', borderRadius: '4px' }}></div>
                </div>
            </div>
        </div>
    );
};

export default ShoesPageSkeleton;