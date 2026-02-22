import { useState, useEffect, useMemo } from 'react';
import { appointmentsStorage, clientsStorage, servicesStorage, AppointmentWithDetails } from '../utils/storage';
import { formatDateLocal } from '../utils/dateUtils';

export interface ChartDayData {
    dayLabel: string;
    dayShort: string;
    date: string;
    count: number;
    revenue: number;
    confirmed: number;
    pending: number;
    isToday: boolean;
}

export const useDashboard = () => {
    const [selectedRange, setSelectedRange] = useState('Últimos 7 dias');
    const [upcomingAppointments, setUpcomingAppointments] = useState<AppointmentWithDetails[]>([]);
    const [weeklyAppointments, setWeeklyAppointments] = useState<AppointmentWithDetails[]>([]);
    const [totalClients, setTotalClients] = useState(0);
    const [totalServices, setTotalServices] = useState(0);
    const [todayCount, setTodayCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [loadTrigger, setLoadTrigger] = useState(0);

    const today = useMemo(() => new Date(), []);
    const todayStr = useMemo(() => formatDateLocal(today), [today]);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Calculate the date range for chart
                const daysBack = selectedRange === 'Este mês' ? 30 : 7;
                const startDate = new Date(today);
                startDate.setDate(startDate.getDate() - (daysBack - 1));
                const startStr = formatDateLocal(startDate);

                const [upcoming, weeklyData, clients, services] = await Promise.all([
                    appointmentsStorage.getUpcoming(8),
                    appointmentsStorage.getByMonthRange(startStr, todayStr),
                    clientsStorage.getClients(),
                    servicesStorage.getServices(),
                ]);
                setUpcomingAppointments(upcoming);
                setWeeklyAppointments(weeklyData);
                setTodayCount(upcoming.filter(a => a.appointment_date === todayStr).length);
                setTotalClients(clients.length);
                setTotalServices(services.length);
            } catch (e) {
                console.error('Error loading dashboard:', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [selectedRange, today, todayStr, loadTrigger]);

    // Build chart data from real appointments
    const chartData: ChartDayData[] = useMemo(() => {
        const daysBack = selectedRange === 'Este mês' ? 30 : 7;
        const dayLabels = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
        const days: ChartDayData[] = [];

        for (let i = daysBack - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = formatDateLocal(d);
            const dayAppts = weeklyAppointments.filter(a => a.appointment_date === dateStr);

            const revenue = dayAppts.reduce((sum, a) => {
                // Remove R$, espaços e pontos de milhar; converte vírgula decimal para ponto
                const priceStr = (a.servicePrice ?? '')
                    .replace(/R\$\s*/g, '')
                    .trim()
                    .replace(/\./g, '')
                    .replace(',', '.');
                return sum + (parseFloat(priceStr) || 0);
            }, 0);

            days.push({
                dayLabel: dayLabels[d.getDay()],
                dayShort: `${d.getDate()}/${d.getMonth() + 1}`,
                date: dateStr,
                count: dayAppts.length,
                revenue,
                confirmed: dayAppts.filter(a => a.is_confirmed).length,
                pending: dayAppts.filter(a => !a.is_confirmed).length,
                isToday: dateStr === todayStr,
            });
        }
        return days;
    }, [weeklyAppointments, selectedRange, today, todayStr]);

    // Summary stats for the chart period
    const chartSummary = useMemo(() => {
        const totalAppts = chartData.reduce((s, d) => s + d.count, 0);
        const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
        const totalConfirmed = chartData.reduce((s, d) => s + d.confirmed, 0);
        const confirmRate = totalAppts > 0 ? Math.round((totalConfirmed / totalAppts) * 100) : 0;
        const avgPerDay = chartData.length > 0 ? (totalAppts / chartData.length).toFixed(1) : '0';
        return { totalAppts, totalRevenue, totalConfirmed, confirmRate, avgPerDay };
    }, [chartData]);

    const dashboardStats = [
        { label: 'Agendamentos Hoje', value: String(todayCount), change: 'ao vivo', trendingUp: true },
        { label: 'Próximos', value: String(upcomingAppointments.length), change: 'agendados', trendingUp: true },
        { label: 'Clientes', value: String(totalClients), change: 'cadastrados', trendingUp: true },
        { label: 'Serviços', value: String(totalServices), change: 'no catálogo', trendingUp: true },
    ];

    return {
        dashboardStats,
        upcomingAppointments,
        todayCount,
        isLoading,
        selectedRange,
        setSelectedRange,
        chartData,
        chartSummary,
        reload: () => setLoadTrigger(n => n + 1),
    };
};
