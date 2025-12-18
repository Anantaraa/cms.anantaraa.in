import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../../services/api';
import { formatApiDate, formatInputDate } from '../../utils/dateUtils';
import './ExpenseForm.css';

export default function ExpenseForm({ onSuccess, onCancel, initialData }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        expense_date: '',
        amount: '',
        description: '',
        responsible_person: '',
        project_id: '',
        status: 'approved', // Default status
        ...initialData
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                expense_date: initialData.expenseDate ? formatInputDate(initialData.expenseDate) : '',
                amount: initialData.amount || '',
                description: initialData.description || '',
                responsible_person: initialData.responsiblePerson || '',
                project_id: initialData.projectId || initialData.project_id || '',
                status: initialData.status || 'approved'
            });
        }
    }, [initialData]);

    useEffect(() => {
        const load = async () => {
            const data = await api.projects.getAll();
            setProjects(data);
        };
        load();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Convert date from YYYY-MM-DD to dd/mm/yyyy for API
            const payload = {
                project_id: formData.project_id,
                amount: Number(formData.amount),
                description: formData.description,
                expense_date: formatApiDate(formData.expense_date),
                responsible_person: formData.responsible_person,
                status: formData.status
            };

            if (initialData?.id) {
                await api.expenses.update(initialData.id, payload);
            } else {
                await api.expenses.create(payload);
            }
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Failed to save expense', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="drawer-form-container">
            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-field">
                        <label>Date *</label>
                        <input
                            type="date"
                            name="expense_date"
                            value={formData.expense_date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label>Amount (₹) *</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>

                    <div className="form-field full-width">
                        <label>Project *</label>
                        <select name="project_id" value={formData.project_id} onChange={handleChange} required>
                            <option value="">Select Project</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name} - {p.client}</option>)}
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Paid By (Responsible Person) *</label>
                        <input
                            list="responsible-options"
                            name="responsible_person"
                            value={formData.responsible_person}
                            onChange={handleChange}
                            placeholder="Select or type..."
                            required
                        />
                        <datalist id="responsible-options">
                            <option value="Client" />
                            <option value="Architect" />
                            <option value="Survey Agency" />
                            <option value="Contractor" />
                            <option value="Material Vendor" />
                        </datalist>
                    </div>

                    <div className="form-field">
                        <label>Status *</label>
                        <select name="status" value={formData.status} onChange={handleChange} required>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>

                    <div className="form-field full-width">
                        <label>Description *</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            required
                            placeholder="Enter expense description..."
                        ></textarea>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={onCancel}>Cancel</button>
                    <button type="submit" className="btn-save" disabled={loading}>
                        <Save size={18} />
                        {loading ? 'Saving...' : (initialData ? 'Update Expense' : 'Add Expense')}
                    </button>
                </div>
            </form>
        </div>
    );
}
