import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './ProjectProfitability.css';

export default function ProjectProfitability({ data }) {
    return (
        <div className="profitability-section">
            <div className="section-header">
                <h3>Project Profitability</h3>
            </div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                        <XAxis
                            dataKey="name"
                            stroke="var(--color-text-muted)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="var(--color-text-muted)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `₹${value / 1000}k`}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            contentStyle={{
                                borderRadius: '4px',
                                border: 'none',
                                boxShadow: 'var(--shadow-md)'
                            }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="income" name="Income" fill="var(--color-text-main)" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="expense" name="Expense" fill="var(--color-text-muted)" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
