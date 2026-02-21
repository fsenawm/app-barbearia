import { useState, useEffect, useCallback } from 'react';
import { appointmentsStorage, scheduleStorage, AppointmentWithDetails } from '../utils/storage';

export const useAgenda = () => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<Date>(today);
    const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [blockReason, setBlockReason] = useState<string | null>(null);

    // Load appointments for a given date
    const loadAppointments = useCallback(async (date: Date) => {
        setIsLoading(true);
        try {
            const dateStr = date.toISOString().split('T')[0];

            // Check for blocks
            const blocks = await scheduleStorage.getBlocks();
            const block = blocks.find(b => b.block_date === dateStr);
            setBlockReason(block ? (block.reason || 'Dia bloqueado') : null);

            const data = await appointmentsStorage.getByDate(dateStr);
            setAppointments(data);
        } catch {
            setAppointments([]);
            setBlockReason(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load appointments when selected date changes
    useEffect(() => {
        loadAppointments(selectedDate);
    }, [selectedDate, loadAppointments]);

    // Navigate months
    const goToPreviousMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(y => y - 1);
        } else {
            setCurrentMonth(m => m - 1);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(y => y + 1);
        } else {
            setCurrentMonth(m => m + 1);
        }
    };

    // Select a day from the calendar
    const selectDay = (day: number) => {
        const newDate = new Date(currentYear, currentMonth, day);
        setSelectedDate(newDate);
    };

    // Get calendar grid data for the current month
    const getCalendarDays = () => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        // 0=Sunday ... 6=Saturday
        const startDayOfWeek = firstDay.getDay();

        // Previous month trailing days
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
        const prevDays: { day: number; isCurrentMonth: boolean }[] = [];
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            prevDays.push({ day: prevMonthLastDay - i, isCurrentMonth: false });
        }

        // Current month days
        const currentDays: { day: number; isCurrentMonth: boolean }[] = [];
        for (let i = 1; i <= daysInMonth; i++) {
            currentDays.push({ day: i, isCurrentMonth: true });
        }

        // Next month trailing days to fill the grid (up to 42 cells = 6 rows)
        const totalCells = prevDays.length + currentDays.length;
        const nextDaysCount = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;
        const nextDays: { day: number; isCurrentMonth: boolean }[] = [];
        for (let i = 1; i <= nextDaysCount; i++) {
            nextDays.push({ day: i, isCurrentMonth: false });
        }

        return [...prevDays, ...currentDays, ...nextDays];
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Remover este agendamento?')) return;
        try {
            await appointmentsStorage.deleteAppointment(id);
            await loadAppointments(selectedDate);
        } catch {
            alert('Erro ao remover agendamento.');
        }
    };

    const handleToggleStatus = async (id: string, confirmed: boolean) => {
        try {
            await appointmentsStorage.toggleConfirmation(id, confirmed);
            await loadAppointments(selectedDate);
        } catch {
            alert('Erro ao alterar status do agendamento.');
        }
    };

    // Month name formatter
    const monthName = new Date(currentYear, currentMonth).toLocaleDateString('pt-BR', { month: 'long' });

    // Check if a day is today
    const isToday = (day: number) => {
        return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
    };

    // Check if a day is selected
    const isSelected = (day: number) => {
        return day === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();
    };

    return {
        appointments,
        isLoading,
        selectedDate,
        currentMonth,
        currentYear,
        monthName,
        calendarDays: getCalendarDays(),
        goToPreviousMonth,
        goToNextMonth,
        selectDay,
        isToday,
        isSelected,
        handleDelete,
        handleToggleStatus,
        blockReason,
        reload: () => loadAppointments(selectedDate),
    };
};
