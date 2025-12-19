import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Printer, Trash2 } from 'lucide-react';
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
            // Drawer mode - use parent's edit handler
            onEdit(null, incomeData);
        } else {
            // Standalone mode - open local edit drawer
            setEditDrawerOpen(true);
        }
    };

    const handlePrint = () => {
        if (onPrint) {
            onPrint(null, incomeData);
        } else {
            window.print();
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
            loadIncomeData(); // Refresh data in standalone mode
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this income record? This action cannot be undone.')) {
            return;
        }

        try {
            await api.income.delete(incomeData.id);
            if (isDrawer && onDeleteSuccess) {
                onDeleteSuccess(); // Refresh list and close drawer
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
                        <button className="icon-btn" onClick={handlePrint} title="Print">
                            <Printer size={18} />
                        </button>
                    </div>
                </div>

                <div className="detail-content p-6">
                    <div className="info-group">
                        <label>Amount</label>
                        <div className="amount-large text-success">
                            ₹{(incomeData.amountReceived || incomeData.amount || 0).toLocaleString()}
                        </div>
                    </div>

                    <div className="grid-2">
                        <div className="info-group">
                            <label>Date</label>
                            <div>{formatDate(incomeData.receivedDate || incomeData.date)}</div>
                        </div>
                        <div className="info-group">
                            <label>Payment Method</label>
                            <div>{incomeData.paymentMethod || incomeData.method || '-'}</div>
                        </div>
                    </div>

                    <div className="info-group">
                        <label>Client</label>
                        <div>{incomeData.clientName || incomeData.client || '-'}</div>
                    </div>

                    <div className="info-group">
                        <label>Project</label>
                        <div>{incomeData.projectName || incomeData.project || '-'}</div>
                    </div>

                    {incomeData.invoiceNumber && (
                        <div className="info-group">
                            <label>Invoice</label>
                            <div>{incomeData.invoiceNumber}</div>
                        </div>
                    )}

                    {incomeData.description && (
                        <div className="info-group">
                            <label>Description</label>
                            <div>{incomeData.description}</div>
                        </div>
                    )}

                    {/* Delete Action - Pushed to bottom */}
                    <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
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
                            Delete Income
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit drawer for standalone mode */}
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
