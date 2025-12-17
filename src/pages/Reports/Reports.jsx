import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download } from 'lucide-react';
import './Reports.css';

export default function Reports() {
    // Mock data for reports
    const monthlyData = [
        { name: 'Jan', income: 4000, expense: 2400 },
        { name: 'Feb', income: 3000, expense: 1398 },
        { name: 'Mar', income: 2000, expense: 9800 },
        { name: 'Apr', income: 2780, expense: 3908 },
        { name: 'May', income: 1890, expense: 4800 },
        { name: 'Jun', income: 2390, expense: 3800 },
    ];

    const projectStatusData = [
        { name: 'Ongoing', value: 5 },
        { name: 'Completed', value: 12 },
        { name: 'Planning', value: 3 },
        { name: 'Halted', value: 1 },
    ];
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="reports-page">
            <div className="reports-header">
                <h2>Reports & Analytics</h2>
                <button className="btn-secondary">
                    <Download size={16} /> Export PDF
                </button>
            </div>

            <div className="reports-grid">
                <div className="report-card full-width">
                    <h3>Annual Income vs Expense</h3>
                    <div className="chart-container-lg">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                                <Bar dataKey="income" fill="var(--color-text-main)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" fill="var(--color-text-muted)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="report-card">
                    <h3>Project Distributions</h3>
                    <div className="chart-container-md">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={projectStatusData}
                                    cx="50%" cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {projectStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="legend">
                            {projectStatusData.map((entry, index) => (
                                <div key={index} className="legend-item">
                                    <span className="dot" style={{ background: COLORS[index % COLORS.length] }}></span>
                                    <span className="label">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="report-card">
                    <h3>Summary Metrics</h3>
                    <div className="metrics-list">
                        <div className="metric-item">
                            <span className="label">YTD Income</span>
                            <span className="value">₹12,45,000</span>
                        </div>
                        <div className="metric-item">
                            <span className="label">YTD Expense</span>
                            <span className="value">₹4,50,000</span>
                        </div>
                        <div className="metric-item">
                            <span className="label">Profit Margin</span>
                            <span className="value success">63.8%</span>
                        </div>
                        <div className="metric-item">
                            <span className="label">Avg. Project Value</span>
                            <span className="value">₹32,00,000</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
