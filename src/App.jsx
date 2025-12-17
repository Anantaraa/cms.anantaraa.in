import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import RequireAuth from './components/auth/RequireAuth';
import MainLayout from './layouts/MainLayout';
import InvoiceForm from './pages/Invoices/InvoiceForm';
import ExpenseForm from './pages/Finance/ExpenseForm';
import IncomeForm from './pages/Finance/IncomeForm';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientList from './pages/Clients/ClientList';
import ClientForm from './pages/Clients/ClientForm';
import ClientDetail from './pages/Clients/ClientDetail';
import ProjectList from './pages/Projects/ProjectList';
import ProjectForm from './pages/Projects/ProjectForm';
import ProjectDetail from './pages/Projects/ProjectDetail';
import InvoiceList from './pages/Invoices/InvoiceList';
import IncomeList from './pages/Finance/IncomeList';
import ExpenseList from './pages/Finance/ExpenseList';
import Reports from './pages/Reports/Reports';

function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route
                    path="/"
                    element={
                        <RequireAuth>
                            <MainLayout />
                        </RequireAuth>
                    }
                >
                    <Route index element={<Dashboard />} />
                    <Route path="clients" element={<ClientList />} />
                    <Route path="clients/new" element={<ClientForm />} />
                    <Route path="clients/:id" element={<ClientDetail />} />
                    <Route path="projects" element={<ProjectList />} />
                    <Route path="projects/new" element={<ProjectForm />} />
                    <Route path="projects/:id" element={<ProjectDetail />} />
                    <Route path="invoices" element={<InvoiceList />} />
                    <Route path="invoices/new" element={<InvoiceForm />} />
                    <Route path="income" element={<IncomeList />} />
                    <Route path="income/new" element={<IncomeForm />} />
                    <Route path="expenses" element={<ExpenseList />} />
                    <Route path="expenses/new" element={<ExpenseForm />} />
                    <Route path="reports" element={<Reports />} />
                </Route>
            </Routes>
        </AuthProvider>
    );
}

export default App;
