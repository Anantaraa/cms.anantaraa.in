import React from 'react';
import { ArrowLeft, Edit2 } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import './Finance.css';

export default function ExpenseDetail({ expenseData, isDrawer, onBack, onEdit }) {
    if (!expenseData) return <div className="p-6">Expense not found</div>;

    return (
        <div className={`finance-detail-page ${isDrawer ? 'drawer-mode' : ''}`}>
            <div className="detail-header-simple">
                {(!isDrawer && onBack) && (
                    <button className="back-btn" onClick={onBack}>
                        <ArrowLeft size={18} /> Back
                    </button>
                )}
                <div className="header-actions-right">
                    <button className="icon-btn" onClick={() => onEdit(null, expenseData)} title="Edit">
                        <Edit2 size={18} />
                    </button>
                </div>
            </div>

            <div className="detail-content p-6">
                <div className="info-group">
                    <label>Amount</label>
                    <div className="amount-large text-danger">₹{expenseData.amount.toLocaleString()}</div>
                </div>

                <div className="grid-2">
                    <div className="info-group">
                        <label>Date</label>
                        <div>{formatDate(expenseData.date)}</div>
                    </div>
                    <div className="info-group">
                        <label>Category</label>
                        <span className="cat-badge">{expenseData.category}</span>
                    </div>
                </div>

                <div className="info-group">
                    <label>Description</label>
                    <div>{expenseData.description}</div>
                </div>

                <div className="info-group">
                    <label>Responsible</label>
                    <div>{expenseData.responsible}</div>
                </div>

                {expenseData.project && (
                    <div className="info-group">
                        <label>Project</label>
                        <div>{expenseData.project}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
