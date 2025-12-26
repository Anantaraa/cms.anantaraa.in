import apiClient from './axiosClient';

// Helper to handle Axios responses
const handleRequest = async (request, mapper = null) => {
    try {
        const response = await request;
        // Backend wraps data in { success: true, message: "...", data: {...} }
        const data = response.data?.data !== undefined ? response.data.data : response.data;

        if (mapper && Array.isArray(data)) {
            return data.map(mapper);
        } else if (mapper && data) {
            return mapper(data);
        }
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Helper specifically for list endpoints to guarantee array return
const handleListRequest = async (request, mapper = null) => {
    try {
        const response = await request;
        // Backend wraps data in { success: true, message: "...", data: [...] }
        const data = response.data?.data !== undefined ? response.data.data : response.data;

        if (Array.isArray(data)) {
            // Filter out null/undefined items from raw data immediately
            const validData = data.filter(item => item !== null && item !== undefined);
            return mapper ? validData.map(mapper) : validData;
        }
        // If data is null/undefined or not an array, return empty array for lists
        return [];
        return [];
    } catch (error) {
        // Re-throw so caller can handle (e.g. cancellation)
        console.error('API List Error:', error);
        throw error;
    }
};

// Mappers to transform Backend (snake_case/nested) -> Frontend (camelCase/flat)
const mappers = {
    client: (data) => ({
        id: data.id,
        name: data.name || 'Unknown Client',
        email: data.email || '',
        contactNumber: data.contact_number || '',
        budget: data.budget || 0,
        status: data.status || 'active',
        projectCount: data.projects ? (Array.isArray(data.projects) ? data.projects.length : data.projects.count) : 0,
        address: data.address || '',
        notes: data.notes || '',
        referenceClientId: data.reference_client_id || null,
        organizationId: data.organization_id || null,
        createdAt: data.created_at || '',
        updatedAt: data.updated_at || '',
        // Nested Data
        projects: Array.isArray(data.projects) ? data.projects.map(p => ({
            id: p.id,
            name: p.name,
            projectValue: Number(p.project_value || 0),
            status: p.status,
            startDate: p.start_date || '',
            expectedEndDate: p.expected_end_date || '',
            location: p.location || '',
            type: p.type || ''
        })) : [],
        invoices: Array.isArray(data.invoices) ? data.invoices.map(i => ({
            id: i.id,
            invoiceNumber: i.invoice_number,
            amount: i.amount,
            status: i.status,
            projectId: i.project_id,
            project: i.projects?.name || i.project_name || 'Unknown',
            generatedDate: i.generated_date || '',
            dueDate: i.due_date || '',
            description: i.description || ''
        })) : []
    }),
    project: (data) => ({
        id: data.id,
        name: data.name || 'Untitled Project',
        client: data.client_name || data.clients?.name || 'Unknown',
        clientId: data.client_id,
        clientName: data.client_name || data.clients?.name || '',
        status: data.status || 'planned',
        startDate: data.start_date || '',
        expectedEndDate: data.expected_end_date || '',
        completion: data.completion || 0,
        projectValue: Number(data.project_value || 0),
        location: data.location || '',
        type: data.type || '',
        income: Number(data.income || 0),
        expense: Number(data.expense || 0),
        description: data.description || '',
        team: data.team || [],
        totalInvoices: data.total_invoices || 0,
        totalExpenses: data.total_expenses || 0,
        organizationId: data.organization_id || null,
        createdAt: data.created_at || '',
        updatedAt: data.updated_at || '',
        // Nested Data
        invoices: Array.isArray(data.invoices) ? data.invoices.map(i => ({
            id: i.id,
            invoiceNumber: i.invoice_number,
            amount: i.amount,
            generatedDate: i.generated_date || '',
            dueDate: i.due_date || '',
            status: i.status,
            description: i.description || '',
            responsiblePerson: i.responsible_person || '',
            createdAt: i.created_at || ''
        })) : [],
        quotations: Array.isArray(data.quotations) ? data.quotations.map(q => ({
            id: q.id,
            description: q.description || '',
            amount: q.amount,
            date: q.date || '',
            status: q.status || 'active',
            createdAt: q.created_at || ''
        })) : [],
        expenses: Array.isArray(data.expenses) ? data.expenses.map(e => ({
            id: e.id,
            amount: e.amount,
            description: e.description,
            expenseDate: e.expense_date || '',
            responsiblePerson: e.responsible_person || '',
            status: e.status || 'approved',
            createdAt: e.created_at || ''
        })) : [],
        clients: data.clients ? {
            id: data.clients.id,
            name: data.clients.name,
            email: data.clients.email,
            contactNumber: data.clients.contact_number,
            address: data.clients.address,
            budget: data.clients.budget,
            status: data.clients.status,
            createdAt: data.clients.created_at || '',
            updatedAt: data.clients.updated_at || ''
        } : null
    }),
    invoice: (data) => ({
        id: data.id,
        invoiceNumber: data.invoice_number || '',
        amount: data.amount || 0,
        generatedDate: data.generated_date || '',
        dueDate: data.due_date || '',
        status: data.status || 'draft',
        client: data.client_name || data.clients?.name || 'Unknown',
        clientId: data.client_id,
        clientName: data.client_name || data.clients?.name || '',
        project: data.project_name || data.projects?.name || '',
        projectId: data.project_id,
        projectName: data.project_name || data.projects?.name || '',
        description: data.description || '',
        responsiblePerson: data.responsible_person || '',
        responsibleUserId: data.responsible_user_id || null,
        organizationId: data.organization_id || null,
        createdAt: data.created_at || '',
        updatedAt: data.updated_at || '',
        items: data.items || [],
        // Nested client and project objects
        clients: data.clients ? {
            id: data.clients.id,
            name: data.clients.name,
            contactNumber: data.clients.contact_number,
            address: data.clients.address,
            budget: data.clients.budget,
            status: data.clients.status
        } : null,
        projects: data.projects ? {
            id: data.projects.id,
            name: data.projects.name,
            projectValue: data.projects.project_value,
            location: data.projects.location,
            type: data.projects.type,
            status: data.projects.status
        } : null
    }),
    expense: (data) => ({
        id: data.id,
        expenseDate: data.expense_date || '',
        description: data.description || '',
        amount: data.amount || 0,
        responsiblePerson: data.responsible_person || '',
        responsibleUserId: data.responsible_user_id || null,
        status: data.status || 'approved',
        projectId: data.project_id || '',
        projectName: data.project_name || data.projects?.name || '',
        project: data.project_name || data.projects?.name || '',
        clientId: data.projects?.client_id || '',
        client: data.client_name || data.projects?.clients?.name || '',
        clientName: data.client_name || data.projects?.clients?.name || '',
        organizationId: data.organization_id || null,
        createdAt: data.created_at || '',
        updatedAt: data.updated_at || '',
        // Nested project data
        projects: data.projects ? {
            id: data.projects.id,
            name: data.projects.name,
            startDate: data.projects.start_date || '',
            expectedEndDate: data.projects.expected_end_date || '',
            projectValue: data.projects.project_value || 0,
            location: data.projects.location || '',
            type: data.projects.type || '',
            status: data.projects.status || '',
            clientId: data.projects.client_id || '',
            clients: data.projects.clients ? {
                id: data.projects.clients.id,
                name: data.projects.clients.name,
                contactNumber: data.projects.clients.contact_number || '',
                address: data.projects.clients.address || ''
            } : null
        } : null
    }),
    income: (data) => ({
        id: data.id,
        receivedDate: data.received_date || '',
        amountReceived: data.amount_received || 0,
        paymentMethod: data.payment_method || '',
        status: data.status || 'received',
        description: data.description || '',
        invoiceId: data.invoice_id || null,
        invoiceNumber: data.invoice_number || data.invoices?.invoice_number || '',
        client: data.client_name || data.invoices?.clients?.name || '',
        clientName: data.client_name || data.invoices?.clients?.name || '',
        project: data.project_name || data.invoices?.projects?.name || '',
        projectName: data.project_name || data.invoices?.projects?.name || '',
        organizationId: data.organization_id || null,
        createdAt: data.created_at || '',
        updatedAt: data.updated_at || '',
        // Nested invoice data
        invoices: data.invoices ? {
            id: data.invoices.id,
            invoiceNumber: data.invoices.invoice_number || '',
            amount: data.invoices.amount || 0,
            generatedDate: data.invoices.generated_date || '',
            dueDate: data.invoices.due_date || '',
            status: data.invoices.status || '',
            clients: data.invoices.clients ? {
                id: data.invoices.clients.id,
                name: data.invoices.clients.name
            } : null,
            projects: data.invoices.projects ? {
                id: data.invoices.projects.id,
                name: data.invoices.projects.name
            } : null
        } : null
    }),
    projectSummary: (data) => ({
        project: data.project ? {
            id: data.project.id,
            name: data.project.name,
            clientName: data.project.clients?.name || '',
            startDate: data.project.start_date || '',
            expectedEndDate: data.project.expected_end_date || '',
            projectValue: data.project.project_value || 0,
            status: data.project.status || ''
        } : null,
        financials: {
            totalInvoiced: data.financials?.total_invoiced || 0,
            totalCollected: data.financials?.total_collected || 0,
            totalExpenses: data.financials?.total_expenses || 0,
            netIncome: data.financials?.net_income || 0,
            outstandingAmount: data.financials?.outstanding_amount || 0
        },
        stats: {
            invoiceCount: data.stats?.invoice_count || 0,
            expenseCount: data.stats?.expense_count || 0
        }
    }),
    clientSummary: (data) => ({
        client: data.client ? {
            id: data.client.id,
            name: data.client.name,
            email: data.client.email || '',
            contactNumber: data.client.contact_number || '',
            address: data.client.address || '',
            status: data.client.status || ''
        } : null,
        financials: {
            totalInvoiced: data.financials?.total_invoiced || 0,
            totalCollected: data.financials?.total_collected || 0,
            netIncome: data.financials?.net_income || 0,
            outstandingAmount: data.financials?.outstanding_amount || 0
        },
        stats: {
            projectCount: data.stats?.project_count || 0,
            invoiceCount: data.stats?.invoice_count || 0
        }
    }),
    dashboardSummary: (data) => ({
        totalClients: data.totalClients || 0,
        totalProjects: data.totalProjects || 0,
        financials: {
            revenue: data.financials?.revenue || 0,
            expenses: data.financials?.expenses || 0,
            profit: data.financials?.profit || 0,
            outstanding: data.financials?.outstanding || 0
        },
        widgets: {
            pendingInvoices: data.widgets?.pending_invoices || 0
        }
    })
};

export const api = {
    // Dashboard Metrics
    dashboard: {
        getStats: async () => {
            try {
                const [clients, projects, invoices] = await Promise.all([
                    apiClient.get('/api/v1/clients'),
                    apiClient.get('/api/v1/projects'),
                    apiClient.get('/api/v1/invoices')
                ]);

                const clientData = clients.data?.data || clients.data || [];
                const projectData = projects.data?.data || projects.data || [];
                const invoiceData = invoices.data?.data || invoices.data || [];

                // Calculate stats
                const totalClients = clientData.length;
                const activeClients = clientData.filter(c => c.status === 'active').length;

                const runningProjects = projectData.filter(p => p.status === 'ongoing').length;
                const notStartedProjects = projectData.filter(p => p.status === 'planned').length;
                const completedProjects = projectData.filter(p => p.status === 'completed').length;

                const outstandingInvoices = invoiceData.filter(i => i.status === 'sent' || i.status === 'overdue');
                const outstandingInvoicesCount = outstandingInvoices.length;
                const outstandingInvoicesAmount = outstandingInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

                return {
                    totalClients,
                    activeClients,
                    runningProjects,
                    notStartedProjects,
                    completedProjects,
                    outstandingInvoicesCount,
                    outstandingInvoicesAmount
                };
            } catch (error) {
                console.error('Failed to fetch dashboard stats', error);
                // Return zeros on error to prevent crash
                return {
                    totalClients: 0,
                    activeClients: 0,
                    runningProjects: 0,
                    notStartedProjects: 0,
                    completedProjects: 0,
                    outstandingInvoicesCount: 0,
                    outstandingInvoicesAmount: 0
                };
            }
        },
        getProjectProfitability: async () => {
            try {
                const response = await apiClient.get('/api/v1/projects');
                const data = response.data?.data || response.data || [];
                return data.map(p => ({
                    id: p.id,
                    name: p.name,
                    income: Number(p.income) || 0,
                    expense: Number(p.expense) || 0,
                    profit: (Number(p.income) || 0) - (Number(p.expense) || 0)
                })).sort((a, b) => b.profit - a.profit).slice(0, 5); // Top 5 profitable
            } catch (error) {
                console.error("Failed to fetch project profitability", error);
                return [];
            }
        },
        getOutstandingInvoices: async () => {
            try {
                const response = await apiClient.get('/api/v1/invoices');
                const data = response.data?.data || response.data || [];
                return data
                    .filter(i => i.status === 'sent' || i.status === 'overdue')
                    .map(mappers.invoice) // Use existing mapper
                    .slice(0, 5); // Return top 5
            } catch (error) {
                console.error("Failed to fetch outstanding invoices", error);
                return [];
            }
        }
    },

    // Clients
    clients: {
        getAll: (options) => handleListRequest(apiClient.get('/api/v1/clients', options), mappers.client),
        getById: (id, options) => handleRequest(apiClient.get(`/api/v1/clients/${id}`, options), mappers.client),
        create: (data, options) => handleRequest(apiClient.post('/api/v1/clients', data, options), mappers.client),
        update: (id, data, options) => handleRequest(apiClient.put(`/api/v1/clients/${id}`, data, options), mappers.client),
        delete: (id, options) => handleRequest(apiClient.delete(`/api/v1/clients/${id}`, options))
    },

    // Projects
    projects: {
        getAll: (options) => handleListRequest(apiClient.get('/api/v1/projects', options), mappers.project),
        getById: (id, options) => handleRequest(apiClient.get(`/api/v1/projects/${id}`, options), mappers.project),
        create: (data, options) => handleRequest(apiClient.post('/api/v1/projects', data, options), mappers.project),
        update: (id, data, options) => handleRequest(apiClient.put(`/api/v1/projects/${id}`, data, options), mappers.project),
        delete: (id, options) => handleRequest(apiClient.delete(`/api/v1/projects/${id}`, options))
    },

    // Invoices
    invoices: {
        getAll: (options) => handleListRequest(apiClient.get('/api/v1/invoices', options), mappers.invoice),
        getById: (id, options) => handleRequest(apiClient.get(`/api/v1/invoices/${id}`, options), mappers.invoice),
        create: (data, options) => handleRequest(apiClient.post('/api/v1/invoices', data, options), mappers.invoice),
        update: (id, data, options) => handleRequest(apiClient.put(`/api/v1/invoices/${id}`, data, options), mappers.invoice),
        delete: (id, options) => handleRequest(apiClient.delete(`/api/v1/invoices/${id}`, options))
    },

    // Finance - Income
    income: {
        getAll: (options) => handleListRequest(apiClient.get('/api/v1/income', options), mappers.income),
        getById: (id, options) => handleRequest(apiClient.get(`/api/v1/income/${id}`, options), mappers.income),
        create: (data, options) => handleRequest(apiClient.post('/api/v1/income', data, options), mappers.income),
        update: (id, data, options) => handleRequest(apiClient.put(`/api/v1/income/${id}`, data, options), mappers.income),
        delete: (id, options) => handleRequest(apiClient.delete(`/api/v1/income/${id}`, options))
    },

    // Finance - Expenses
    expenses: {
        getAll: (options) => handleListRequest(apiClient.get('/api/v1/expenses', options), mappers.expense),
        getById: (id, options) => handleRequest(apiClient.get(`/api/v1/expenses/${id}`, options), mappers.expense),
        create: (data, options) => handleRequest(apiClient.post('/api/v1/expenses', data, options), mappers.expense),
        update: (id, data, options) => handleRequest(apiClient.put(`/api/v1/expenses/${id}`, data, options), mappers.expense),
        delete: (id, options) => handleRequest(apiClient.delete(`/api/v1/expenses/${id}`, options))
    },

    // Finance (Legacy - kept for backward compatibility)
    finance: {
        getIncome: () => handleListRequest(apiClient.get('/api/v1/income'), mappers.income),
        getExpenses: () => handleListRequest(apiClient.get('/api/v1/expenses'), mappers.expense),
        addExpense: (data) => handleRequest(apiClient.post('/api/v1/expenses', data), mappers.expense),
        addIncome: (data) => handleRequest(apiClient.post('/api/v1/income', data), mappers.income)
    },

    quotations: {
        create: (data) => handleRequest(apiClient.post('/api/v1/quotations', data)),
        delete: (id) => handleRequest(apiClient.delete(`/api/v1/quotations/${id}`))
    },
    // Reports
    reports: {
        getProjectSummary: (id) => handleRequest(apiClient.get(`/api/v1/reports/projects/${id}/summary`), mappers.projectSummary),
        getClientSummary: (id) => handleRequest(apiClient.get(`/api/v1/reports/clients/${id}/summary`), mappers.clientSummary),
        getDashboardSummary: () => handleRequest(apiClient.get('/api/v1/reports/dashboard'), mappers.dashboardSummary)
    }
};
