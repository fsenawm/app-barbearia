import { useState, useEffect } from 'react';
import { appointmentsStorage, AppointmentWithDetails } from '../utils/storage';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const parsePrice = (price: string): number => {
    if (!price) return 0;
    return parseFloat(price.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
};

const formatCurrency = (value: number): string => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const useFinancial = () => {
    const now = new Date();
    const [currentYear, setCurrentYear] = useState(now.getFullYear());
    const [currentMonthIndex, setCurrentMonthIndex] = useState(now.getMonth());
    const [monthData, setMonthData] = useState<AppointmentWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const currentMonth = `${MONTHS[currentMonthIndex]} ${currentYear}`;

    const loadData = async (year: number, monthIndex: number) => {
        setIsLoading(true);
        try {
            const startDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-01`;
            const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
            const endDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
            const data = await appointmentsStorage.getByMonthRange(startDate, endDate);
            setMonthData(data);
        } catch (e) {
            console.error('Error loading financial data:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData(currentYear, currentMonthIndex);
    }, [currentYear, currentMonthIndex]);

    const changeMonth = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            if (currentMonthIndex === 0) {
                setCurrentYear(y => y - 1);
                setCurrentMonthIndex(11);
            } else {
                setCurrentMonthIndex(m => m - 1);
            }
        } else {
            if (currentMonthIndex === 11) {
                setCurrentYear(y => y + 1);
                setCurrentMonthIndex(0);
            } else {
                setCurrentMonthIndex(m => m + 1);
            }
        }
    };

    const totalRevenue = monthData.reduce((acc, a) => acc + parsePrice(a.servicePrice), 0);
    const estimatedProfit = totalRevenue * 0.85;

    const summary = {
        totalRevenue: formatCurrency(totalRevenue),
        totalServices: String(monthData.length),
        estimatedProfit: formatCurrency(estimatedProfit),
        growth: '+0%',
        margin: '85%',
    };

    // Build daily chart data — all days of the month
    const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    const dailyRevenue: Record<number, number> = {};
    monthData.forEach(a => {
        const day = parseInt(a.appointment_date.split('-')[2], 10);
        dailyRevenue[day] = (dailyRevenue[day] || 0) + parsePrice(a.servicePrice);
    });
    const maxDayRevenue = Math.max(...Object.values(dailyRevenue), 1);
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return Math.round(((dailyRevenue[day] || 0) / maxDayRevenue) * 100);
    });

    // Last 4 transactions (most recent first)
    const transactions = [...monthData].reverse().slice(0, 4).map((a) => ({
        id: a.id,
        type: a.serviceName,
        customer: a.clientName,
        time: a.appointment_time,
        date: new Date(a.appointment_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        amount: a.servicePrice || 'R$ 0,00',
        icon: a.serviceIcon || 'content_cut',
    }));

    return {
        currentMonth,
        summary,
        transactions,
        dailyData,
        isLoading,
        changeMonth,
    };
};
