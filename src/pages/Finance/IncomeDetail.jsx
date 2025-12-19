import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Printer, Trash2, Wallet, User, Briefcase, Calendar, CreditCard, FileText, Download } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { api } from '../../services/api';
import RightDrawer from '../../components/common/RightDrawer';
import IncomeForm from './IncomeForm';
import './Finance.css';

export default function IncomeDetail({ incomeData: propIncomeData, isDrawer, onBack, onEdit, onPrint, onClose, onDeleteSuccess }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [incomeData, setIncomeData] = useState(propIncomeData || null);
    const [loading, setLoading] = useState(!propIncomeData && !!id);
    const [error, setError] = useState(null);
    const [editDrawerOpen, setEditDrawerOpen] = useState(false);

    // Fetch data if in standalone mode (has ID param but no prop data)
    useEffect(() => {
        if (id && !propIncomeData) {
            loadIncomeData();
        }
    }, [id, propIncomeData]);

    // Update local state when prop changes (drawer mode)
    useEffect(() => {
        if (propIncomeData) {
            setIncomeData(propIncomeData);
        }
    }, [propIncomeData]);

    const loadIncomeData = async () => {
        try {
            setLoading(true);
            const data = await api.income.getById(id);
            setIncomeData(data);
            setError(null);
        } catch (err) {
            console.error('Failed to load income', err);
            setError('Failed to load income record');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        if (onEdit) {
            onEdit(null, incomeData);
        } else {
            setEditDrawerOpen(true);
        }
    };

    const handlePrint = () => {
        if (onPrint) {
            onPrint(null, incomeData);
        } else {
            window.print(); // Basic browser print
        }
    };

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate('/income');
        }
    };

    const handleEditSuccess = () => {
        setEditDrawerOpen(false);
        if (id) {
            loadIncomeData();
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this income record? This action cannot be undone.')) {
            return;
        }

        try {
            await api.income.delete(incomeData.id);
            if (isDrawer && onDeleteSuccess) {
                onDeleteSuccess();
            } else if (isDrawer && onClose) {
                onClose();
            } else {
                navigate('/income');
            }
        } catch (error) {
            console.error('Failed to delete income', error);
            alert('Failed to delete income');
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;
    if (error) return <div className="p-6 text-error">{error}</div>;
    if (!incomeData) return <div className="p-6">Income not found</div>;

    return (
        <>
            <div className={`finance-detail-page ${isDrawer ? 'drawer-mode' : ''}`}>
                <div className="detail-header">
                    {!isDrawer && (
                        <button className="back-btn" onClick={handleBack}>
                            <ArrowLeft size={20} /> Back to Income
                        </button>
                    )}
                    <div className="header-container-flex">
                        <div className="header-content">
                            <div className="finance-icon-lg income">
                                <Wallet size={32} />
                            </div>
                            <div className="title-info">
                                <h1>Income Details</h1>
                                <span className={`status-badge ${incomeData.status || 'received'}`}>
                                    {incomeData.status || 'Received'}
                                </span>
                            </div>
                        </div>
                        <div className="header-actions-right">
                            <button className="icon-btn" onClick={handleEdit} title="Edit">
                                <Edit2 size={20} />
                            </button>
                            <button className="icon-btn" onClick={handlePrint} title="Print Receipt">
                                <Printer size={20} />
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
                                    <div className="info-value clickable-link" onClick={() => incomeData.client_id && navigate(`/clients/${incomeData.client_id}`)}>
                                        {incomeData.clientName || incomeData.client || '-'}
                                    </div>
                                </div>
                            </div>
                            <div className="info-item">
                                <Briefcase size={18} />
                                <div>
                                    <div className="info-label">Project</div>
                                    <div className="info-value clickable-link" onClick={() => incomeData.project_id && navigate(`/projects/${incomeData.project_id}`)}>
                                        {incomeData.projectName || incomeData.project || '-'}
                                    </div>
                                </div>
                            </div>
                            <div className="info-item">
                                <Calendar size={18} />
                                <div>
                                    <div className="info-label">Received Date</div>
                                    <div className="info-value">{formatDate(incomeData.receivedDate || incomeData.date)}</div>
                                </div>
                            </div>
                            <div className="info-item">
                                <CreditCard size={18} />
                                <div>
                                    <div className="info-label">Payment Method</div>
                                    <div className="info-value">{incomeData.paymentMethod || incomeData.method || '-'}</div>
                                </div>
                            </div>
                            {incomeData.invoiceNumber && (
                                <div className="info-item">
                                    <FileText size={18} />
                                    <div>
                                        <div className="info-label">Invoice Ref</div>
                                        <div className="info-value">{incomeData.invoiceNumber}</div>
                                    </div>
                                </div>
                            )}
                            {incomeData.description && (
                                <div className="info-item">
                                    <FileText size={18} />
                                    <div>
                                        <div className="info-label">Description</div>
                                        <div className="info-value">{incomeData.description}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="divider"></div>

                        <h3>Amount Received</h3>
                        <div className="amount-display">
                            <span className="currency">₹</span>
                            <span className="amount income">
                                {Number(incomeData.amountReceived || incomeData.amount).toLocaleString()}
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
                    title="Edit Income"
                    width="50%"
                >
                    <IncomeForm
                        initialData={incomeData}
                        onSuccess={handleEditSuccess}
                        onCancel={() => setEditDrawerOpen(false)}
                    />
                </RightDrawer>
            )}
        </>
    );
}
