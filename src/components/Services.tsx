import React from 'react';
import { useServices } from '../hooks/useServices';
import { Service } from '../utils/storage';

interface ServicesProps {
    readonly onNavigate?: (screen: string) => void;
}

const Services: React.FC<ServicesProps> = ({ onNavigate }) => {
    const { search, setSearch, filteredServices, handleAddService, handleDeleteService, handleUpdateService, isSaving, isSaved, isLoading } = useServices();
    const [showAddForm, setShowAddForm] = React.useState(false);
    const [newService, setNewService] = React.useState({ name: '', price: '', duration: '', icon: 'content_cut' });
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editData, setEditData] = React.useState({ name: '', price: '', duration: '', icon: '' });

    const startEdit = (service: Service) => {
        setEditingId(service.id);
        setEditData({ name: service.name, price: service.price, duration: service.duration, icon: service.icon });
    };

    const cancelEdit = () => setEditingId(null);

    const saveEdit = async () => {
        if (!editingId) return;
        try {
            await handleUpdateService(editingId, editData);
            setEditingId(null);
        } catch {
            alert('Erro ao salvar serviço. Tente novamente.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <div className="size-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Carregando serviços...</p>
                </div>
            </div>
        );
    }

    const onAdd = async () => {
        if (!newService.name || !newService.price) {
            alert('Preencha nome e preço.');
            return;
        }
        await handleAddService(newService);
        setNewService({ name: '', price: '', duration: '', icon: 'content_cut' });
        setShowAddForm(false);
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-900 dark:text-slate-100 font-['Manrope']">
            {isSaved && (
                <div className="fixed top-20 left-4 right-4 z-[100] bg-green-500 text-white p-4 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top duration-300">
                    <span className="material-symbols-outlined font-bold">check_circle</span>
                    <span className="font-bold">Serviço salvo com sucesso!</span>
                </div>
            )}

            <header className="sticky top-0 z-30 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between px-4 h-16">
                    <button
                        onClick={() => onNavigate?.('dashboard')}
                        className="p-2 -ml-2 text-primary flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-[28px]">chevron_left</span>
                        <span className="text-base font-medium">Voltar</span>
                    </button>
                    <h1 className="text-base font-bold absolute left-1/2 -translate-x-1/2">Serviços</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="flex-1 px-4 py-6 pb-24 overflow-y-auto">
                <div className="mb-6">
                    <h2 className="text-3xl font-extrabold tracking-tight mb-2">Catálogo</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Gerencie seu catálogo de serviços, preços e tempos médios.</p>
                </div>

                {/* Link to Schedules/Horários */}
                <button
                    onClick={() => onNavigate?.('schedules')}
                    className="w-full flex items-center gap-4 p-4 mb-6 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-primary active:scale-[0.98] transition-all shadow-sm"
                >
                    <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-2xl">schedule</span>
                    </div>
                    <div className="flex-1 text-left">
                        <p className="text-sm font-bold">Gestão de Horários</p>
                        <p className="text-xs text-slate-400 font-medium">Bloqueios e configurações de agenda</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
                </button>

                <div className="relative mb-6">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                    <input
                        className="w-full bg-slate-100 dark:bg-slate-800/80 border-2 border-transparent focus:border-primary rounded-xl py-3 pl-10 pr-4 focus:ring-0 text-sm font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-sm"
                        placeholder="Buscar serviço..."
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="space-y-3">
                    {filteredServices.map((service) => (
                        <div key={service.id}>
                            {editingId === service.id ? (
                                <div className="bg-slate-100 dark:bg-slate-800/60 border-2 border-primary/30 rounded-2xl p-4 space-y-3 animate-in zoom-in-95 duration-150">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nome</label>
                                        <input
                                            className="w-full bg-white dark:bg-slate-900/50 border-none rounded-lg p-2.5 text-sm font-bold focus:ring-2 focus:ring-primary"
                                            value={editData.name}
                                            onChange={e => setEditData({ ...editData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Preço</label>
                                            <input
                                                className="w-full bg-white dark:bg-slate-900/50 border-none rounded-lg p-2.5 text-sm font-bold focus:ring-2 focus:ring-primary"
                                                value={editData.price}
                                                onChange={e => setEditData({ ...editData, price: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Duração</label>
                                            <input
                                                className="w-full bg-white dark:bg-slate-900/50 border-none rounded-lg p-2.5 text-sm font-bold focus:ring-2 focus:ring-primary"
                                                value={editData.duration}
                                                onChange={e => setEditData({ ...editData, duration: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={cancelEdit} className="flex-1 h-10 rounded-xl font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm">
                                            Cancelar
                                        </button>
                                        <button onClick={saveEdit} disabled={isSaving} className="flex-1 h-10 rounded-xl font-bold bg-primary text-white text-sm disabled:opacity-50">
                                            {isSaving ? 'Salvando...' : 'Salvar'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-2xl">{service.icon}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-extrabold text-base">{service.name}</h3>
                                                {service.isPopular && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-primary text-white uppercase tracking-wider">Popular</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                                                    <span className="material-symbols-outlined text-sm">payments</span>
                                                    {service.price}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                                <span className="flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                                    {service.duration}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => startEdit(service)}
                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-xl">edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteService(service.id)}
                                            className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-xl">delete</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-8">
                    {showAddForm ? (
                        <div className="bg-slate-100 dark:bg-slate-800/60 border-2 border-primary/20 rounded-2xl p-5 space-y-4 animate-in zoom-in-95 duration-200">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">add_circle</span>
                                Novo Serviço
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nome do Serviço</label>
                                    <input
                                        className="w-full bg-white dark:bg-slate-900/50 border-none rounded-lg p-2.5 text-sm font-bold focus:ring-2 focus:ring-primary"
                                        placeholder="Ex: Corte Navalhado"
                                        value={newService.name}
                                        onChange={e => setNewService({ ...newService, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Preço</label>
                                        <input
                                            className="w-full bg-white dark:bg-slate-900/50 border-none rounded-lg p-2.5 text-sm font-bold focus:ring-2 focus:ring-primary"
                                            placeholder="R$ 60,00"
                                            value={newService.price}
                                            onChange={e => setNewService({ ...newService, price: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Duração</label>
                                        <input
                                            className="w-full bg-white dark:bg-slate-900/50 border-none rounded-lg p-2.5 text-sm font-bold focus:ring-2 focus:ring-primary"
                                            placeholder="45 min"
                                            value={newService.duration}
                                            onChange={e => setNewService({ ...newService, duration: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => setShowAddForm(false)} className="flex-1 h-12 rounded-xl font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                    Cancelar
                                </button>
                                <button onClick={onAdd} disabled={isSaving} className="flex-1 h-12 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-50">
                                    {isSaving ? 'Salvando...' : 'Adicionar'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="w-full h-14 bg-primary text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-xl shadow-primary/30 active:scale-[0.97] transition-all"
                        >
                            <span className="material-symbols-outlined">add_circle</span>
                            Adicionar Novo Serviço
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Services;
