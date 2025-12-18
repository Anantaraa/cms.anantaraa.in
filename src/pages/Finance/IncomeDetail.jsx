import React from 'react';
import { ArrowLeft, Edit2, Printer } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import './Finance.css'; // Shared finance styles

export default function IncomeDetail({ incomeData, isDrawer, onBack, onEdit, onPrint }) {
    if (!incomeData) return <div className="p-6">Income not found</div>;

    return (
        <div className={`finance-detail-page ${isDrawer ? 'drawer-mode' : ''}`}>
            <div className="detail-header-simple">
                {(!isDrawer && onBack) && (
                    <button className="back-btn" onClick={onBack}>
                        <ArrowLeft size={18} /> Back
                    </button>
                )}
                <div className="header-actions-right">
                    <button className="icon-btn" onClick={() => onEdit(null, incomeData)} title="Edit">
                        <Edit2 size={18} />
                    </button>
                    <button className="icon-btn" onClick={() => onPrint(null, incomeData)} title="Print">
                        <Printer size={18} />
                    </button>
                    {/* 3-dot menu could be added here if needed, but for now we have direct actions */}

                </div>
            </div>

            <div className="detail-content p-6">
                <div className="info-group">
                    <label>Amount</label>
                    <div className="amount-large text-success">₹{incomeData.amount.toLocaleString()}</div>
                </div>

                <div className="grid-2">
                    <div className="info-group">
                        <label>Date</label>
                        <div>{formatDate(incomeData.date)}</div>
                    </div>
                    <div className="info-group">
                        <label>Payment Method</label>
                        <div>{incomeData.method}</div>
                    </div>
                </div>

                <div className="info-group">
                    <label>Client</label>
                    <div>{incomeData.client || '-'}</div>
                </div>

                <div className="info-group">
                    <label>Project</label>
                    <div>{incomeData.project || '-'}</div>
                </div>
            </div>
        </div>
    );
}
