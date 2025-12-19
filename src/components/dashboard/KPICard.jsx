import React from 'react';
import clsx from 'clsx';
import './KPICard.css';

export default function KPICard({ label, value, subValue, icon: Icon, trend, className, onClick }) {
    return (
        <div
            className={clsx('kpi-card', className, { 'clickable': !!onClick })}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className="kpi-header">
                <span className="kpi-label">{label}</span>
                {Icon && <Icon className="kpi-icon" size={20} />}
            </div>
            <div className="kpi-content">
                <div className="kpi-value">{value}</div>
                {subValue && <div className="kpi-sub">{subValue}</div>}
            </div>
        </div>
    );
}
