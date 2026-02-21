import React from 'react';
import { useSchedules } from '../hooks/useSchedules';

interface SchedulesProps {
    readonly onNavigate?: (screen: string) => void;
}

const Schedules: React.FC<SchedulesProps> = ({ onNavigate }) => {
    const {
        weeklyRoutine, toggleDay, updateTime,
        blocks, removeBlock, addBlock,
        newBlockDate, setNewBlockDate,
        newBlockReason, setNewBlockReason,
        handleSave, isSaved, isSaving, isLoading,
        totalHours, activeBlocks,
    } = useSchedules();

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Carregando horários...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Saved feedback */}
            {isSaved && (
                <div className="fixed top-20 left-4 right-4 z-[100] bg-green-500 text-white p-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top duration-300">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span className="font-bold">Horários salvos com sucesso!</span>
                </div>
            )}

            {/* Top App Bar */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onNavigate?.('servicos')}
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-700 dark:text-slate-100">arrow_back_ios_new</span>
                    </button>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Gestão de Horários</h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-primary text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                >
                    {isSaving ? 'Salvando...' : 'Salvar'}
                </button>
            </header>

            <main className="max-w-md mx-auto px-4 pt-6 space-y-8 pb-28">
                <section>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">Horário Semanal</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Configure seus horários regulares de atendimento para cada dia da semana.</p>
                </section>

                <div className="space-y-3">
                    {weeklyRoutine.map((item, index) => (
                        <div key={item.day_name} className={`bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-sm ${!item.is_open ? 'opacity-60' : ''}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className={`material-symbols-outlined ${item.is_open ? 'text-primary' : 'text-slate-400'}`}>calendar_today</span>
                                    <span className={`font-bold text-base ${!item.is_open ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{item.day_name}</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={item.is_open}
                                        onChange={() => toggleDay(index)}
                                    />
                                    <div className="w-12 h-7 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                                    <span className={`ml-3 text-sm font-medium ${item.is_open ? 'text-primary' : 'text-slate-400'}`}>
                                        {item.is_open ? 'Aberto' : 'Fechado'}
                                    </span>
                                </label>
                            </div>

                            {item.is_open && (
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-slate-500 font-medium ml-1 text-xs">Abertura</label>
                                        <input
                                            type="time"
                                            value={item.start_time}
                                            onChange={e => updateTime(index, 'start_time', e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-primary focus:border-primary [color-scheme:light] dark:[color-scheme:dark]"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <label className="text-slate-500 font-medium ml-1 text-xs">Fechamento</label>
                                        <input
                                            type="time"
                                            value={item.end_time}
                                            onChange={e => updateTime(index, 'end_time', e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-primary focus:border-primary [color-scheme:light] dark:[color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Bloqueios */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Bloqueios</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Datas específicas sem atendimento.</p>
                        </div>
                    </div>

                    {/* Add block form */}
                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 space-y-4">
                        <h3 className="font-bold text-primary flex items-center gap-2">
                            <span className="material-symbols-outlined text-xl">event_busy</span>
                            Novo Bloqueio
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Data</label>
                                <input
                                    type="date"
                                    value={newBlockDate}
                                    onChange={e => setNewBlockDate(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-primary focus:border-primary [color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Motivo (Opcional)</label>
                                <input
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-slate-400 dark:placeholder:text-slate-600 p-3"
                                    placeholder="Ex: Feriado Nacional"
                                    type="text"
                                    value={newBlockReason}
                                    onChange={e => setNewBlockReason(e.target.value)}
                                />
                            </div>
                        </div>
                        <button
                            onClick={addBlock}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-xl">block</span>
                            Bloquear Data
                        </button>
                    </div>

                    {/* Block list */}
                    {blocks.length > 0 && (
                        <div className="space-y-2">
                            {blocks.map((block) => (
                                <div key={block.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-lg flex items-center justify-center">
                                            <span className="material-symbols-outlined">block</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{block.block_date}</p>
                                            {block.reason && <p className="text-xs text-slate-500">{block.reason}</p>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeBlock(block.id)}
                                        className="text-red-500 hover:text-red-600 transition-colors p-1"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">Horas Semanais</p>
                        <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{totalHours}h</p>
                        <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            Disponibilidade semanal
                        </p>
                    </div>
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">Bloqueios Ativos</p>
                        <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{String(activeBlocks).padStart(2, '0')}</p>
                        <p className="text-xs text-slate-500 mt-1">Datas bloqueadas</p>
                    </div>
                </div>
            </main>
        </>
    );
};

export default Schedules;
