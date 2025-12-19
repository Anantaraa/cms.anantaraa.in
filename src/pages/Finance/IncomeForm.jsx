import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../../services/api';
import { formatApiDate, formatInputDate } from '../../utils/dateUtils';
import './IncomeForm.css';

export default function IncomeForm({ onSuccess, onCancel, initialData }) {
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [invoices, setInvoices] = useState([]); // All invoices
    const [loading, setLoading] = useState(false);
    const [incomeType, setIncomeType] = useState('invoice'); // 'invoice' | 'other'

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        method: '',
        client_id: '',
        project_id: '',
        invoice_id: '',
        description: '',
        ...initialData
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                date: initialData.receivedDate ? formatInputDate(initialData.receivedDate) : '',
                amount: initialData.amountReceived || initialData.amount || '',
                method: initialData.paymentMethod || initialData.method || '',
                client_id: initialData.clientId || initialData.client_id || '',
                project_id: initialData.projectId || initialData.project_id || '',
                invoice_id: initialData.invoice_id || '',
                description: initialData.description || ''
            });
            setIncomeType(initialData.invoice_id ? 'invoice' : 'other');
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
                setInvoices(invoicesData);
            } catch (error) {
                console.error("Failed to load form data", error);
            }
        };
        loadData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleInvoiceChange = (e) => {
        const invId = e.target.value;
        const invoice = invoices.find(i => i.id === invId);
        setFormData(prev => ({
            ...prev,
            invoice_id: invId,
            amount: invoice ? invoice.amount : '', // Default to full amount, user can edit
            project_id: invoice ? invoice.projectId : prev.project_id // Auto-link project
        }));
    };

    // Filter available invoices based on selected client
    const availableInvoices = invoices.filter(inv => {
        if (inv.status === 'paid') return false; // Only show unpaid/partially paid? Docs say "When... paid", implying we are recording it now.
        if (formData.client_id && String(inv.clientId) !== String(formData.client_id)) return false;
        return true;
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                amount_received: Number(formData.amount),
                received_date: formatApiDate(formData.date), // Convert to dd/mm/yyyy
                payment_method: formData.method,
                // If invoice type, send invoice_id
                invoice_id: incomeType === 'invoice' ? formData.invoice_id : null,
                // If other, send description
                description: incomeType === 'other' ? formData.description : null,
                status: 'received' // Default status
            };

            if (initialData?.id) {
                await api.income.update(initialData.id, payload);
            } else {
                await api.income.create(payload);
            }
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Failed to save income', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="drawer-form-container">
            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-field full-width">
                        <label>Income Type</label>
                        <div className="toggle-group">
                            <button
                                type="button"
                                className={`toggle-btn ${incomeType === 'invoice' ? 'active' : ''}`}
                                onClick={() => setIncomeType('invoice')}
                            >
                                Invoice Payment
                            </button>
                            <button
                                type="button"
                                className={`toggle-btn ${incomeType === 'other' ? 'active' : ''}`}
                                onClick={() => setIncomeType('other')}
                            >
                                Other / Direct
                            </button>
                        </div>
                    </div>

                    <div className="form-field">
                        <label>Date <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>(dd/mm/yyyy)</span></label>
                        <input type="date" name="date" value={formData.date} onChange={handleChange} required />
                    </div>

                    <div className="form-field">
                        <label>Payment Method</label>
                        <select name="method" value={formData.method} onChange={handleChange} required>
                            <option value="">Select Method</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cash">Cash</option>
                            <option value="Cheque">Cheque</option>
                            <option value="UPI">UPI</option>
                        </select>
                    </div>

                    {/* Common Client Selection */}
                    <div className="form-field">
                        <label>Client</label>
                        <select name="client_id" value={formData.client_id} onChange={handleChange} required={incomeType === 'invoice'}>
                            <option value="">Select Client</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {incomeType === 'invoice' ? (
                        <>
                            <div className="form-field full-width">
                                <label>Link Invoice</label>
                                <select
                                    name="invoice_id"
                                    value={formData.invoice_id}
                                    onChange={handleInvoiceChange}
                                    required
                                    disabled={!formData.client_id}
                                >
                                    <option value="">Select Invoice</option>
                                    {availableInvoices.map(inv => (
                                        <option key={inv.id} value={inv.id}>
                                            {inv.invoiceNumber} — ₹{inv.amount.toLocaleString()} ({inv.status})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Amount Received (₹)</label>
                                <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="0" />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-field full-width">
                                <label>Project (Optional)</label>
                                <select name="project_id" value={formData.project_id} onChange={handleChange}>
                                    <option value="">Link into Project</option>
                                    {projects
                                        .filter(p => !formData.client_id || p.clientId === formData.client_id)
                                        .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="form-field">
                                <label>Amount (₹)</label>
                                <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="0" />
                            </div>
                            <div className="form-field full-width">
                                <label>Description</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="e.g. Consultation Fee"
                                    required
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
                    <button type="submit" className="btn-save" disabled={loading}>
                        <Save size={18} />
                        {loading ? 'Saving...' : (initialData ? 'Update Income' : 'Add Income')}
                    </button>
                </div>
            </form>
        </div>
    );
}
