import { scheduleStorage, appointmentsStorage } from './storage';
import { formatDateLocal } from './dateUtils';

export interface DayAvailability {
    date: Date;
    dateStr: string;
    dayName: string;
    isClosed: boolean;
    slots: string[];
}

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

const generateDynamicSlots = (startTime: string, endTime: string, appointments: any[]): string[] => {
    if (!startTime || !endTime || startTime === '--:--' || endTime === '--:--') return [];

    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;

    if (isNaN(startMins) || isNaN(endMins) || startMins >= endMins) return [];

    // Convert appointments to sorted list of {start, duration}
    const booked = appointments
        .filter(a => a.appointment_time)
        .map(a => {
            const [h, m] = a.appointment_time.split(':').map(Number);
            return {
                start: h * 60 + m,
                duration: parseDuration(a.serviceDuration)
            };
        })
        .sort((a, b) => a.start - b.start);

    // Generate full-hour slots and check the 30-min-minimum rule
    const slots: string[] = [];
    for (let mins = startMins; mins < endMins; mins += 60) {
        const timeStr = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

        // Check: is the 30-min window [mins, mins+30) free of any appointments?
        const hasConflict = booked.some(b => {
            const bEnd = b.start + b.duration;
            // Appointment overlaps with [mins, mins+30) if it starts before mins+30 AND ends after mins
            return b.start < mins + 30 && bEnd > mins;
        });

        if (!hasConflict) {
            slots.push(timeStr);
        }
    }

    return slots;
};

export const getAvailabilityForDate = async (targetDate: Date): Promise<DayAvailability> => {
    const [configs, blocks] = await Promise.all([
        scheduleStorage.getConfig(),
        scheduleStorage.getBlocks()
    ]);

    const d = new Date(targetDate);
    const dateStr = formatDateLocal(d);
    const dayOfWeek = d.getDay();
    const config = configs.find(c => c.day_index === dayOfWeek);
    const isBlocked = blocks.some(b => b.block_date === dateStr);
    const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();

    if (isBlocked || !config || !config.is_open) {
        return { date: d, dateStr, dayName, isClosed: true, slots: [] };
    }

    const appts = await appointmentsStorage.getByDate(dateStr);
    const freeSlots = generateDynamicSlots(config.start_time, config.end_time, appts);

    // Filter past times if today
    let finalSlots = freeSlots;
    const today = new Date();
    if (formatDateLocal(d) === formatDateLocal(today)) {
        const nowMins = today.getHours() * 60 + today.getMinutes();
        finalSlots = freeSlots.filter(t => {
            const [h, m] = t.split(':').map(Number);
            return (h * 60 + m) > nowMins + 5; // Reduced buffer to 5 mins for manual flexibility
        });
    }

    return { date: d, dateStr, dayName, isClosed: finalSlots.length === 0, slots: finalSlots };
};

export const getAvailabilityForRange = async (daysCount: number): Promise<DayAvailability[]> => {
    const today = new Date();
    const result: DayAvailability[] = [];

    const [configs, blocks] = await Promise.all([
        scheduleStorage.getConfig(),
        scheduleStorage.getBlocks()
    ]);

    for (let i = 0; i < daysCount; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = formatDateLocal(d);
        const dayOfWeek = d.getDay();
        const config = configs.find(c => c.day_index === dayOfWeek);
        const isBlocked = blocks.some(b => b.block_date === dateStr);

        if (isBlocked || !config || !config.is_open) {
            result.push({
                date: d,
                dateStr,
                dayName: d.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase(),
                isClosed: true,
                slots: []
            });
            continue;
        }

        const appts = await appointmentsStorage.getByDate(dateStr);
        const freeSlots = generateDynamicSlots(config.start_time, config.end_time, appts);

        let finalSlots = freeSlots;
        if (i === 0) {
            const now = new Date();
            const nowMins = now.getHours() * 60 + now.getMinutes();
            finalSlots = freeSlots.filter(t => {
                const [h, m] = t.split(':').map(Number);
                return (h * 60 + m) > nowMins + 5;
            });
        }

        result.push({
            date: d,
            dateStr,
            dayName: d.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase(),
            isClosed: finalSlots.length === 0,
            slots: finalSlots
        });
    }

    return result;
};
