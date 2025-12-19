import React, { useState } from 'react';
import { formatDate } from '../../utils/dateUtils';
import { ChevronUp, ChevronDown } from 'lucide-react';
import './OutstandingInvoices.css';

export default function OutstandingInvoices({ invoices, onInvoiceClick, onViewAll }) {
    const [sortConfig, setSortConfig] = useState({ key: 'dueDate', direction: 'asc' });

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedInvoices = [...invoices].sort((a, b) => {
        if (!a[sortConfig.key] || !b[sortConfig.key]) return 0;

        // Handle numbers
        if (sortConfig.key === 'amount') {
            return sortConfig.direction === 'asc'
                ? a.amount - b.amount
                : b.amount - a.amount;
        }

        // Handle dates
        if (sortConfig.key === 'dueDate') {
            return sortConfig.direction === 'asc'
                ? new Date(a.dueDate) - new Date(b.dueDate)
                : new Date(b.dueDate) - new Date(a.dueDate);
        }

        // Handle strings
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    };

    return (
        <div className="invoices-section">
            <div className="section-header">
                <h3>Outstanding Invoices</h3>
                <button className="view-all-btn" onClick={onViewAll}>View All</button>
            </div>
            <div className="table-wrapper">
                <table className="invoices-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('client')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Client {getSortIcon('client')}
                                </div>
                            </th>
                            <th onClick={() => handleSort('project')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Project {getSortIcon('project')}
                                </div>
                            </th>
                            <th onClick={() => handleSort('dueDate')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    Due Date {getSortIcon('dueDate')}
                                </div>
                            </th>
                            <th className="text-right" onClick={() => handleSort('amount')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                    Amount {getSortIcon('amount')}
                                </div>
                            </th>
                            <th className="text-center" onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                    Status {getSortIcon('status')}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedInvoices.map((inv) => (
                            <tr
                                key={inv.id}
                                onClick={() => onInvoiceClick && onInvoiceClick(inv)}
                                style={{ cursor: onInvoiceClick ? 'pointer' : 'default' }}
                            >
                                <td className="font-medium">{inv.client}</td>
                                <td className="text-muted">{inv.project}</td>
                                <td className="text-muted">{formatDate(inv.dueDate)}</td>
                                <td className="text-right font-medium">₹{Number(inv.amount).toLocaleString()}</td>
                                <td className="text-center">
                                    <span className={`status-badge ${inv.status.toLowerCase()}`}>
                                        {inv.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
