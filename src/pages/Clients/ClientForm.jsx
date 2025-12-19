import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../../services/api';
import './ClientForm.css';

export default function ClientForm({ initialData, onSuccess, onCancel }) {
    const navigate = useNavigate();
    const isEditMode = !!initialData;

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        budget: '',
        notes: '',
        ...initialData // Override defaults with initialData if present
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Backend accepts 'phone' and 'contact_number' fields
            const payload = {
                ...formData,
                contact_number: formData.phone // Map phone to contact_number for backend
            };

            if (isEditMode) {
                // Assuming api.clients.update(id, data) exists or we will add it
                await api.clients.update(initialData.id, payload);
            } else {
                await api.clients.create(payload);
            }

            if (onSuccess) {
                onSuccess();
            } else {
                navigate('/clients');
            }
        } catch (error) {
            console.error('Failed to save client', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="client-form-page">
            {!onCancel && ( // Only show header back button if NOT in drawer (passed via onCancel usually implies drawer)
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/clients')}>
                        <ArrowLeft size={20} />
                        Back
                    </button>
                    <h2>{isEditMode ? 'Edit Client' : 'New Client'}</h2>
                </div>
            )}

            <div className={`form-container ${onCancel ? 'drawer-form' : ''}`}>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-field">
                            <label>Client Name</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="e.g. John Doe"
                            />
                        </div>

                        <div className="form-field">
                            <label>Email Address</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="e.g. john@example.com"
                            />
                        </div>

                        <div className="form-field">
                            <label>Phone Number</label>
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+91 ..."
                            />
                        </div>

                        <div className="form-field">
                            <label>Estimated Budget (₹)</label>
                            <input
                                name="budget"
                                type="number"
                                value={formData.budget}
                                onChange={handleChange}
                                placeholder="0"
                            />
                        </div>

                        <div className="form-field full-width">
                            <label>Address</label>
                            <input
                                name="address"
                                value={formData.address || ''}
                                onChange={handleChange}
                                placeholder="Full office/residential address"
                            />
                        </div>

                        <div className="form-field full-width">
                            <label>Notes / Preferences</label>
                            <textarea
                                name="notes"
                                value={formData.notes || ''}
                                onChange={handleChange}
                                rows={4}
                                placeholder="Add any specific requirements or style preferences..."
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onCancel || (() => navigate('/clients'))}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            <Save size={18} />
                            {loading ? 'Saving...' : (isEditMode ? 'Update Client' : 'Save Client')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
