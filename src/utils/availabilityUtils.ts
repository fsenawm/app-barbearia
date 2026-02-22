import { scheduleStorage, appointmentsStorage } from './storage';
import { formatDateLocal } from './dateUtils';

export interface DayAvailability {
    date: Date;
    dateStr: string;
    dayName: string;
    isClosed: boolean;
    slots: string[];
}

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

    const allTimes = generateTimesForDay(config.start_time, config.end_time);
    const appts = await appointmentsStorage.getByDate(dateStr);

    const occupied = new Set<string>();
    for (const apt of appts) {
        const start = apt.appointment_time;
        const dur = parseDuration(apt.serviceDuration);
        const slotsCount = Math.ceil(dur / 30);
        const startIdx = allTimes.indexOf(start);
        if (startIdx !== -1) {
            for (let j = 0; j < slotsCount; j++) {
                if (startIdx + j < allTimes.length) {
                    occupied.add(allTimes[startIdx + j]);
                }
            }
        }
    }

    let freeSlots = allTimes.filter(t => !occupied.has(t));

    // Filter past times if today
    const today = new Date();
    if (formatDateLocal(d) === formatDateLocal(today)) {
        const nowMins = today.getHours() * 60 + today.getMinutes();
        freeSlots = freeSlots.filter(t => {
            const [h, m] = t.split(':').map(Number);
            return (h * 60 + m) > nowMins + 15;
        });
    }

    return { date: d, dateStr, dayName, isClosed: freeSlots.length === 0, slots: freeSlots };
};

export const getAvailabilityForRange = async (daysCount: number): Promise<DayAvailability[]> => {
    const today = new Date();
    const result: DayAvailability[] = [];

    // Cache config and blocks
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

        const allTimes = generateTimesForDay(config.start_time, config.end_time);
        const appts = await appointmentsStorage.getByDate(dateStr);

        // Map occupied slots
        const occupied = new Set<string>();
        for (const apt of appts) {
            const start = apt.appointment_time;
            const dur = parseDuration(apt.serviceDuration);
            const slotsCount = Math.ceil(dur / 30);
            const startIdx = allTimes.indexOf(start);
            if (startIdx !== -1) {
                for (let j = 0; j < slotsCount; j++) {
                    if (startIdx + j < allTimes.length) {
                        occupied.add(allTimes[startIdx + j]);
                    }
                }
            }
        }

        const freeSlots = allTimes.filter(t => !occupied.has(t));

        // If it's today, filter out past times
        let finalSlots = freeSlots;
        if (i === 0) {
            const now = new Date();
            const nowMins = now.getHours() * 60 + now.getMinutes();
            finalSlots = freeSlots.filter(t => {
                const [h, m] = t.split(':').map(Number);
                return (h * 60 + m) > nowMins + 15; // Give 15 mins buffer
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
