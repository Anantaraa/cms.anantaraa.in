import React, { useEffect, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { api } from '../../services/api';
import './InvoiceList.css';

export default function InvoiceList() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await api.invoices.getAll();
                setInvoices(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    return (
        <div className="invoice-list-page">
            <div className="page-header-actions">
                <h2>Invoices</h2>
                <div className="actions">
                    <div className="search-box-simple">
                        <Search size={16} />
                        <input type="text" placeholder="Search invoices..." />
                    </div>
                    {/* Assuming useNavigate is imported or will be added */}
                    <button className="btn-primary" onClick={() => window.location.href = '/invoices/new'}>
                        <Plus size={16} /> New Invoice
                    </button>
                </div>
            </div>

            <div className="table-card">
                {loading ? <div>Loading...</div> : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Invoice ID</th>
                                <th>Client</th>
                                <th>Project</th>
                                <th>Date</th>
                                <th>Due Date</th>
                                <th className="text-right">Amount</th>
                                <th className="text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.id}>
                                    <td className="font-mono">{inv.id}</td>
                                    <td>{inv.client}</td>
                                    <td className="text-muted">{inv.project}</td>
                                    <td>{inv.date}</td>
                                    <td>{inv.dueDate}</td>
                                    <td className="text-right font-medium">₹{inv.amount.toLocaleString()}</td>
                                    <td className="text-center">
                                        <span className={`status-badge ${inv.status}`}>{inv.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
