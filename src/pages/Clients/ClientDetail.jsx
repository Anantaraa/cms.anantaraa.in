// fixed header
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin, Building, FileText, RefreshCw, Edit2, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import './ClientDetail.css';

export default function ClientDetail({ clientData, isDrawer = false, onEdit, onStatusUpdate, onNavigate, onClose, onDeleteSuccess }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [client, setClient] = useState(clientData || null);
    const [loading, setLoading] = useState(!clientData);

    const handleEdit = () => {
        if (onEdit) onEdit(null, client);
        else console.log('Edit clicked in standalone mode');
    };

    const handleStatus = () => {
        if (onStatusUpdate) onStatusUpdate(null, client);
    };

    const refreshClientData = async () => {
        const targetId = id || clientData?.id || client?.id;
        if (!targetId) return;

        try {
            const freshData = await api.clients.getById(targetId);
            setClient(freshData);
        } catch (error) {
            console.error('Failed to refresh client data', error);
        }
    };

    useEffect(() => {
        // Strategy: Stale-While-Revalidate
        // Always fetch fresh data to ensure nested relations (projects, invoices) are present.

        let initialLoadDone = false;
        if (clientData && !initialLoadDone) {
            setClient(clientData);
            setLoading(false);
            initialLoadDone = true;
        }

        const targetId = id || clientData?.id;

        const loadData = async () => {
            if (!targetId) return;

            try {
                if (!clientData) setLoading(true);

                const fullClientData = await api.clients.getById(targetId);
                setClient(fullClientData);

            } catch (error) {
                console.error('Failed to load client data', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id, clientData]);

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
            return;
        }

        try {
            await api.clients.delete(client.id);
            if (isDrawer && onDeleteSuccess) {
                onDeleteSuccess(); // Refresh list and close drawer
            } else if (isDrawer && onClose) {
                onClose();
            } else {
                navigate('/clients');
            }
        } catch (error) {
            console.error('Failed to delete client', error);
            alert('Failed to delete client');
        }
    };

    if (loading) return <div className="loading-state">Loading Client Details...</div>;
    if (!client) return <div className="error-state">Client not found</div>;

    return (
        <div className={`client-detail-page ${isDrawer ? 'drawer-mode' : ''}`}>
            <div className="detail-header">
                {!isDrawer && (
                    <button className="back-btn" onClick={() => navigate('/clients')}>
                        <ArrowLeft size={20} />
                        Back to Clients
                    </button>
                )}
                <div className="header-container-flex" style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="header-content" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div className="avatar-lg" style={{ width: '64px', height: '64px', fontSize: '24px' }}>{client.name.charAt(0)}</div>
                        <div className="title-info">
                            <h1>{client.name}</h1>
                            <span className={`status-badge ${client.status.toLowerCase()}`}>{client.status}</span>
                        </div>
                    </div>
                    <div className="header-actions-right">
                        <button className="icon-btn" onClick={handleStatus} title="Update Status">
                            <RefreshCw size={20} />
                        </button>
                        <button className="icon-btn" onClick={handleEdit} title="Edit">
                            <Edit2 size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="detail-grid">
                <div className="info-card">
                    <h3>Contact Information</h3>
                    <div className="info-list">
                        <div className="info-item">
                            <Mail size={18} />
                            <span>{client.email}</span>
                        </div>
                        <div className="info-item">
                            <Phone size={18} />
                            <span>{client.contactNumber || client.phone || 'No phone provided'}</span>
                        </div>
                        <div className="info-item">
                            <MapPin size={18} />
                            <span>{client.address || 'No address provided'}</span>
                        </div>
                    </div>

                    <div className="divider"></div>

                    <h3>Budget Overview</h3>
                    <div className="budget-display">
                        <span className="currency">₹</span>
                        <span className="amount">{(client.budget / 1000).toFixed(2)}K</span>
                        <span className="label">Planned Budget</span>
                    </div>

                    <div className="divider"></div>

                    <h3>Notes</h3>
                    <p className="notes-text">{client.notes}</p>
                </div>

                <div className="related-lists">
                    <div className="section-card">
                        <div className="card-header">
                            <Building size={18} />
                            <h3>Projects</h3>
                        </div>
                        <div className="simple-list">
                            {client.projects && client.projects.map(p => (
                                <div
                                    key={p.id}
                                    className="list-item clickable"
                                    onClick={() => {
                                        if (onNavigate) {
                                            onNavigate('project', p);
                                        } else {
                                            navigate(`/projects/${p.id}`);
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <span className="item-name">{p.name}</span>
                                    <span className="item-meta">{p.status}</span>
                                </div>
                            ))}
                            {(!client.projects || client.projects.length === 0) && <p className="empty-text">No projects linked.</p>}
                        </div>
                    </div>

                    <div className="section-card">
                        <div className="card-header">
                            <FileText size={18} />
                            <h3>Recent Invoices</h3>
                        </div>
                        <div className="simple-list">
                            {client.invoices && client.invoices.map(inv => (
                                <div
                                    key={inv.id}
                                    className="list-item clickable"
                                    onClick={() => {
                                        if (onNavigate) {
                                            onNavigate('invoice', inv);
                                        } else {
                                            navigate(`/invoices/${inv.id}`);
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <span className="item-name">{inv.invoiceNumber || inv.id?.substring(0, 8) + '...'}</span>
                                    <span className="item-amount">₹{inv.amount.toLocaleString()}</span>
                                    <span className={`status-badge-sm ${inv.status}`}>{inv.status}</span>
                                </div>
                            ))}
                            {(!client.invoices || client.invoices.length === 0) && <p className="empty-text">No invoices found.</p>}
                        </div>
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
                                Delete Client
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
