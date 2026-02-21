export const mockDashboardData = {
    stats: [
        { label: "Vendas Totais", value: "R$ 12.450", change: "+12.5%", trendingUp: true },
        { label: "Novos Clientes", value: "85", change: "+5.2%", trendingUp: true },
        { label: "Tickets Médios", value: "R$ 85,00", change: "-2.1%", trendingUp: false },
        { label: "Taxa de Retenção", value: "78%", change: "+3.4%", trendingUp: true },
    ],
    recentSales: [
        { id: 1, customer: "João Silva", service: "Corte de Cabelo", amount: "R$ 50,00", date: "Hoje, 14:00" },
        { id: 2, customer: "Maria Oliveira", service: "Barba e Cabelo", amount: "R$ 80,00", date: "Hoje, 13:30" },
        { id: 3, customer: "Pedro Santos", service: "Luzes", amount: "R$ 120,00", date: "Hoje, 12:45" },
        { id: 4, customer: "Lucas Lima", service: "Corte Kids", amount: "R$ 40,00", date: "Hoje, 11:15" },
    ],
    salesByCategory: [
        { category: "Corte", amount: 4500 },
        { category: "Barba", amount: 2800 },
        { category: "Coloração", amount: 1500 },
        { category: "Produtos", amount: 3650 },
    ],
    appointments: [
        { id: 1, time: "09:00", client: "Carlos Ferreira", service: "Corte Degradê", status: "Concluído", price: "R$ 45,00" },
        { id: 2, time: "10:30", client: "André Santos", service: "Barba", status: "Concluído", price: "R$ 30,00" },
        { id: 3, time: "14:30", client: "Ricardo Antunes", service: "Corte + Barba", status: "Confirmado", price: "R$ 70,00" },
        { id: 4, time: "15:15", client: "João Pedro", service: "Corte Social", status: "Aguardando", price: "R$ 40,00" },
        { id: 5, time: "16:00", client: "Gustavo Lima", service: "Degradê", status: "Aguardando", price: "R$ 45,00" },
        { id: 6, time: "17:00", client: "Felipe Melo", service: "Corte Kids", status: "Livre", price: "-" },
    ]
};
