import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../../services/api';
import { formatApiDate, formatInputDate, getTodayApiDate } from '../../utils/dateUtils';
import './InvoiceForm.css';

export default function InvoiceForm({ initialData, onSuccess, onCancel }) {
    const navigate = useNavigate();
    const isEditMode = !!initialData;
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        invoice_number: '',
        client_id: '',
        project_id: '',
        generated_date: getTodayApiDate(),
        due_date: '',
        amount: '',
        status: 'draft',
        description: '',
    });

    // Pre-populate form when initialData changes
    useEffect(() => {
        if (initialData) {
            setFormData({
                invoice_number: initialData?.invoiceNumber || initialData?.invoice_number || '',
                client_id: initialData?.clientId || initialData?.client_id || '',
                project_id: initialData?.projectId || initialData?.project_id || '',
                generated_date: formatInputDate(initialData?.generatedDate || initialData?.generated_date) || getTodayApiDate(),
                due_date: formatInputDate(initialData?.dueDate || initialData?.due_date) || '',
                amount: initialData?.amount || '',
                status: initialData?.status || 'draft',
                description: initialData?.description || '',
            });
        }
    }, [initialData]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [clientsData, projectsData, invoicesData] = await Promise.all([
                    api.clients.getAll(),
                    api.projects.getAll(),
                    api.invoices.getAll()
                ]);
                setClients(clientsData);
                setProjects(projectsData);

                // Auto-generate invoice number if new mode
                if (!isEditMode) {
                    const nextNum = generateNextInvoiceNumber(invoicesData);
                    setFormData(prev => ({ ...prev, invoice_number: nextNum }));
                }
            } catch (error) {
                console.error("Failed to load form data", error);
            }
        };
        loadData();
    }, [isEditMode]);

    const generateNextInvoiceNumber = (invoices) => {
        if (!invoices || invoices.length === 0) return 'INV-001';

        // Extract numbers from "INV-XXX"
        const numbers = invoices
            .map(inv => {
                const match = inv.invoiceNumber?.match(/INV-(\d+)/);
                return match ? parseInt(match[1], 10) : 0;
            })
            .filter(n => !isNaN(n));

        if (numbers.length === 0) return 'INV-001';

        const maxNum = Math.max(...numbers);
        return `INV-${String(maxNum + 1).padStart(3, '0')}`;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Clean payload - convert dates to API format (dd/mm/yyyy)
            const payload = {
                invoice_number: formData.invoice_number,
                client_id: formData.client_id,
                project_id: formData.project_id,
                generated_date: formatApiDate(formData.generated_date),
                due_date: formatApiDate(formData.due_date),
                amount: Number(formData.amount),
                status: formData.status,
                description: formData.description,
            };

            if (isEditMode) {
                await api.invoices.update(initialData.id, payload);
            } else {
                await api.invoices.create(payload);
            }

            if (onSuccess) {
                onSuccess();
            } else {
                navigate('/invoices');
            }
        } catch (error) {
            console.error('Failed to save invoice', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="invoice-form-page">
            {!onCancel && (
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/invoices')}>
                        <ArrowLeft size={20} />
                        Back
                    </button>
                    <h2>{isEditMode ? 'Edit Invoice' : 'New Invoice'}</h2>
                </div>
            )}

            <div className={`form-container ${onCancel ? 'drawer-form' : ''}`}>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-field full-width">
                            <label>Invoice Number</label>
                            <input
                                type="text"
                                name="invoice_number"
                                value={formData.invoice_number}
                                onChange={handleChange}
                                placeholder="e.g. INV-001"
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label>Client</label>
                            <select name="client_id" value={formData.client_id} onChange={handleChange} required>
                                <option value="">Select Client</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="form-field">
                            <label>Project</label>
                            <select name="project_id" value={formData.project_id} onChange={handleChange}>
                                <option value="">Select Project (Optional)</option>
                                {projects
                                    .filter(p => !formData.client_id || p.clientId === formData.client_id)
                                    .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        <div className="form-field">
                            <label>Invoice Date <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>(dd/mm/yyyy)</span></label>
                            <input type="date" name="generated_date" value={formData.generated_date} onChange={handleChange} required />
                        </div>

                        <div className="form-field">
                            <label>Due Date <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>(dd/mm/yyyy)</span></label>
                            <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} required />
                        </div>

                        <div className="form-field">
                            <label>Amount (₹)</label>
                            <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="0" />
                        </div>

                        <div className="form-field">
                            <label>Status</label>
                            <select name="status" value={formData.status} onChange={handleChange}>
                                <option value="draft">Draft</option>
                                <option value="sent">Sent</option>
                                <option value="overdue">Overdue</option>
                                <option value="paid">Paid</option>
                            </select>
                        </div>

                        <div className="form-field full-width">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Invoice specific details..."
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onCancel || (() => navigate('/invoices'))}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            <Save size={18} />
                            {loading ? 'Saving...' : (isEditMode ? 'Update Invoice' : 'Create Invoice')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
