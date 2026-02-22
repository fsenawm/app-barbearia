import React from 'react';
import { useBooking } from '../hooks/useBooking';

interface BookingProps {
    readonly onNavigate?: (screen: string) => void;
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const Booking: React.FC<BookingProps> = ({ onNavigate }) => {
    const {
        clientSearch,
        setClientSearch,
        filteredClients,
        selectedClient,
        setSelectedClient,
        selectedService,
        setSelectedService,
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
        monthName,
        currentYear,
        calendarDays,
        goToPreviousMonth,
        goToNextMonth,
        selectDay,
        isToday,
        isPastDay,
        isSelected,
        hasAvailableSlots,
        isValidSelection,
        blockReason,
    } = useBooking();

    // Hooks MUST be called before any returns
    React.useEffect(() => {
        if (isSaved) {
            const timer = setTimeout(() => {
                onNavigate?.('dashboard');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [isSaved, onNavigate]);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Carregando dados...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-[#111a21] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-['Manrope']">
            {/* Success Overlay */}
            {isSaved && (
                <div className="fixed inset-0 z-[100] bg-primary flex flex-col items-center justify-center text-white animate-in fade-in duration-500">
                    <div className="size-24 rounded-full bg-white/20 flex items-center justify-center mb-6 animate-bounce">
                        <span className="material-symbols-outlined text-6xl" translate="no">check_circle</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Agendado com Sucesso!</h2>
                    <p className="opacity-90">Redirecionando para o início...</p>
                </div>
            )}

            {/* Top App Bar */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#111a21]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center px-4 h-16 justify-between">
                    <button
                        onClick={() => onNavigate?.('dashboard')}
                        className="flex items-center justify-center size-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-900 dark:text-slate-100" translate="no">arrow_back_ios_new</span>
                    </button>
                    <h1 className="text-lg font-bold tracking-tight">Novo Agendamento</h1>
                    <div className="size-10"></div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-4 py-6 space-y-8 pb-40">
                {/* Section: Serviço (FIRST) */}
                <section className="space-y-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Serviço</h2>
                    <div className="grid grid-cols-3 gap-3">
                        {services.map((service) => (
                            <button
                                key={service.id}
                                onClick={() => setSelectedService(service.id)}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all text-center ${selectedService === service.id
                                    ? 'border-primary bg-primary/10'
                                    : 'border-transparent bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <span className={`material-symbols-outlined mb-2 text-3xl ${selectedService === service.id ? 'text-primary' : 'text-slate-400'}`} translate="no">
                                    {service.icon}
                                </span>
                                <span className="text-sm font-bold">{service.name}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{service.price}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Section: Cliente (BELOW Service) */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cliente</h2>
                        <button
                            onClick={() => onNavigate?.('clientes')}
                            className="text-primary text-sm font-semibold flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-lg" translate="no">add_circle</span> Novo
                        </button>
                    </div>
                    <div className="relative">
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" translate="no">search</span>
                            <input
                                type="text"
                                placeholder="Buscar por nome ou celular"
                                value={selectedClient ? selectedClient.name : clientSearch}
                                onChange={(e) => {
                                    setClientSearch(e.target.value);
                                    if (selectedClient) setSelectedClient(null);
                                }}
                                className="w-full h-14 pl-12 pr-12 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-base font-medium transition-all"
                            />
                            {selectedClient && (
                                <button
                                    onClick={() => {
                                        setSelectedClient(null);
                                        setClientSearch('');
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                                >
                                    <span className="material-symbols-outlined" translate="no">cancel</span>
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {clientSearch && !selectedClient && filteredClients.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[70] overflow-hidden max-h-60 overflow-y-auto">
                                {filteredClients.map(client => (
                                    <button
                                        key={client.id}
                                        onClick={() => {
                                            setSelectedClient(client);
                                            setClientSearch('');
                                        }}
                                        className="w-full px-4 py-3 flex flex-col items-start border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <span className="font-bold text-sm tracking-tight">{client.name}</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{client.phone}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {clientSearch && !selectedClient && filteredClients.length === 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-2xl z-[70] text-center">
                                <p className="text-sm text-slate-500">Nenhum cliente encontrado.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Section: Data e Horário - Monthly Calendar */}
                <section className="space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Data e Horário</h2>

                    {/* Monthly Calendar */}
                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                        {/* Month navigation */}
                        <div className="flex items-center justify-between mb-3">
                            <button
                                onClick={goToPreviousMonth}
                                className="size-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <span className="material-symbols-outlined text-slate-500">chevron_left</span>
                            </button>
                            <h3 className="text-base font-extrabold capitalize">
                                {monthName} {currentYear}
                            </h3>
                            <button
                                onClick={goToNextMonth}
                                className="size-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <span className="material-symbols-outlined text-slate-500">chevron_right</span>
                            </button>
                        </div>

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
                                const todayCell = cell.isCurrentMonth && isToday(cell.day);
                                const pastCell = cell.isCurrentMonth && isPastDay(cell.day);
                                const isDisabled = !cell.isCurrentMonth || pastCell;

                                return (
                                    <button
                                        key={index}
                                        onClick={() => cell.isCurrentMonth && !pastCell && selectDay(cell.day)}
                                        disabled={isDisabled}
                                        className={`relative flex items-center justify-center h-9 rounded-lg text-sm font-bold transition-all
                                            ${!cell.isCurrentMonth
                                                ? 'text-slate-300 dark:text-slate-700 cursor-default'
                                                : pastCell
                                                    ? 'text-slate-200 dark:text-slate-800 cursor-default bg-slate-50/50 dark:bg-slate-900/20'
                                                    : selected
                                                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                                                        : todayCell
                                                            ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                                                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-90'
                                            }`}
                                    >
                                        {cell.day}
                                        {todayCell && !selected && (
                                            <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary"></span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Time Slots */}
                    {times.length === 0 ? (
                        <div className="py-8 text-center">
                            <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">event_busy</span>
                            <p className="text-sm font-bold text-slate-400">Sem horários disponíveis</p>
                            <p className="text-xs text-slate-400 mt-1">
                                {blockReason
                                    ? <><span className="material-symbols-outlined text-sm align-middle text-orange-400">block</span> {blockReason}</>
                                    : 'A barbearia está fechada neste dia.'
                                }
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Manual Time Input */}
                            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Horário Escolhido</label>
                                    <span className="text-xs font-medium text-primary">Ajuste se necessário</span>
                                </div>
                                <input
                                    type="time"
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                    className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-lg font-bold text-center focus:ring-2 focus:ring-primary outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Sugestões de Horários</h3>
                                {times.map((time) => {
                                    const info = slotMap[time] || { status: 'available' as const };
                                    const isBooked = info.status === 'booked';
                                    const isInvaded = info.status === 'invaded';
                                    const isDisabled = isBooked || isInvaded;
                                    const isSelectedTime = selectedTime === time;

                                    return (
                                        <button
                                            key={time}
                                            onClick={() => !isDisabled && setSelectedTime(time)}
                                            disabled={isDisabled}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${isBooked
                                                ? 'border-primary/30 bg-primary/5 cursor-not-allowed'
                                                : isInvaded
                                                    ? 'border-dashed border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/20 cursor-not-allowed'
                                                    : isSelectedTime
                                                        ? 'border-primary bg-primary/10 shadow-md shadow-primary/10'
                                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-primary/50'
                                                }`}
                                        >
                                            {/* Time label */}
                                            <span className={`text-sm font-bold w-12 shrink-0 ${isBooked ? 'text-primary/60'
                                                : isInvaded ? 'text-orange-400 dark:text-orange-500'
                                                    : isSelectedTime ? 'text-primary'
                                                        : 'text-slate-700 dark:text-slate-200'
                                                }`}>
                                                {time}
                                            </span>

                                            {/* Status content */}
                                            <div className="flex-1 min-w-0">
                                                {isBooked && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-primary/60 text-base" translate="no">person</span>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{info.clientName}</p>
                                                            <p className="text-[10px] text-slate-400 truncate">{info.serviceName} • {info.serviceDuration}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {isInvaded && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="material-symbols-outlined text-orange-400 text-sm" translate="no">arrow_back</span>
                                                        <span className="text-[11px] font-semibold text-orange-500 dark:text-orange-400 truncate">
                                                            {info.bookedByTime} — {info.serviceName}
                                                        </span>
                                                    </div>
                                                )}
                                                {!isDisabled && !isSelectedTime && (
                                                    <span className="text-xs text-slate-400 font-medium">Disponível</span>
                                                )}
                                                {!isDisabled && isSelectedTime && (
                                                    <span className="text-xs text-primary font-bold flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-sm" translate="no">check_circle</span>
                                                        Selecionado
                                                    </span>
                                                )}
                                            </div>

                                            {/* Right indicator */}
                                            {isBooked && (
                                                <span className="material-symbols-outlined text-primary/40 text-lg shrink-0" translate="no">lock</span>
                                            )}
                                            {isInvaded && (
                                                <span className="material-symbols-outlined text-orange-300 text-lg shrink-0" translate="no">block</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </section>

                {/* Section: Configurações */}
                <section className="space-y-4 pt-2">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex flex-col">
                            <span className="font-bold">Status Confirmado</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">O cliente já deu o ok?</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isConfirmed}
                                onChange={(e) => setIsConfirmed(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </section>
            </main>

            {/* Fixed Bottom Button */}
            <footer className="fixed bottom-[120px] left-4 right-4 z-[60]">
                <button
                    onClick={handleBooking}
                    disabled={isSaving || !isValidSelection || !hasAvailableSlots}
                    className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${isSaving || !isValidSelection || !hasAvailableSlots
                        ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed shadow-none'
                        : 'bg-primary hover:bg-primary/90 text-white shadow-primary/30'
                        }`}
                >
                    {isSaving ? (
                        <>
                            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Salvando...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined" translate="no">send_and_archive</span>
                            Confirmar e Enviar WhatsApp
                        </>
                    )}
                </button>
            </footer>
        </div >
    );
};

export default Booking;
