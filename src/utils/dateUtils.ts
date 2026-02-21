export interface DynamicDate {
    day: string;
    date: number;
    month: string;
    fullDate: Date;
}

export const generateDynamicDates = (count: number = 7): DynamicDate[] => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const result: DynamicDate[] = [];
    const today = new Date();

    for (let i = 0; i < count; i++) {
        const d = new Date();
        d.setDate(today.getDate() + i);
        result.push({
            day: i === 0 ? 'Hoje' : days[d.getDay()],
            date: d.getDate(),
            month: months[d.getMonth()],
            fullDate: d
        });
    }
    return result;
};

// Formats a Date object as YYYY-MM-DD in local time
export const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getDatesInRange = (startDate: Date, count: number): Date[] => {
    const dates: Date[] = [];
    for (let i = 0; i < count; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        dates.push(d);
    }
    return dates;
};
