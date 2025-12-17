import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../services/api';
import './Finance.css';

export default function IncomeList() {
    const [income, setIncome] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const data = await api.finance.getIncome();
            setIncome(data);
            setLoading(false);
        };
        load();
    }, []);

    return (
        <div className="finance-page">
            <div className="finance-header">
                <h2>Income</h2>
                <button className="btn-primary" onClick={() => window.location.href = '/income/new'}><Plus size={16} /> New Entry</button>
            </div>
            <div className="finance-table-container">
                {loading ? <div>Loading...</div> : (
                    <table className="finance-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Client</th>
                                <th>Project</th>
                                <th>Method</th>
                                <th className="text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {income.map(item => (
                                <tr key={item.id}>
                                    <td>{item.date}</td>
                                    <td>{item.client}</td>
                                    <td className="text-muted">{item.project}</td>
                                    <td>{item.method}</td>
                                    <td className="text-right text-success font-medium">₹{item.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
