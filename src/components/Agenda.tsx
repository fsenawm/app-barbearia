import React, { useState } from 'react';
import { useAgenda } from '../hooks/useAgenda';
import { settingsStorage } from '../utils/storage';

interface AgendaProps {
    readonly onNavigate?: (screen: string, payload?: any) => void;
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const Agenda: React.FC<AgendaProps> = ({ onNavigate }) => {
    const {
        appointments, isLoading, selectedDate,
        monthName, currentYear,
        calendarDays, goToPreviousMonth, goToNextMonth,
        selectDay, isToday, isSelected, handleDelete, handleToggleStatus,
        blockReason, reload
    } = useAgenda();

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedAptId, setSelectedAptId] = useState<string | null>(null);

    const selectedDayLabel = selectedDate.toLocaleDateString('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long',
    });

    const handleOpenPayment = (id: string) => {
        setSelectedAptId(id);
        setShowPaymentModal(true);
    };

    const handleConfirmPayment = async (method: string) => {
        if (!selectedAptId) return;
        
        try {
            // Need a way to update payment method in useAgenda or storage directly
            const { appointmentsStorage } = await import('../utils/storage');
            await appointmentsStorage.updatePaymentMethod(selectedAptId, method);
            
            if (method === 'Pix') {
                const pixKey = await settingsStorage.getPixKey();
                const apt = appointments.find(a => a.id === selectedAptId);
                if (pixKey && apt) {
                    const price = apt.servicePrice || 'o valor do serviço';
                    const msg = `Olá ${apt.clientName}! 👋\n\nAqui está a nossa chave Pix para o pagamento de ${price}:\n\n*${pixKey}*\n\nObrigado pela preferência!`;
                    const phone = apt.clientPhone.replace(/\D/g, '');
                    const finalPhone = phone.startsWith('55') ? phone : `55${phone}`;
                    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                } else if (!pixKey) {
                    alert('Chave Pix não configurada! Pagamento registrado, mas não foi possível enviar o WhatsApp.');
                }
            }
            
            // Reload agenda
            reload();
        } catch {
            alert('Erro ao confirmar pagamento.');
        } finally {
            setShowPaymentModal(false);
            setSelectedAptId(null);
        }
    };

    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between px-4 pt-5 pb-3">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-3xl">content_cut</span>
                        <h1 className="text-xl font-bold tracking-tight">Agenda</h1>
                    </div>
                    <button
                        onClick={() => onNavigate?.('booking')}
                        className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-primary"
                    >
                        <span className="material-symbols-outlined">add</span>
                    </button>
                </div>

                {/* Month navigation */}
                <div className="flex items-center justify-between px-4 pb-3">
                    <button
                        onClick={goToPreviousMonth}
                        className="size-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-500">chevron_left</span>
                    </button>
                    <h2 className="text-base font-extrabold capitalize">
                        {monthName} {currentYear}
                    </h2>
                    <button
                        onClick={goToNextMonth}
                        className="size-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-500">chevron_right</span>
                    </button>
                </div>

                {/* Calendar grid */}
                <div className="px-3 pb-3">
                    {/* Weekday headers */}
                    <div className="grid grid-cols-7 mb-1">
                        {WEEKDAY_LABELS.map(label => (
                            <div key={label} className="text-center text-[10px] font-bold uppercase text-slate-400 py-1">
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-px">
                        {calendarDays.map((cell, index) => {
                            const selected = cell.isCurrentMonth && isSelected(cell.day);
                            const today = cell.isCurrentMonth && isToday(cell.day);

                            return (
                                <button
                                    key={index}
                                    onClick={() => cell.isCurrentMonth && selectDay(cell.day)}
                                    disabled={!cell.isCurrentMonth}
                                    className={`relative flex items-center justify-center h-9 rounded-lg text-sm font-bold transition-all
                                        ${!cell.isCurrentMonth
                                            ? 'text-slate-300 dark:text-slate-700 cursor-default'
                                            : selected
                                                ? 'bg-primary text-white shadow-md shadow-primary/30'
                                                : today
                                                    ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90'
                                        }`}
                                >
                                    {cell.day}
                                    {today && !selected && (
                                        <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary"></span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* Selected day label */}
            <div className="px-4 pt-4 pb-2">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 capitalize">{selectedDayLabel}</p>
            </div>

            {/* Block Reason Banner */}
            {blockReason && (
                <div className="mx-4 mt-2 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 flex items-center gap-3">
                    <span className="material-symbols-outlined text-orange-500 text-xl">block</span>
                    <div>
                        <p className="text-sm font-bold text-orange-700 dark:text-orange-400">Barbearia Fechada</p>
                        <p className="text-xs text-orange-600 dark:text-orange-500">{blockReason}</p>
                    </div>
                </div>
            )}

            {/* Appointments Timeline */}
            <main className="flex-1 overflow-y-auto px-4 pb-28">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-slate-500 text-sm font-medium">Carregando agenda...</p>
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                        <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700">calendar_today</span>
                        <p className="text-slate-500 font-medium">Nenhum agendamento neste dia.</p>
                        <button
                            onClick={() => onNavigate?.('booking')}
                            className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/30 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Novo Agendamento
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {appointments.map((apt) => (
                            <div key={apt.id} className="flex gap-4 min-h-[80px] group">
                                <div className="flex-1 pb-4 border-l border-slate-200 dark:border-slate-800 pl-4 ml-4">
                                    <div className={`p-3 rounded-lg border-l-4 ${apt.is_confirmed
                                        ? 'bg-primary/10 border-primary'
                                        : 'bg-slate-100 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700'
                                        }`}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-bold truncate ${apt.is_confirmed ? 'text-primary' : ''}`}>
                                                    {apt.clientName}
                                                </p>
                                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                                    {apt.appointment_date.split('-').reverse().join('/')} às {apt.appointment_time}
                                                </p>
                                                <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{apt.serviceName}</p>
                                                    {apt.servicePrice && (
                                                        <p className="text-xs font-bold text-slate-500 mt-0.5">{apt.servicePrice} • {apt.serviceDuration}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 ml-2 shrink-0">
                                                {apt.is_confirmed ? (
                                                    <button
                                                        onClick={() => handleToggleStatus(apt.id, false)}
                                                        className="flex items-center justify-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-orange-100 hover:text-orange-500 transition-colors"
                                                    >
                                                        {apt.payment_method ? apt.payment_method : 'Confirmado'}
                                                        <span className="material-symbols-outlined text-[14px]">
                                                            {apt.payment_method === 'Pix' ? 'pix' : apt.payment_method === 'Dinheiro' ? 'payments' : apt.payment_method === 'Cartão' ? 'credit_card' : 'check_circle'}
                                                        </span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOpenPayment(apt.id)}
                                                        className="flex items-center justify-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-500 hover:bg-green-100 hover:text-green-600 transition-colors"
                                                    >
                                                        Pendente
                                                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                                                    </button>
                                                )}
                                                <div className="flex items-center gap-1 mt-1">
                                                    <button
                                                        onClick={() => onNavigate?.('booking', { editAppointmentId: apt.id })}
                                                        className="p-1.5 rounded bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(apt.id)}
                                                        className="p-1.5 rounded bg-red-100/50 dark:bg-red-900/30 text-red-500 hover:text-red-600 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="h-24"></div>
                    </div>
                )}
            </main>

            {/* FAB */}
            <button
                onClick={() => onNavigate?.('booking')}
                className="fixed bottom-24 right-6 size-14 bg-primary text-white rounded-full shadow-xl shadow-primary/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-30"
            >
                <span className="material-symbols-outlined text-3xl">add</span>
            </button>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-lg">Forma de Pagamento</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-5 space-y-3">
                            <button
                                onClick={() => handleConfirmPayment('Dinheiro')}
                                className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5 transition-all text-left"
                            >
                                <span className="material-symbols-outlined text-green-500 text-2xl">payments</span>
                                <span className="font-bold">Dinheiro</span>
                            </button>
                            <button
                                onClick={() => handleConfirmPayment('Pix')}
                                className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5 transition-all text-left"
                            >
                                <span className="material-symbols-outlined text-teal-500 text-2xl">pix</span>
                                <span className="font-bold">Pix</span>
                            </button>
                            <button
                                onClick={() => handleConfirmPayment('Cartão')}
                                className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary hover:bg-primary/5 transition-all text-left"
                            >
                                <span className="material-symbols-outlined text-blue-500 text-2xl">credit_card</span>
                                <span className="font-bold">Cartão</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Agenda;
