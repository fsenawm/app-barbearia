import React, { useState, useEffect, useMemo } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { getAvailabilityForRange, getAvailabilityForDate, DayAvailability } from '../utils/availabilityUtils';
import { formatDateLocal } from '../utils/dateUtils';
import { clientsStorage, appointmentsStorage, Client } from '../utils/storage';

interface DashboardProps {
    readonly onNavigate?: (screen: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
    const { dashboardStats, upcomingAppointments, isLoading, selectedRange, setSelectedRange, chartData, chartSummary, reload } = useDashboard();
    const [selectedBarIdx, setSelectedBarIdx] = React.useState<number | null>(null);

    // New functionality states
    const [availability5Days, setAvailability5Days] = useState<DayAvailability[]>([]);
    const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isLoadingDateSlots, setIsLoadingDateSlots] = useState(false);
    const [showSharePicker, setShowSharePicker] = useState(false);
    const [clientSearch, setClientSearch] = useState('');
    const [clients, setClients] = useState<Client[]>([]);
    const [isSharing, setIsSharing] = useState(false);
    const [shareDayData, setShareDayData] = useState<DayAvailability | null>(null);

    // Generate next 14 days for date picker
    const datePickerDays = useMemo(() => {
        const days: Date[] = [];
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            days.push(d);
        }
        return days;
    }, []);

    const handleDatePickerSelect = async (date: Date) => {
        setIsLoadingDateSlots(true);
        try {
            const dayData = await getAvailabilityForDate(date);
            setShareDayData(dayData);
        } catch (e) {
            console.error(e);
            setShareDayData(null);
        } finally {
            setIsLoadingDateSlots(false);
            setShowDatePicker(false);
            setShowSharePicker(true);
        }
    };

    const handleDatePickerSkip = () => {
        setShareDayData(null);
        setShowDatePicker(false);
        setShowSharePicker(true);
    };

    useEffect(() => {
        if (showSharePicker) {
            clientsStorage.getClients().then(setClients);
        }
    }, [showSharePicker]);

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.phone.includes(clientSearch)
    ).slice(0, 5);

    const handleLoadAvailability = async () => {
        setIsAvailabilityLoading(true);
        setShowAvailabilityModal(true);
        try {
            const data = await getAvailabilityForRange(5);
            setAvailability5Days(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAvailabilityLoading(false);
        }
    };

    const handleShareAvailability = async (client: Client) => {
        setIsSharing(true);
        try {
            let message: string;

            if (shareDayData) {
                // Share a single selected day
                const day = shareDayData;
                const dateFmt = day.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                message = `Olá ${client.name}! 👋\n\nAqui estão nossos horários disponíveis para *${day.dayName} (${dateFmt})*:\n\n`;
                if (day.isClosed || day.slots.length === 0) {
                    message += `Indisponível\n`;
                } else {
                    const displaySlots = day.slots.slice(0, 12);
                    message += `🕐 ${displaySlots.join(', ')}${day.slots.length > 12 ? '...' : ''}\n`;
                }
                message += `\nPara agendar, mande uma mensagem por aqui!`;
            } else {
                // Share all upcoming days (original behavior)
                const data = await getAvailabilityForRange(3);
                message = `Olá ${client.name}! 👋\n\nAqui estão nossos horários disponíveis para os próximos dias:\n\n`;
                data.forEach(day => {
                    const dateFmt = day.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    message += `📅 *${day.dayName} (${dateFmt})*\n`;
                    if (day.isClosed || day.slots.length === 0) {
                        message += `Indisponível\n`;
                    } else {
                        const displaySlots = day.slots.slice(0, 12);
                        message += `${displaySlots.join(', ')}${day.slots.length > 12 ? '...' : ''}\n`;
                    }
                    message += '\n';
                });
                message += `Para agendar, mande uma mensagem por aqui!`;
            }

            const encoded = encodeURIComponent(message);
            const phone = client.phone.replace(/\D/g, '');
            const finalPhone = phone.startsWith('55') ? phone : `55${phone}`;
            window.open(`https://wa.me/${finalPhone}?text=${encoded}`, '_blank');
            setShowSharePicker(false);
            setShareDayData(null);
        } finally {
            setIsSharing(false);
        }
    };

    const todayDate = useMemo(() => formatDateLocal(new Date()), []);
    const todayAppointments = upcomingAppointments.filter(a => a.appointment_date === todayDate);
    const futureAppointments = upcomingAppointments.filter(a => a.appointment_date > todayDate);

    const handleToggleStatus = async (id: string, confirmed: boolean) => {
        try {
            await appointmentsStorage.toggleConfirmation(id, confirmed);
            reload();
        } catch {
            alert('Erro ao alterar status do agendamento.');
        }
    };

    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="size-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-white text-[20px]">content_cut</span>
                    </div>
                    <div className="flex flex-col -space-y-1">
                        <span className="text-lg font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
                            Barber
                        </span>
                        <span className="text-[10px] font-bold tracking-[0.2em] text-primary/80 uppercase ml-0.5">
                            Agend
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        aria-label="Notificações"
                        className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-[24px]" translate="no">notifications</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 pb-4">
                {/* KPI Section */}
                <section className="p-4">
                    {isLoading ? (
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className="flex-none w-40 h-24 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex overflow-x-auto gap-4 hide-scrollbar pb-2">
                            {dashboardStats.map((stat, idx) => (
                                <div key={idx} className="flex-none w-40 p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-xl font-extrabold mt-1">{stat.value}</p>
                                    <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${stat.trendingUp ? 'text-primary' : 'text-orange-500'}`}>
                                        <span className="material-symbols-outlined text-[14px]" translate="no">
                                            {stat.trendingUp ? 'trending_up' : 'trending_down'}
                                        </span>
                                        <span>{stat.change}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Quick Access Menu */}
                <section className="px-4 mb-6">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Acesso Rápido</h2>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <button
                            onClick={() => onNavigate?.('financeiro')}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-primary active:scale-95 transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-green-500 text-3xl">payments</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Financeiro</span>
                        </button>
                        <button
                            onClick={() => onNavigate?.('ranking')}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-primary active:scale-95 transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-yellow-500 text-3xl">workspace_premium</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Ranking</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleLoadAvailability}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-primary active:scale-95 transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-primary text-3xl">event_available</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Próximas Vagas</span>
                        </button>
                        <button
                            onClick={() => setShowDatePicker(true)}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-primary active:scale-95 transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-blue-400 text-3xl">share</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Enviar Vagas</span>
                        </button>
                    </div>
                </section>

                {/* Performance Chart */}
                <section className="px-4 mb-6">
                    <div className="bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-base font-bold">Desempenho</h2>
                            <div className="relative">
                                <select
                                    value={selectedRange}
                                    onChange={(e) => { setSelectedRange(e.target.value); setSelectedBarIdx(null); }}
                                    aria-label="Filtrar período"
                                    className="bg-slate-100 dark:bg-slate-700 border-none text-xs font-bold text-primary focus:ring-2 focus:ring-primary rounded-lg py-1.5 pl-3 pr-7 appearance-none"
                                >
                                    <option>Últimos 7 dias</option>
                                    <option>Este mês</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none text-primary" translate="no">expand_more</span>
                            </div>
                        </div>

                        {/* Tooltip */}
                        {selectedBarIdx !== null && chartData[selectedBarIdx] && (
                            <div className="mb-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-slate-500">{chartData[selectedBarIdx].dayLabel} — {chartData[selectedBarIdx].dayShort}</span>
                                    <button onClick={() => setSelectedBarIdx(null)} className="text-slate-400 hover:text-slate-600">
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <p className="text-lg font-extrabold text-primary">{chartData[selectedBarIdx].count}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">agendamentos</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-extrabold text-green-600">R$ {chartData[selectedBarIdx].revenue.toFixed(0)}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">faturamento</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-extrabold">
                                            <span className="text-blue-500">{chartData[selectedBarIdx].confirmed}</span>
                                            <span className="text-slate-300 mx-0.5">/</span>
                                            <span className="text-orange-500">{chartData[selectedBarIdx].pending}</span>
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-bold">conf. / pend.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bar Chart */}
                        {(() => {
                            const maxCount = Math.max(...chartData.map(d => d.count), 1);
                            return (
                                <div className="relative h-36 w-full flex items-end gap-1" style={{ justifyContent: 'space-between' }}>
                                    {chartData.map((day, idx) => {
                                        const heightPct = day.count > 0 ? Math.max((day.count / maxCount) * 100, 8) : 4;
                                        const isSelected = selectedBarIdx === idx;
                                        return (
                                            <button
                                                key={day.date}
                                                onClick={() => setSelectedBarIdx(isSelected ? null : idx)}
                                                className="flex-1 flex flex-col items-center gap-0 group relative"
                                                style={{ minWidth: 0 }}
                                            >
                                                {day.count > 0 && (
                                                    <span className={`text-[10px] font-extrabold mb-0.5 transition-colors ${isSelected || day.isToday ? 'text-primary' : 'text-slate-400'
                                                        }`}>
                                                        {day.count}
                                                    </span>
                                                )}
                                                <div
                                                    className={`w-full rounded-t-md transition-all duration-300 ${day.isToday
                                                        ? 'bg-primary shadow-[0_0_12px_rgba(23,124,207,0.4)]'
                                                        : isSelected
                                                            ? 'bg-primary/80'
                                                            : day.count > 0
                                                                ? 'bg-primary/25 group-hover:bg-primary/40'
                                                                : 'bg-slate-200 dark:bg-slate-700'
                                                        }`}
                                                    style={{ height: `${heightPct}%` }}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                        <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-400 uppercase overflow-x-auto">
                            {chartData.map((day) => (
                                <span key={day.date} className={`flex-1 text-center ${day.isToday ? 'text-primary font-extrabold' : ''}`}>
                                    {day.dayLabel}
                                </span>
                            ))}
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <div className="text-center">
                                <p className="text-base font-extrabold text-slate-800 dark:text-slate-100">{chartSummary.totalAppts}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">Total</p>
                            </div>
                            <div className="text-center">
                                <p className="text-base font-extrabold text-green-600">R${chartSummary.totalRevenue.toFixed(0)}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">Receita</p>
                            </div>
                            <div className="text-center">
                                <p className="text-base font-extrabold text-blue-500">{chartSummary.confirmRate}%</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">Confirmados</p>
                            </div>
                            <div className="text-center">
                                <p className="text-base font-extrabold text-slate-800 dark:text-slate-100">{chartSummary.avgPerDay}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase leading-tight">Média/dia</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Today's Appointments */}
                {!isLoading && todayAppointments.length > 0 && (
                    <section className="px-4 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold">Agendamentos de Hoje</h2>
                            <button
                                onClick={() => onNavigate?.('agenda')}
                                className="text-xs font-bold text-primary"
                            >
                                Ver todos
                            </button>
                        </div>
                        <div className="space-y-3">
                            {todayAppointments.slice(0, 3).map((apt) => (
                                <div key={apt.id} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-[28px]" translate="no">{apt.serviceIcon || 'content_cut'}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{apt.clientName}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{apt.serviceName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-primary">{apt.appointment_time}</p>
                                        {apt.is_confirmed ? (
                                            <button
                                                onClick={() => handleToggleStatus(apt.id, false)}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-orange-100 hover:text-orange-500 transition-colors active:scale-95"
                                            >
                                                Confirmado
                                                <span className="material-symbols-outlined text-sm">swap_horiz</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleToggleStatus(apt.id, true)}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 bg-orange-100 dark:bg-orange-900/30 text-orange-500 hover:bg-green-100 hover:text-green-600 transition-colors active:scale-95"
                                            >
                                                Pendente
                                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Upcoming Appointments */}
                <section className="px-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold">
                            {futureAppointments.length > 0 ? 'Próximos Agendamentos' : 'Sem agendamentos futuros'}
                        </h2>
                        <button
                            onClick={() => onNavigate?.('agenda')}
                            className="text-xs font-bold text-primary"
                        >
                            Ver agenda
                        </button>
                    </div>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse"></div>
                            ))}
                        </div>
                    ) : futureAppointments.length === 0 && todayAppointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-700">calendar_today</span>
                            <p className="text-slate-500 text-sm font-medium">Nenhum agendamento próximo.</p>
                            <button
                                onClick={() => onNavigate?.('booking')}
                                className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/30"
                            >
                                Criar Agendamento
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {futureAppointments.slice(0, 4).map((apt) => (
                                <div key={apt.id} className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-[28px]" translate="no">person</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{apt.clientName}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{apt.serviceName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-primary">{apt.appointment_time}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {new Date(apt.appointment_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                        </p>
                                        {apt.is_confirmed ? (
                                            <button
                                                onClick={() => handleToggleStatus(apt.id, false)}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-orange-100 hover:text-orange-500 transition-colors active:scale-95"
                                            >
                                                Confirmado
                                                <span className="material-symbols-outlined text-sm">swap_horiz</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleToggleStatus(apt.id, true)}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 bg-orange-100 dark:bg-orange-900/30 text-orange-500 hover:bg-green-100 hover:text-green-600 transition-colors active:scale-95"
                                            >
                                                Pendente
                                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* Modal: Próximas Vagas */}
            {showAvailabilityModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-500">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-lg font-extrabold tracking-tight">Vagas para os próximos 5 dias</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Disponibilidade Geral</p>
                            </div>
                            <button onClick={() => setShowAvailabilityModal(false)} className="size-10 flex items-center justify-center rounded-full bg-white dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600">
                                <span className="material-symbols-outlined text-slate-500">close</span>
                            </button>
                        </div>
                        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-4">
                            {isAvailabilityLoading ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-4">
                                    <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                    <p className="text-sm font-bold text-slate-400">Calculando horários...</p>
                                </div>
                            ) : (
                                availability5Days.map(day => (
                                    <div key={day.dateStr} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                                        <div className={`px-4 py-2 flex items-center justify-between ${day.isClosed ? 'bg-slate-50 dark:bg-slate-900/50' : 'bg-primary/5 dark:bg-primary/10'}`}>
                                            <span className="text-xs font-black uppercase tracking-tighter">
                                                {day.dayName} • {day.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                            </span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${day.isClosed ? 'bg-slate-200 text-slate-500' : 'bg-green-100 text-green-700'}`}>
                                                {day.isClosed ? 'INDISPONÍVEL' : `${day.slots.length} HORÁRIOS`}
                                            </span>
                                        </div>
                                        <div className="p-3">
                                            {day.isClosed ? (
                                                <p className="text-xs text-slate-400 font-medium italic">Nenhum horário disponível para este dia.</p>
                                            ) : (
                                                <>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {day.slots.map(t => (
                                                            <span key={t} className="px-2 py-1 bg-slate-50 dark:bg-slate-700/50 rounded text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-600">
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={() => { setShareDayData(day); setShowSharePicker(true); }}
                                                        className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition-colors active:scale-95"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">send</span>
                                                        Enviar vagas via WhatsApp
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                            <button onClick={() => { setShowAvailabilityModal(false); onNavigate?.('booking'); }} className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20">
                                Fazer novo agendamento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Date Picker for Share */}
            {showDatePicker && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-500">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold tracking-tight">Escolher data</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Selecione o dia ou pule para enviar os próximos 3 dias</p>
                            </div>
                            <button onClick={() => setShowDatePicker(false)} className="text-slate-400">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            {isLoadingDateSlots ? (
                                <div className="py-16 flex flex-col items-center gap-3">
                                    <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                    <p className="text-sm font-bold text-slate-400">Carregando vagas...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {datePickerDays.map(date => {
                                        const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
                                        const dayNum = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                        const isToday = formatDateLocal(date) === formatDateLocal(new Date());
                                        return (
                                            <button
                                                key={formatDateLocal(date)}
                                                onClick={() => handleDatePickerSelect(date)}
                                                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all active:scale-95 ${isToday
                                                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary/50'
                                                    }`}
                                            >
                                                <div className={`size-10 rounded-lg flex flex-col items-center justify-center ${isToday ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
                                                    <span className="text-[9px] font-bold uppercase opacity-70">{dayName}</span>
                                                    <span className="text-sm font-extrabold leading-none">{date.getDate()}</span>
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-bold capitalize ${isToday ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>
                                                        {isToday ? 'Hoje' : dayName}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400">{dayNum}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={handleDatePickerSkip}
                                className="w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl text-sm"
                            >
                                Pular — Enviar próximos 3 dias
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Share Availability Picker */}
            {showSharePicker && (
                <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-500">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold tracking-tight">Para quem enviar?</h3>
                                    {shareDayData && (
                                        <p className="text-xs text-primary font-bold mt-0.5">
                                            {shareDayData.dayName} • {shareDayData.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} — {shareDayData.slots.length} horários
                                        </p>
                                    )}
                                </div>
                                <button onClick={() => { setShowSharePicker(false); setShareDayData(null); }} className="text-slate-400">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                                <input
                                    type="text"
                                    placeholder="Buscar cliente..."
                                    value={clientSearch}
                                    onChange={(e) => setClientSearch(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>

                        <div className="p-2 max-h-[50vh] overflow-y-auto">
                            {filteredClients.length > 0 ? (
                                filteredClients.map(client => (
                                    <button
                                        key={client.id}
                                        disabled={isSharing}
                                        onClick={() => handleShareAvailability(client)}
                                        className="w-full p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase">
                                                {client.name.substring(0, 1)}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold">{client.name}</p>
                                                <p className="text-xs text-slate-400">{client.phone}</p>
                                            </div>
                                        </div>
                                        {isSharing ? (
                                            <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                        ) : (
                                            <span className="material-symbols-outlined text-transparent group-hover:text-primary transition-colors">send</span>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <p className="py-10 text-center text-sm text-slate-400 font-medium">Encontre um cliente para compartilhar.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Dashboard;
