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
    } catch (error) {
        console.error('API List Error:', error);
        return []; // Fail safe to empty array
    }
};

// Mappers to transform Backend (snake_case/nested) -> Frontend (camelCase/flat)
const mappers = {
    client: (data) => ({
        id: data.id,
        name: data.name || 'Unknown Client',
        email: data.email || '',
        phone: data.phone || '',
        budget: data.budget || 0,
        status: data.status || 'Active',
        // Handle Supabase count: projects: [{ count: 5 }] or raw count
        projectCount: data.projects ? (Array.isArray(data.projects) ? data.projects.length : data.projects.count) : 0,
        address: data.address || '',
        notes: data.notes || ''
    }),
    project: (data) => ({
        id: data.id,
        name: data.name || 'Untitled Project',
        // Flatten nested client object to string if needed
        client: data.client?.name || data.client || 'Unknown',
        clientId: data.client_id,
        status: data.status || 'Planning',
        startDate: data.start_date || data.startDate || '',
        endDate: data.end_date || data.endDate || '',
        completion: data.completion || 0,
        income: data.income || 0,
        expense: data.expense || 0,
        description: data.description || '',
        location: data.location || '',
        type: data.type || '',
        team: data.team || []
    }),
    invoice: (data) => ({
        id: data.id,
        amount: data.amount || 0,
        date: data.date || '',
        dueDate: data.due_date || data.dueDate || '',
        status: data.status || 'pending',
        client: data.client?.name || data.client || 'Unknown',
        project: data.project?.name || data.project || 'Unknown',
        items: data.items || []
    }),
    expense: (data) => ({
        id: data.id,
        date: data.date || '',
        category: data.category || 'Uncategorized',
        description: data.description || '',
        amount: data.amount || 0,
        responsible: data.responsible || ''
    }),
    income: (data) => ({
        id: data.id,
        date: data.date || '',
        amount: data.amount || 0,
        method: data.method || 'Other',
        client: data.client?.name || data.client || 'Unknown',
        project: data.project?.name || data.project || 'Unknown',
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
                const activeClients = clientData.filter(c => c.status === 'Active').length;

                const runningProjects = projectData.filter(p => p.status === 'Ongoing' || p.status === 'In Progress').length;
                const notStartedProjects = projectData.filter(p => p.status === 'Planned' || p.status === 'Not Started').length;
                const completedProjects = projectData.filter(p => p.status === 'Completed').length;

                const outstandingInvoices = invoiceData.filter(i => i.status === 'pending' || i.status === 'overdue');
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
                    .filter(i => i.status === 'pending' || i.status === 'overdue')
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
        getAll: () => handleListRequest(apiClient.get('/api/v1/clients'), mappers.client),
        getById: (id) => handleRequest(apiClient.get(`/api/v1/clients/${id}`), mappers.client),
        create: (data) => handleRequest(apiClient.post('/api/v1/clients', data), mappers.client),
        update: (id, data) => handleRequest(apiClient.put(`/api/v1/clients/${id}`, data), mappers.client),
        delete: (id) => handleRequest(apiClient.delete(`/api/v1/clients/${id}`))
    },

    // Projects
    projects: {
        getAll: () => handleListRequest(apiClient.get('/api/v1/projects'), mappers.project),
        getById: (id) => handleRequest(apiClient.get(`/api/v1/projects/${id}`), mappers.project),
        create: (data) => handleRequest(apiClient.post('/api/v1/projects', data), mappers.project),
        update: (id, data) => handleRequest(apiClient.put(`/api/v1/projects/${id}`, data), mappers.project),
        delete: (id) => handleRequest(apiClient.delete(`/api/v1/projects/${id}`))
    },

    // Invoices
    invoices: {
        getAll: () => handleListRequest(apiClient.get('/api/v1/invoices'), mappers.invoice),
        getById: (id) => handleRequest(apiClient.get(`/api/v1/invoices/${id}`), mappers.invoice),
        create: (data) => handleRequest(apiClient.post('/api/v1/invoices', data), mappers.invoice),
        update: (id, data) => handleRequest(apiClient.put(`/api/v1/invoices/${id}`, data), mappers.invoice),
        delete: (id) => handleRequest(apiClient.delete(`/api/v1/invoices/${id}`))
    },

    // Finance
    finance: {
        getIncome: () => handleListRequest(apiClient.get('/api/v1/income'), mappers.income),
        getExpenses: () => handleListRequest(apiClient.get('/api/v1/expenses'), mappers.expense),
        addExpense: (data) => handleRequest(apiClient.post('/api/v1/expenses', data), mappers.expense),
        addIncome: (data) => handleRequest(apiClient.post('/api/v1/income', data), mappers.income)
    }
};
