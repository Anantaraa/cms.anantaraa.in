import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../../services/api';
import './InvoiceForm.css';

export default function InvoiceForm() {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        client_id: '',
        project_id: '',
        date: '',
        due_date: '',
        amount: '',
        status: 'pending'
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [clientsData, projectsData] = await Promise.all([
                    api.clients.getAll(),
                    api.projects.getAll()
                ]);
                setClients(clientsData);
                setProjects(projectsData);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.invoices.create(formData);
            navigate('/invoices');
        } catch (error) {
            console.error('Failed to create invoice', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="invoice-form-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => navigate('/invoices')}>
                    <ArrowLeft size={20} />
                    Back
                </button>
                <h2>New Invoice</h2>
            </div>

            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
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
                            <label>Invoice Date</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} required />
                        </div>

                        <div className="form-field">
                            <label>Due Date</label>
                            <input type="date" name="due_date" value={formData.due_date} onChange={handleChange} required />
                        </div>

                        <div className="form-field">
                            <label>Amount (₹)</label>
                            <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="0" />
                        </div>

                        <div className="form-field">
                            <label>Status</label>
                            <select name="status" value={formData.status} onChange={handleChange}>
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => navigate('/invoices')}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Create Invoice'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
