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

    const slots: string[] = [];
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const endMins = eh * 60 + em;

    // Convert appointments to sorted list of {start, duration}
    const booked = appointments
        .map(a => {
            const [h, m] = a.appointment_time.split(':').map(Number);
            return {
                start: h * 60 + m,
                duration: parseDuration(a.serviceDuration)
            };
        })
        .sort((a, b) => a.start - b.start);

    let current = sh * 60 + sm;

    while (current < endMins) {
        // If current time is inside or exactly at the start of a booked slot
        const overlap = booked.find(b => current >= b.start && current < b.start + b.duration);

        if (overlap) {
            // Jump to 60 minutes after the start of this appointment
            current = overlap.start + 60;
        } else {
            // Check if there's any appointment between current and current + 60
            const nextApt = booked.find(b => b.start > current && b.start < current + 60);

            if (nextApt) {
                // If there's an appointment soon, still add current slot
                // but next one will jump to 60m after nextApt start
                const h = Math.floor(current / 60);
                const m = current % 60;
                slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                current = nextApt.start + 60;
            } else {
                // Normal 60m jump
                const h = Math.floor(current / 60);
                const m = current % 60;
                slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                current += 60;
            }
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
