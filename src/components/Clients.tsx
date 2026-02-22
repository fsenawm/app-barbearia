import React, { useState } from 'react';
import { useClients } from '../hooks/useClients';
import { useGoogleContacts, GoogleContact } from '../hooks/useGoogleContacts';
import { Client, clientsStorage } from '../utils/storage';

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
        clients,
    } = useClients();

    const { triggerImport, isLoading: isGoogleLoading, error: googleError, hasClientId } = useGoogleContacts();

    // Google import modal state
    const [showGoogleModal, setShowGoogleModal] = useState(false);
    const [googleContacts, setGoogleContacts] = useState<GoogleContact[]>([]);
    const [contactSearch, setContactSearch] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [isImporting, setIsImporting] = useState(false);
    const [importDone, setImportDone] = useState<{ imported: number; skipped: number } | null>(null);

    const existingPhones = new Set(clients.map(c => c.phone.replace(/\D/g, '')));

    const filteredGoogle = googleContacts.filter(c =>
        c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
        c.rawPhone.includes(contactSearch)
    );

    const handleGoogleImport = () => {
        triggerImport((contacts) => {
            setGoogleContacts(contacts);
            // Pre-select new contacts only
            const newOnes = new Set(
                contacts
                    .filter(c => !existingPhones.has(c.phone))
                    .map(c => c.resourceName)
            );
            setSelected(newOnes);
            setImportDone(null);
            setShowGoogleModal(true);
        });
    };

    const toggleSelect = (resourceName: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(resourceName)) next.delete(resourceName);
            else next.add(resourceName);
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === filteredGoogle.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(filteredGoogle.map(c => c.resourceName)));
        }
    };

    const handleConfirmImport = async () => {
        const toImport = googleContacts.filter(c => selected.has(c.resourceName));
        if (toImport.length === 0) return;

        setIsImporting(true);
        let imported = 0;
        let skipped = 0;

        for (const contact of toImport) {
            if (existingPhones.has(contact.phone)) {
                skipped++;
                continue;
            }
            try {
                await clientsStorage.saveClient({
                    name: contact.name,
                    phone: contact.rawPhone,
                    birthDate: '',
                    notes: '',
                });
                imported++;
            } catch {
                skipped++;
            }
        }

        setImportDone({ imported, skipped });
        setIsImporting(false);
    };

    const closeGoogleModal = () => {
        setShowGoogleModal(false);
        setGoogleContacts([]);
        setContactSearch('');
        setSelected(new Set());
        setImportDone(null);
        if (importDone && importDone.imported > 0) {
            // Trigger reload by switching mode
            setMode('list');
        }
    };

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

                    {/* Import from Google button */}
                    <button
                        onClick={handleGoogleImport}
                        disabled={isGoogleLoading || !hasClientId}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm hover:border-primary hover:text-primary transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGoogleLoading ? (
                            <>
                                <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                Buscando contatos...
                            </>
                        ) : (
                            <>
                                <svg className="size-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Importar contatos do Google
                            </>
                        )}
                    </button>
                    {googleError && (
                        <p className="text-xs text-red-500 font-bold text-center -mt-2">{googleError}</p>
                    )}
                    {!hasClientId && (
                        <p className="text-xs text-slate-400 text-center -mt-2">Configure VITE_GOOGLE_CLIENT_ID para habilitar</p>
                    )}

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

                {/* Modal: Google Contacts Import */}
                {showGoogleModal && (
                    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-500 flex flex-col max-h-[90vh]">
                            {/* Header */}
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <svg className="size-5" viewBox="0 0 24 24">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        <h3 className="text-lg font-bold">Contatos do Google</h3>
                                    </div>
                                    <button onClick={closeGoogleModal} className="text-slate-400">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                {!importDone && (
                                    <>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-slate-500 font-medium">
                                                {googleContacts.length} contatos encontrados • {selected.size} selecionados
                                            </span>
                                            <button
                                                onClick={toggleAll}
                                                className="text-xs font-bold text-primary"
                                            >
                                                {selected.size === filteredGoogle.length ? 'Desmarcar todos' : 'Selecionar todos'}
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                                            <input
                                                type="text"
                                                placeholder="Filtrar contatos..."
                                                value={contactSearch}
                                                onChange={e => setContactSearch(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Content */}
                            {importDone ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-12 gap-4 text-center px-6">
                                    <div className="size-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-4xl text-green-500">check_circle</span>
                                    </div>
                                    <h4 className="text-xl font-extrabold">{importDone.imported} importado{importDone.imported !== 1 ? 's' : ''}!</h4>
                                    {importDone.skipped > 0 && (
                                        <p className="text-sm text-slate-500">{importDone.skipped} já existiam e foram ignorados.</p>
                                    )}
                                    <button
                                        onClick={closeGoogleModal}
                                        className="mt-2 bg-primary text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-primary/30"
                                    >
                                        Ver clientes
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredGoogle.length === 0 ? (
                                        <p className="py-10 text-center text-sm text-slate-400 font-medium">Nenhum contato encontrado.</p>
                                    ) : (
                                        filteredGoogle.map(contact => {
                                            const isExisting = existingPhones.has(contact.phone);
                                            const isChecked = selected.has(contact.resourceName);
                                            return (
                                                <button
                                                    key={contact.resourceName}
                                                    onClick={() => !isExisting && toggleSelect(contact.resourceName)}
                                                    disabled={isExisting}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isExisting
                                                        ? 'opacity-40 cursor-default'
                                                        : isChecked
                                                            ? 'bg-primary/5 dark:bg-primary/10'
                                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                        }`}
                                                >
                                                    <div className={`size-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isExisting
                                                        ? 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700'
                                                        : isChecked
                                                            ? 'border-primary bg-primary'
                                                            : 'border-slate-300 dark:border-slate-600'
                                                        }`}>
                                                        {(isChecked || isExisting) && (
                                                            <span className="material-symbols-outlined text-[14px] text-white">check</span>
                                                        )}
                                                    </div>
                                                    <div className="size-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300 shrink-0 uppercase">
                                                        {contact.name.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold truncate">{contact.name}</p>
                                                        <p className="text-xs text-slate-400 truncate">{contact.rawPhone}</p>
                                                    </div>
                                                    {isExisting && (
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full shrink-0">
                                                            já cadastrado
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {/* Footer */}
                            {!importDone && (
                                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
                                    <button
                                        onClick={handleConfirmImport}
                                        disabled={selected.size === 0 || isImporting}
                                        className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 disabled:opacity-40 flex items-center justify-center gap-2"
                                    >
                                        {isImporting ? (
                                            <>
                                                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Importando...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-lg">download</span>
                                                Importar {selected.size} contato{selected.size !== 1 ? 's' : ''}
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
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
