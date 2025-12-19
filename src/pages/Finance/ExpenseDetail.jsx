import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, CreditCard, User, Briefcase, Calendar, FileText, CheckCircle } from 'lucide-react';
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
            onEdit(null, expenseData);
        } else {
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
            loadExpenseData();
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this expense?')) {
            return;
        }

        try {
            await api.expenses.delete(expenseData.id);
            if (isDrawer && onDeleteSuccess) {
                onDeleteSuccess();
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
                <div className="detail-header">
                    {!isDrawer && (
                        <button className="back-btn" onClick={handleBack}>
                            <ArrowLeft size={20} /> Back to Expenses
                        </button>
                    )}
                    <div className="header-container-flex">
                        <div className="header-content">
                            <div className="finance-icon-lg expense">
                                <CreditCard size={32} />
                            </div>
                            <div className="title-info">
                                <h1>Expense Details</h1>
                                <span className={`status-badge ${expenseData.status || 'approved'}`}>
                                    {expenseData.status || 'Approved'}
                                </span>
                            </div>
                        </div>
                        <div className="header-actions-right">
                            <button className="icon-btn" onClick={handleEdit} title="Edit">
                                <Edit2 size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="detail-grid">
                    <div className="info-card">
                        <h3>Transaction Details</h3>
                        <div className="info-list">
                            <div className="info-item">
                                <User size={18} />
                                <div>
                                    <div className="info-label">Client</div>
                                    <div className="info-value clickable-link" onClick={() => expenseData.clientId && navigate(`/clients/${expenseData.clientId}`)}>
                                        {expenseData.clientName || expenseData.client || '-'}
                                    </div>
                                </div>
                            </div>
                            <div className="info-item">
                                <Briefcase size={18} />
                                <div>
                                    <div className="info-label">Project</div>
                                    <div className="info-value clickable-link" onClick={() => expenseData.projectId && navigate(`/projects/${expenseData.projectId}`)}>
                                        {expenseData.projectName || expenseData.project || '-'}
                                    </div>
                                </div>
                            </div>
                            <div className="info-item">
                                <Calendar size={18} />
                                <div>
                                    <div className="info-label">Expense Date</div>
                                    <div className="info-value">{formatDate(expenseData.expenseDate || expenseData.date)}</div>
                                </div>
                            </div>
                            <div className="info-item">
                                <User size={18} />
                                <div>
                                    <div className="info-label">Paid By</div>
                                    <div className="info-value">{expenseData.responsiblePerson || '-'}</div>
                                </div>
                            </div>
                            {expenseData.description && (
                                <div className="info-item">
                                    <FileText size={18} />
                                    <div>
                                        <div className="info-label">Description</div>
                                        <div className="info-value">{expenseData.description}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="divider"></div>

                        <h3>Amount</h3>
                        <div className="amount-display">
                            <span className="currency">₹</span>
                            <span className="amount expense">
                                {Number(expenseData.amount || 0).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className="delete-section">
                        <button className="delete-btn" onClick={handleDelete}>
                            <Trash2 size={16} />
                            Delete Record
                        </button>
                    </div>
                </div>
            </div>

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
