import { useState, useMemo, useEffect, useCallback } from 'react';
import { clientsStorage, servicesStorage, appointmentsStorage, scheduleStorage, Client, Service } from '../utils/storage';
import { formatDateLocal } from '../utils/dateUtils';

export interface SlotInfo {
    status: 'available' | 'booked' | 'invaded';
    clientName?: string;
    serviceName?: string;
    serviceDuration?: string;
    bookedByTime?: string;
}

export const useBooking = () => {
    const [allClients, setAllClients] = useState<Client[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [clientSearch, setClientSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedService, setSelectedService] = useState('');

    // Calendar state
    const today = useMemo(() => new Date(), []);
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<Date>(today);

    const [selectedTime, setSelectedTime] = useState('10:00');
    const [isConfirmed, setIsConfirmed] = useState(true);

    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Tracks rich status for each time slot
    const [slotMap, setSlotMap] = useState<Record<string, SlotInfo>>({});

    // Dynamic times generated from schedule config
    const [times, setTimes] = useState<string[]>([]);

    // Block reason for the selected day
    const [blockReason, setBlockReason] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [clientsData, servicesData] = await Promise.all([
                    clientsStorage.getClients(),
                    servicesStorage.getServices()
                ]);
                setAllClients(clientsData);
                setServices(servicesData);
                if (servicesData.length > 0) {
                    setSelectedService(servicesData[0].id);
                }
            } catch (error) {
                console.error('Error loading booking data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    // Calendar helpers
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

    const isToday = (day: number) => {
        return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
    };

    const isPastDay = (day: number) => {
        const d = new Date(currentYear, currentMonth, day);
        const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        return d < t;
    };

    const selectDay = (day: number) => {
        if (isPastDay(day)) return;
        const newDate = new Date(currentYear, currentMonth, day);
        setSelectedDate(newDate);
        setSelectedTime('09:00');
    };

    const getCalendarDays = () => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
        const prevDays: { day: number; isCurrentMonth: boolean }[] = [];
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            prevDays.push({ day: prevMonthLastDay - i, isCurrentMonth: false });
        }

        const currentDays: { day: number; isCurrentMonth: boolean }[] = [];
        for (let i = 1; i <= daysInMonth; i++) {
            currentDays.push({ day: i, isCurrentMonth: true });
        }

        const totalCells = prevDays.length + currentDays.length;
        const nextDaysCount = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;
        const nextDays: { day: number; isCurrentMonth: boolean }[] = [];
        for (let i = 1; i <= nextDaysCount; i++) {
            nextDays.push({ day: i, isCurrentMonth: false });
        }

        return [...prevDays, ...currentDays, ...nextDays];
    };

    const isSelected = (day: number) => {
        return day === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();
    };

    const monthName = new Date(currentYear, currentMonth).toLocaleDateString('pt-BR', { month: 'long' });

    // Generate time slots from start to end at 30-min intervals
    const generateTimesForDay = (startTime: string, endTime: string): string[] => {
        if (!startTime || !endTime || startTime === '--:--' || endTime === '--:--') return [];
        const slots: string[] = [];
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        let current = sh * 60 + sm;
        const end = eh * 60 + em;
        while (current < end) {
            const h = Math.floor(current / 60);
            const m = current % 60;
            slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
            current += 30;
        }
        return slots;
    };

    // Parse duration string like "30 min", "45 min", "1h", "30" into minutes
    const parseDuration = (dur: string): number => {
        if (!dur) return 30;
        const cleaned = dur.toLowerCase().replace(/\s/g, '');
        const hMatch = cleaned.match(/(\d+)\s*h/);
        const mMatch = cleaned.match(/(\d+)\s*m/);
        let mins = 0;
        if (hMatch) mins += parseInt(hMatch[1]) * 60;
        if (mMatch) mins += parseInt(mMatch[1]);
        if (mins === 0) {
            const n = parseInt(cleaned);
            if (!isNaN(n)) mins = n;
            else mins = 30;
        }
        return mins;
    };

    // Build the slot map from appointments
    const buildSlotMap = useCallback((appointments: import('../utils/storage').AppointmentWithDetails[], dayTimes: string[]) => {
        const map: Record<string, SlotInfo> = {};
        dayTimes.forEach(t => {
            map[t] = { status: 'available' };
        });

        for (const apt of appointments) {
            const startTime = apt.appointment_time;
            const duration = parseDuration(apt.serviceDuration);
            const slotsNeeded = Math.ceil(duration / 30);

            const startIdx = dayTimes.indexOf(startTime);
            if (startIdx === -1) continue;

            map[startTime] = {
                status: 'booked',
                clientName: apt.clientName,
                serviceName: apt.serviceName,
                serviceDuration: apt.serviceDuration,
            };

            for (let j = 1; j < slotsNeeded; j++) {
                const invadedIdx = startIdx + j;
                if (invadedIdx < dayTimes.length) {
                    const invadedTime = dayTimes[invadedIdx];
                    if (map[invadedTime]?.status === 'booked') continue;
                    map[invadedTime] = {
                        status: 'invaded',
                        clientName: apt.clientName,
                        serviceName: apt.serviceName,
                        bookedByTime: startTime,
                    };
                }
            }
        }
        return map;
    }, []);

    // Reload slot data whenever selected date changes
    const loadBookedTimes = useCallback(async (date: Date) => {
        const dateStr = formatDateLocal(date);
        const dayOfWeek = date.getDay();

        try {
            // Fetch all config + blocks + appointments in parallel
            const [allConfigs, blocks, existing] = await Promise.all([
                scheduleStorage.getConfig(),
                scheduleStorage.getBlocks(),
                appointmentsStorage.getByDate(dateStr),
            ]);

            // Check if day is blocked
            const block = blocks.find(b => b.block_date === dateStr);
            if (block) {
                setTimes([]);
                setSlotMap({});
                setBlockReason(block.reason || 'Dia bloqueado');
                return;
            }
            setBlockReason(null);

            // Find the config for this specific day of the week
            const dayConfig = allConfigs.find(c => c.day_index === dayOfWeek);
            let dayTimes: string[] = [];
            if (dayConfig && dayConfig.is_open) {
                dayTimes = generateTimesForDay(dayConfig.start_time, dayConfig.end_time);
            }
            setTimes(dayTimes);

            const map = buildSlotMap(existing, dayTimes);
            setSlotMap(map);

            setSelectedTime(prev => {
                const info = map[prev];
                if (!info || info.status !== 'available') {
                    const firstAvailable = dayTimes.find(t => map[t]?.status === 'available');
                    return firstAvailable || prev;
                }
                return prev;
            });
        } catch (error) {
            console.error('Error loading times:', error);
            setSlotMap({});
        }
    }, [buildSlotMap]);

    useEffect(() => {
        loadBookedTimes(selectedDate);
    }, [selectedDate, loadBookedTimes]);

    const filteredClients = useMemo(() => {
        if (!clientSearch) return [];
        return allClients.filter(c =>
            c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
            c.phone.includes(clientSearch)
        );
    }, [allClients, clientSearch]);

    const handleBooking = async () => {
        if (!selectedClient) {
            alert('Por favor, selecione um cliente.');
            return;
        }

        const appointmentDateStr = formatDateLocal(selectedDate);

        // Final verification of availability
        try {
            // Check blocks again
            const blocks = await scheduleStorage.getBlocks();
            if (blocks.some(b => b.block_date === appointmentDateStr)) {
                alert('Este dia acabou de ser bloqueado. Por favor, escolha outra data.');
                return;
            }

            const existing = await appointmentsStorage.getByDate(appointmentDateStr);
            const freshMap = buildSlotMap(existing, times);
            const slotInfo = freshMap[selectedTime];
            if (slotInfo && slotInfo.status !== 'available') {
                const occupiedBy = slotInfo.clientName || 'outro agendamento';
                alert(`O horário ${selectedTime} já está ocupado por ${occupiedBy}.\nPor favor, escolha outro horário.`);
                setSlotMap(freshMap);
                return;
            }
        } catch {
            // Fallback
        }

        setIsSaving(true);
        try {
            await appointmentsStorage.saveAppointment({
                client_id: selectedClient.id,
                service_id: selectedService,
                appointment_date: appointmentDateStr,
                appointment_time: selectedTime,
                is_confirmed: isConfirmed
            });

            // Gerar link do WhatsApp
            const serviceObj = services.find(s => s.id === selectedService);
            const serviceLabel = serviceObj?.name || 'Serviço';
            const dayLabel = selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
            const message = `Olá ${selectedClient.name}! Confirmamos seu agendamento para ${serviceLabel} no dia ${dayLabel} às ${selectedTime}. Até lá!`;
            const encodedMessage = encodeURIComponent(message);
            const phoneDigits = selectedClient.phone.replace(/\D/g, '');
            const phoneWithCountry = phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`;
            const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodedMessage}`;

            window.open(whatsappUrl, '_blank');

            setIsSaved(true);
        } catch (error) {
            console.error(error);
            alert('Erro ao realizar agendamento.');
        } finally {
            setIsSaving(false);
        }
    };

    return {
        clientSearch,
        setClientSearch,
        filteredClients,
        selectedClient,
        setSelectedClient,
        selectedService,
        setSelectedService,
        selectedDate,
        selectedTime,
        setSelectedTime,
        isConfirmed,
        setIsConfirmed,
        isLoading,
        isSaving,
        isSaved,
        services,
        times,
        slotMap,
        handleBooking,
        // Calendar
        currentMonth,
        currentYear,
        monthName,
        calendarDays: getCalendarDays(),
        goToPreviousMonth,
        goToNextMonth,
        selectDay,
        isToday,
        isPastDay,
        isSelected,
        hasAvailableSlots: times.some(t => slotMap[t]?.status === 'available'),
        isValidSelection: !!selectedClient && !!selectedService && !!selectedTime && (slotMap[selectedTime]?.status === 'available'),
        blockReason,
    };
};
