import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { formatDate } from '../../utils/dateUtils';
import RightDrawer from '../../components/common/RightDrawer';
import ExpenseForm from './ExpenseForm';
import './Finance.css';

export default function ExpenseDetail({ expenseData: propExpenseData, isDrawer, onBack, onEdit, onClose, onDeleteSuccess }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [expenseData, setExpenseData] = useState(propExpenseData || null);
    const [loading, setLoading] = useState(!propExpenseData && !!id);
    const [error, setError] = useState(null);
    const [editDrawerOpen, setEditDrawerOpen] = useState(false);

    // Fetch data if in standalone mode (has ID param but no prop data)
    useEffect(() => {
        if (id && !propExpenseData) {
            loadExpenseData();
        }
    }, [id, propExpenseData]);

    // Update local state when prop changes (drawer mode)
    useEffect(() => {
        if (propExpenseData) {
            setExpenseData(propExpenseData);
        }
    }, [propExpenseData]);

    const loadExpenseData = async () => {
        try {
            setLoading(true);
            const data = await api.expenses.getById(id);
            setExpenseData(data);
            setError(null);
        } catch (err) {
            console.error('Failed to load expense', err);
            setError('Failed to load expense record');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        if (onEdit) {
            // Drawer mode - use parent's edit handler
            onEdit(null, expenseData);
        } else {
            // Standalone mode - open local edit drawer
            setEditDrawerOpen(true);
        }
    };

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate('/expenses');
        }
    };

    const handleEditSuccess = () => {
        setEditDrawerOpen(false);
        if (id) {
            loadExpenseData(); // Refresh data in standalone mode
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this expense?')) {
            return;
        }

        try {
            await api.expenses.delete(expenseData.id);
            if (isDrawer && onDeleteSuccess) {
                onDeleteSuccess(); // Refresh list and close drawer
            } else if (isDrawer && onClose) {
                onClose();
            } else {
                navigate('/expenses');
            }
        } catch (error) {
            console.error('Failed to delete expense', error);
            alert('Failed to delete expense');
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;
    if (error) return <div className="p-6 text-error">{error}</div>;
    if (!expenseData) return <div className="p-6">Expense not found</div>;

    return (
        <>
            <div className={`finance-detail-page ${isDrawer ? 'drawer-mode' : ''}`}>
                <div className="detail-header-simple">
                    {!isDrawer && (
                        <button className="back-btn" onClick={handleBack}>
                            <ArrowLeft size={18} /> Back
                        </button>
                    )}
                    <div className="header-actions-right">
                        <button className="icon-btn" onClick={handleEdit} title="Edit">
                            <Edit2 size={18} />
                        </button>
                    </div>
                </div>

            <div className="detail-content p-6">
                <div className="info-group">
                    <label>Amount</label>
                    <div className="amount-large text-danger">₹{(expenseData.amount || 0).toLocaleString()}</div>
                </div>

                <div className="grid-2">
                    <div className="info-group">
                        <label>Date</label>
                        <div>{formatDate(expenseData.expenseDate || expenseData.date)}</div>
                    </div>
                    <div className="info-group">
                        <label>Status</label>
                        <span className={`status-badge ${(expenseData.status || 'approved').toLowerCase()}`}>
                            {expenseData.status || 'Approved'}
                        </span>
                    </div>
                </div>

                <div className="info-group">
                    <label>Description</label>
                    <div>{expenseData.description || '-'}</div>
                </div>

                <div className="info-group">
                    <label>Paid By</label>
                    <div>{expenseData.responsiblePerson || '-'}</div>
                </div>

                {(expenseData.projectName || expenseData.project) && (
                    <div className="info-group">
                        <label>Project</label>
                        <div>{expenseData.projectName || expenseData.project}</div>
                    </div>
                )}

                {(expenseData.clientName || expenseData.client) && (
                    <div className="info-group">
                        <label>Client</label>
                        <div>{expenseData.clientName || expenseData.client}</div>
                    </div>
                )}
            </div>

            {/* Delete Action - Pushed to bottom */}
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', padding: '24px' }}>
                <button
                    onClick={handleDelete}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#fee2e2',
                        color: '#ef4444',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#fecaca';
                        e.currentTarget.style.borderColor = '#fca5a5';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#fee2e2';
                        e.currentTarget.style.borderColor = '#fecaca';
                    }}
                >
                    <Trash2 size={16} />
                    Delete Expense
                </button>
            </div>
        </div>

        {/* Edit drawer for standalone mode */}
        {!isDrawer && (
            <RightDrawer
                isOpen={editDrawerOpen}
                onClose={() => setEditDrawerOpen(false)}
                title="Edit Expense"
                width="50%"
            >
                <ExpenseForm
                    initialData={expenseData}
                    onSuccess={handleEditSuccess}
                    onCancel={() => setEditDrawerOpen(false)}
                />
            </RightDrawer>
        )}
    </>
    );
}
