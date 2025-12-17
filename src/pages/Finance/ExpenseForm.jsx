import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../../services/api';
import './ExpenseForm.css';

export default function ExpenseForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        date: '',
        category: '',
        description: '',
        amount: '',
        responsible: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.finance.addExpense(formData);
            navigate('/expenses');
        } catch (error) {
            console.error('Failed to add expense', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="expense-form-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => navigate('/expenses')}>
                    <ArrowLeft size={20} />
                    Back
                </button>
                <h2>New Expense</h2>
            </div>

            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-field">
                            <label>Date</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} required />
                        </div>

                        <div className="form-field">
                            <label>Category</label>
                            <select name="category" value={formData.category} onChange={handleChange} required>
                                <option value="">Select Category</option>
                                <option value="Office">Office</option>
                                <option value="Travel">Travel</option>
                                <option value="Salary">Salary</option>
                                <option value="Software">Software</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="form-field">
                            <label>Amount (₹)</label>
                            <input type="number" name="amount" value={formData.amount} onChange={handleChange} required min="0" />
                        </div>

                        <div className="form-field">
                            <label>Responsible Person</label>
                            <input type="text" name="responsible" value={formData.responsible} onChange={handleChange} placeholder="e.g. John Doe" />
                        </div>

                        <div className="form-field full-width">
                            <label>Description</label>
                            <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Expense details..." />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => navigate('/expenses')}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Add Expense'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
