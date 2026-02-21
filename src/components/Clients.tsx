import React from 'react';
import { useClients } from '../hooks/useClients';
import { Client } from '../utils/storage';

interface ClientsProps {
    readonly onNavigate?: (screen: string) => void;
}

const Clients: React.FC<ClientsProps> = ({ onNavigate }) => {
    const {
        mode, setMode,
        filteredClients, search, setSearch,
        clientData, updateField,
        isLoading, isSaving, isSaved,
        startNew, startEdit, handleDelete, handleSave,
    } = useClients();

    // ── LIST MODE ──────────────────────────────────────────────────────
    if (mode === 'list') {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-900 dark:text-slate-100 font-['Manrope']">
                <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => onNavigate?.('dashboard')}
                            className="flex items-center text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg pr-3 py-1 transition-colors"
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                            <span className="text-base font-medium">Voltar</span>
                        </button>
                        <h1 className="text-lg font-bold tracking-tight">Clientes</h1>
                        <button
                            onClick={startNew}
                            className="flex items-center gap-1 text-primary font-bold text-sm px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">person_add</span>
                            Novo
                        </button>
                    </div>
                </header>

                <main className="px-4 pt-4 pb-28 space-y-4">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                        <input
                            className="w-full bg-slate-100 dark:bg-slate-800/80 border-2 border-transparent focus:border-primary rounded-xl py-3 pl-10 pr-4 focus:ring-0 text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                            placeholder="Buscar por nome ou celular..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-medium">Carregando clientes...</p>
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700">group</span>
                            <p className="text-slate-500 font-medium">
                                {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado ainda.'}
                            </p>
                            {!search && (
                                <button
                                    onClick={startNew}
                                    className="mt-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/30"
                                >
                                    Cadastrar Primeiro Cliente
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredClients.map((client: Client) => (
                                <div
                                    key={client.id}
                                    className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center justify-between"
                                >
                                    <button
                                        onClick={() => startEdit(client)}
                                        className="flex items-center gap-3 flex-1 text-left"
                                    >
                                        <div className="size-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                                            <span className="material-symbols-outlined text-2xl">person</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm truncate">{client.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{client.phone}</p>
                                        </div>
                                    </button>
                                    <div className="flex items-center gap-1 shrink-0 ml-2">
                                        <button
                                            onClick={() => startEdit(client)}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-xl">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(client.id)}
                                            className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-xl">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        );
    }

    // ── NEW / EDIT MODE ────────────────────────────────────────────────
    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-900 dark:text-slate-100 font-['Manrope']">
            {isSaved && (
                <div className="fixed inset-0 z-[100] bg-primary flex flex-col items-center justify-center text-white animate-in fade-in duration-500">
                    <div className="size-24 rounded-full bg-white/20 flex items-center justify-center mb-6 animate-bounce">
                        <span className="material-symbols-outlined text-6xl">
                            {mode === 'edit' ? 'edit' : 'person_add'}
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">
                        {mode === 'edit' ? 'Cliente Atualizado!' : 'Cliente Cadastrado!'}
                    </h2>
                    <p className="opacity-90">Voltando para a lista...</p>
                </div>
            )}

            <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-4">
                <div className="flex items-center justify-between max-w-md mx-auto">
                    <button
                        onClick={() => setMode('list')}
                        className="flex items-center text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg pr-3 py-1 transition-colors"
                    >
                        <span className="material-symbols-outlined">chevron_left</span>
                        <span className="text-base font-medium">Lista</span>
                    </button>
                    <h1 className="text-lg font-bold tracking-tight">
                        {mode === 'edit' ? 'Editar Cliente' : 'Novo Cliente'}
                    </h1>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`text-primary font-bold text-base px-2 py-1 transition-all ${isSaving ? 'opacity-50' : 'active:scale-95'}`}
                    >
                        {isSaving ? '...' : 'Salvar'}
                    </button>
                </div>
            </header>

            <main className="max-w-md mx-auto px-4 pt-6 space-y-8 pb-10">
                <section className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-5xl">person</span>
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-extrabold tracking-tight">
                            {clientData.name || (mode === 'edit' ? 'Editando...' : 'Novo Cliente')}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Cadastro Regular</p>
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary/80 px-1">Informações Pessoais</h3>
                    <div className="space-y-3">
                        <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 focus-within:border-primary transition-colors">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Nome Completo</label>
                            <input
                                className="w-full bg-transparent border-none p-0 focus:ring-0 text-base font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                placeholder="Ex: Ricardo Albuquerque"
                                value={clientData.name}
                                onChange={(e) => updateField('name', e.target.value)}
                            />
                        </div>
                        <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 focus-within:border-primary transition-colors">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">WhatsApp</label>
                            <input
                                className="w-full bg-transparent border-none p-0 focus:ring-0 text-base font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                placeholder="(11) 99999-9999"
                                value={clientData.phone}
                                onChange={(e) => updateField('phone', e.target.value)}
                            />
                        </div>
                        <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 focus-within:border-primary transition-colors">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Data de Nascimento</label>
                            <div className="flex items-center justify-between">
                                <input
                                    className="bg-transparent border-none p-0 focus:ring-0 text-base font-semibold text-slate-900 dark:text-slate-100 accent-primary [color-scheme:light] dark:[color-scheme:dark]"
                                    type="date"
                                    value={clientData.birthDate}
                                    onChange={(e) => updateField('birthDate', e.target.value)}
                                />
                                <span className="material-symbols-outlined text-slate-400">calendar_today</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary/80 px-1">Preferências e Notas</h3>
                    <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 focus-within:border-primary transition-colors">
                        <textarea
                            className="w-full bg-transparent border-none p-0 focus:ring-0 text-base font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none"
                            placeholder="Ex: Corte baixo nas laterais (pente 1.5), degradê navalhado..."
                            rows={4}
                            value={clientData.notes}
                            onChange={(e) => updateField('notes', e.target.value)}
                        />
                    </div>
                </section>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-primary/30 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                    {isSaving ? (
                        <>
                            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Salvando...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined">save</span>
                            {mode === 'edit' ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
                        </>
                    )}
                </button>
            </main>
        </div>
    );
};

export default Clients;
