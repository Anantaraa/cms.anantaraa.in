import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { formatApiDate, formatInputDate } from '../../utils/dateUtils';
import './ProjectForm.css';


export default function ProjectForm({ initialData, onSuccess, onCancel }) {
    const navigate = useNavigate();
    const isEditMode = !!initialData;
    const [clients, setClients] = useState([]);

    // Initialize state with defaults
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        type: '',
        status: 'planned',
        client_id: '',
        start_date: '',
        expected_end_date: '',
        project_value: '',
        description: ''
    });

    // Pre-populate form when initialData changes
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData?.name || '',
                location: initialData?.location || '',
                type: initialData?.type || '',
                status: initialData?.status || 'planned',
                client_id: initialData?.clientId || initialData?.client_id || '',
                start_date: formatInputDate(initialData?.startDate || initialData?.start_date) || '',
                expected_end_date: formatInputDate(initialData?.expectedEndDate || initialData?.expected_end_date) || '',
                project_value: initialData?.projectValue || initialData?.project_value || '',
                description: initialData?.description || ''
            });
        }
    }, [initialData]);
    const [loading, setLoading] = useState(false);

    // Invoice Schedule State
    const [plannedInvoices, setPlannedInvoices] = useState([]);
    const [existingInvoices, setExistingInvoices] = useState([]);
    const [invoiceCounter, setInvoiceCounter] = useState(1);

    // Debug logging
    console.log("ProjectForm rendering", { isEditMode, initialData });

    useEffect(() => {
        const loadClients = async () => {
            console.log("Loading clients...");
            try {
                const data = await api.clients.getAll();
                console.log("Clients loaded:", data);
                setClients(data);
            } catch (e) {
                console.error("Error loading clients:", e);
            }
        };
        loadClients();
    }, []);

    // Load existing invoices in edit mode
    useEffect(() => {
        const loadExistingInvoices = async () => {
            if (isEditMode && initialData?.id) {
                try {
                    const invoices = await api.invoices.getAll();
                    const projectInvoices = invoices.filter(inv => inv.projectId === initialData.id);
                    setExistingInvoices(projectInvoices);
                } catch (e) {
                    console.error("Error loading invoices:", e);
                }
            }
        };
        loadExistingInvoices();
    }, [isEditMode, initialData]);

    // Invoice Schedule Functions
    const addInvoice = () => {
        const newInvoice = {
            tempId: Date.now(),
            amount: '',
            due_date: '',
            generated_date: new Date().toISOString().split('T')[0], // Today
            description: `Invoice ${invoiceCounter}`,
        };
        setPlannedInvoices([...plannedInvoices, newInvoice]);
        setInvoiceCounter(invoiceCounter + 1);
    };

    const removeInvoice = (tempId) => {
        setPlannedInvoices(plannedInvoices.filter(inv => inv.tempId !== tempId));
    };

    const updateInvoice = (tempId, field, value) => {
        setPlannedInvoices(plannedInvoices.map(inv =>
            inv.tempId === tempId ? { ...inv, [field]: value } : inv
        ));
    };

    const calculateTotalPlanned = () => {
        return plannedInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    };

    const getTotalValidation = () => {
        const projectValue = Number(formData.project_value) || 0;
        const totalPlanned = calculateTotalPlanned();
        const difference = totalPlanned - projectValue;

        if (projectValue === 0) return null;
        if (difference === 0) return { type: 'success', message: 'Total matches project value' };
        if (difference > 0) return { type: 'warning', message: `₹${difference.toLocaleString()} over project value` };
        if (difference < 0) return { type: 'warning', message: `₹${Math.abs(difference).toLocaleString()} under project value` };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Form submitting...", formData);
        setLoading(true);
        try {
            let result;

            // Define allowed fields for the API to prevent sending relation objects
            const allowedFields = [
                'name', 'location', 'type', 'status', 'client_id',
                'start_date', 'expected_end_date', 'project_value', 'organization_id'
            ];

            // Construct payload with only allowed fields and convert dates
            const payload = {};
            allowedFields.forEach(field => {
                if (formData[field] !== undefined) {
                    // Convert empty strings to null for optional fields
                    if (formData[field] === '' && ['start_date', 'expected_end_date', 'location', 'type', 'organization_id'].includes(field)) {
                        payload[field] = null;
                    } else if (field === 'start_date' || field === 'expected_end_date') {
                        // Convert dates from YYYY-MM-DD to dd/mm/yyyy for API
                        payload[field] = formData[field] ? formatApiDate(formData[field]) : null;
                    } else {
                        payload[field] = formData[field];
                    }
                }
            });

            // Handle number fields specifically


            // Handle number fields specifically
            if (payload.project_value === '' || payload.project_value === null) {
                payload.project_value = 0; // Default to 0 as per schema
            } else {
                payload.project_value = Number(payload.project_value);
            }

            // Step 1: Create or update project
            if (isEditMode) {
                console.log("Updating project:", initialData.id);
                result = await api.projects.update(initialData.id, payload);
            } else {
                console.log("Creating project");
                result = await api.projects.create(payload);
            }
            console.log("Project saved:", result);

            // Step 2: Create planned invoices
            if (plannedInvoices.length > 0) {
                const projectId = isEditMode ? initialData.id : result.id;
                console.log("Creating invoices for project:", projectId);

                // Generate invoice numbers based on existing invoices count
                const existingCount = existingInvoices.length;

                for (let i = 0; i < plannedInvoices.length; i++) {
                    const invoice = plannedInvoices[i];

                    // Validate required fields
                    if (!invoice.amount || !invoice.due_date) {
                        alert(`Invoice ${i + 1}: Amount and Due Date are required`);
                        continue;
                    }

                    const invoicePayload = {
                        invoice_number: `INV-${(existingCount + i + 1).toString().padStart(3, '0')}`,
                        client_id: formData.client_id,
                        project_id: projectId,
                        amount: Number(invoice.amount),
                        generated_date: formatApiDate(invoice.generated_date),
                        due_date: formatApiDate(invoice.due_date),
                        description: invoice.description || '',
                        status: 'draft',
                    };

                    try {
                        await api.invoices.create(invoicePayload);
                        console.log(`Invoice ${i + 1} created`);
                    } catch (error) {
                        console.error(`Failed to create invoice ${i + 1}:`, error);
                    }
                }
            }

            if (onSuccess) {
                onSuccess();
            } else {
                navigate('/projects');
            }
        } catch (error) {
            console.error('Failed to save project', error);
            alert(error.response?.data?.message || 'Failed to save project');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        console.log("Field change:", name, value);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="project-form-page">
            {!onCancel && (
                <div className="page-header">
                    <button className="back-btn" onClick={() => navigate('/projects')}>
                        <ArrowLeft size={20} />
                        Back
                    </button>
                    <h2>{isEditMode ? 'Edit Project' : 'New Project'}</h2>
                </div>
            )}

            <div className={`form-container ${onCancel ? 'drawer-form' : ''}`}>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-field full-width">
                            <label>Project Name</label>
                            <input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Modern Villa Design"
                            />
                        </div>

                        <div className="form-field">
                            <label>Client</label>
                            <select
                                name="client_id"
                                value={formData.client_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Client</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-field">
                            <label>Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="planned">Planning</option>
                                <option value="ongoing">Ongoing</option>
                                <option value="completed">Completed</option>
                                <option value="paused">Paused</option>
                            </select>
                        </div>

                        <div className="form-field">
                            <label>Start Date <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>(dd/mm/yyyy)</span></label>
                            <input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label>Expected End Date <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>(dd/mm/yyyy)</span></label>
                            <input
                                type="date"
                                name="expected_end_date"
                                value={formData.expected_end_date}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>Project Value</label>
                            <input
                                name="project_value"
                                type="number"
                                value={formData.project_value}
                                onChange={handleChange}
                                placeholder="0"
                            />
                        </div>

                        <div className="form-field">
                            <label>Type</label>
                            <input
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                placeholder="e.g. Interior, Structure"
                            />
                        </div>

                        <div className="form-field full-width">
                            <label>Location</label>
                            <input
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="Project Address"
                            />
                        </div>
                    </div>

                    {/* Invoice Schedule Section */}
                    <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Invoice Schedule (Optional)</h3>
                            <button
                                type="button"
                                onClick={addInvoice}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 16px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                <Plus size={16} /> Add Invoice
                            </button>
                        </div>

                        {/* Summary Info */}
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', padding: '12px', backgroundColor: 'white', borderRadius: '6px' }}>
                            <div>
                                <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Project Value</span>
                                <span style={{ fontSize: '18px', fontWeight: '600' }}>₹{Number(formData.project_value || 0).toLocaleString()}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>Total Planned</span>
                                <span style={{ fontSize: '18px', fontWeight: '600' }}>₹{calculateTotalPlanned().toLocaleString()}</span>
                            </div>
                            {getTotalValidation() && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                                    <AlertCircle size={16} color={getTotalValidation().type === 'success' ? '#10b981' : '#f59e0b'} />
                                    <span style={{ fontSize: '14px', color: getTotalValidation().type === 'success' ? '#10b981' : '#f59e0b' }}>
                                        {getTotalValidation().message}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Existing Invoices (Edit Mode) */}
                        {isEditMode && existingInvoices.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#475569' }}>
                                    Existing Invoices ({existingInvoices.length})
                                </h4>
                                {existingInvoices.map(inv => (
                                    <div key={inv.id} style={{
                                        padding: '12px',
                                        backgroundColor: inv.status === 'paid' ? '#f0fdf4' : 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        marginBottom: '8px',
                                        opacity: inv.status === 'paid' ? 0.7 : 1
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <span style={{ fontWeight: '500', marginRight: '12px' }}>{inv.invoiceNumber}</span>
                                                <span style={{ fontSize: '14px', color: '#64748b' }}>{inv.description}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <span style={{ fontWeight: '600' }}>₹{Number(inv.amount).toLocaleString()}</span>
                                                <span style={{
                                                    fontSize: '12px',
                                                    padding: '4px 8px',
                                                    backgroundColor: inv.status === 'paid' ? '#10b981' : '#94a3b8',
                                                    color: 'white',
                                                    borderRadius: '4px'
                                                }}>
                                                    {inv.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Planned Invoices */}
                        {plannedInvoices.length > 0 && (
                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px', color: '#475569' }}>
                                    New Invoices to Create ({plannedInvoices.length})
                                </h4>
                                {plannedInvoices.map((invoice, index) => (
                                    <div key={invoice.tempId} style={{
                                        padding: '15px',
                                        backgroundColor: 'white',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                            <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Invoice #{index + 1}</h5>
                                            <button
                                                type="button"
                                                onClick={() => removeInvoice(invoice.tempId)}
                                                style={{
                                                    backgroundColor: 'transparent',
                                                    border: 'none',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    padding: '4px'
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                                                    Amount <span style={{ color: 'red' }}>*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={invoice.amount}
                                                    onChange={(e) => updateInvoice(invoice.tempId, 'amount', e.target.value)}
                                                    placeholder="Enter amount"
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: '4px',
                                                        fontSize: '14px'
                                                    }}
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                                                    Due Date <span style={{ color: 'red' }}>*</span> <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>(dd/mm/yyyy)</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    value={invoice.due_date}
                                                    onChange={(e) => updateInvoice(invoice.tempId, 'due_date', e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: '4px',
                                                        fontSize: '14px'
                                                    }}
                                                    required
                                                />
                                            </div>

                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginBottom: '4px' }}>
                                                    Description
                                                </label>
                                                <input
                                                    type="text"
                                                    value={invoice.description}
                                                    onChange={(e) => updateInvoice(invoice.tempId, 'description', e.target.value)}
                                                    placeholder="e.g., Advance Payment, Milestone 1"
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        border: '1px solid #cbd5e1',
                                                        borderRadius: '4px',
                                                        fontSize: '14px'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {plannedInvoices.length === 0 && (!isEditMode || existingInvoices.length === 0) && (
                            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                <p>No invoices planned yet. Click "Add Invoice" to create invoice schedule.</p>
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onCancel || (() => navigate('/projects'))}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            <Save size={18} />
                            {loading ? 'Saving...' : (isEditMode ? 'Update Project' : 'Save Project')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
