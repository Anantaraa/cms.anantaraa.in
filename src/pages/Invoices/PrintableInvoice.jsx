import React from 'react';
import { formatDate } from '../../utils/dateUtils';
import './PrintableInvoice.css';

const PrintableInvoice = React.forwardRef(({ invoice }, ref) => {
    if (!invoice) return null;

    return (
        <div className="printable-invoice" ref={ref}>
            <div className="invoice-header">
                <div className="company-logo">
                    {/* Placeholder for Logo if needed, or just text */}
                    <h1>INVOICE</h1>
                    <div className="separator"></div>
                </div>
            </div>

            <div className="invoice-meta-grid">
                <div className="billed-to">
                    <h4>ISSUED TO:</h4>
                    <p className="client-name">{invoice.client}</p>
                    {/* Placeholder address - in real app would come from client data */}
                    <p>Client Address</p>
                    <p>City, Country</p>
                </div>
                <div className="invoice-details">
                    <div className="meta-row">
                        <span className="label">INVOICE NO:</span>
                        <span className="value">{invoice.invoiceNumber || invoice.id}</span>
                    </div>
                    <div className="meta-row">
                        <span className="label">DATE:</span>
                        <span className="value">{formatDate(invoice.date)}</span>
                    </div>
                    <div className="meta-row">
                        <span className="label">DUE DATE:</span>
                        <span className="value">{formatDate(invoice.dueDate)}</span>
                    </div>
                </div>
            </div>

            <div className="invoice-items-table">
                <table>
                    <thead>
                        <tr>
                            <th className="item-desc">DESCRIPTION</th>
                            <th className="item-price text-right">UNIT PRICE</th>
                            <th className="item-qty text-center">QTY</th>
                            <th className="item-total text-right">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* 
                            If invoice has items, map them. 
                            If not (simple invoice), use the main amount and description as one item.
                        */}
                        {invoice.items && invoice.items.length > 0 ? (
                            invoice.items.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{item.description}</td>
                                    <td className="text-right">₹{Number(item.unitPrice).toLocaleString()}</td>
                                    <td className="text-center">{item.qty}</td>
                                    <td className="text-right">₹{(item.unitPrice * item.qty).toLocaleString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td>
                                    <div className="main-desc">{invoice.project || 'Service'}</div>
                                    <div className="sub-desc">{invoice.description}</div>
                                </td>
                                <td className="text-right">₹{Number(invoice.amount).toLocaleString()}</td>
                                <td className="text-center">1</td>
                                <td className="text-right">₹{Number(invoice.amount).toLocaleString()}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="invoice-footer">
                <div className="totals">
                    <div className="total-row subtotal">
                        <span>SUBTOTAL</span>
                        <span>₹{Number(invoice.amount).toLocaleString()}</span>
                    </div>
                    <div className="total-row tax">
                        <span>Tax (0%)</span>
                        <span>₹0</span>
                    </div>
                    <div className="total-row grand-total">
                        <span>TOTAL</span>
                        <span>₹{Number(invoice.amount).toLocaleString()}</span>
                    </div>
                </div>

                <div className="signature-section">
                    <div className="signature-line"></div>
                    <p>Authorized Signature</p>
                </div>
            </div>

            <div className="footer-company-info">
                <p>Anantaraa Design Studio • +91 9574652320 • hello@anantaraa.in</p>
            </div>
        </div>
    );
});

export default PrintableInvoice;
