import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../../services/api';
import './IncomeForm.css';

export default function IncomeForm() {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        date: '',
        amount: '',
        method: '',
        client_id: '',
        project_id: ''
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
            await api.finance.addIncome(formData);
            navigate('/income');
        } catch (error) {
            console.error('Failed to add income', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="income-form-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => navigate('/income')}>
                    <ArrowLeft size={20} />
                    Back
                </button>
                <h2>New Income</h2>
            </div>

            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-field">
                            <label>Date</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} required />
                        </div>

                        <div className="form-field">
                            <label>Amount (₹)</label>
                            <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="0" />
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

                        <div className="form-field">
                            <label>Client</label>
                            <select name="client_id" value={formData.client_id} onChange={handleChange}>
                                <option value="">Select Client (Optional)</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="form-field full-width">
                            <label>Project</label>
                            <select name="project_id" value={formData.project_id} onChange={handleChange}>
                                <option value="">Select Project (Optional)</option>
                                {projects
                                    .filter(p => !formData.client_id || p.clientId === formData.client_id)
                                    .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => navigate('/income')}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Add Income'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
