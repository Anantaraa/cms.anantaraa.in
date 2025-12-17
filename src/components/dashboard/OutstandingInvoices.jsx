import React from 'react';
import './OutstandingInvoices.css';

export default function OutstandingInvoices({ invoices }) {
    return (
        <div className="invoices-section">
            <div className="section-header">
                <h3>Outstanding Invoices</h3>
                <button className="view-all-btn">View All</button>
            </div>
            <div className="table-wrapper">
                <table className="invoices-table">
                    <thead>
                        <tr>
                            <th>Client</th>
                            <th>Project</th>
                            <th>Due Date</th>
                            <th className="text-right">Amount</th>
                            <th className="text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map((inv) => (
                            <tr key={inv.id}>
                                <td className="font-medium">{inv.client}</td>
                                <td className="text-muted">{inv.project}</td>
                                <td className="text-muted">{inv.dueDate}</td>
                                <td className="text-right font-medium">₹{inv.amount.toLocaleString()}</td>
                                <td className="text-center">
                                    <span className={`status-badge ${inv.status}`}>
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
