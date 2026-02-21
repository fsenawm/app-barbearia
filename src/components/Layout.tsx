import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
    currentScreen: string;
    onNavigate: (screen: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentScreen, onNavigate }) => {
    const navItems = [
        { id: 'dashboard', label: 'Início', icon: 'grid_view' },
        { id: 'agenda', label: 'Agenda', icon: 'calendar_today' },
        { id: 'booking', label: 'Novo', icon: 'add', isAction: true },
        { id: 'clientes', label: 'Clientes', icon: 'group' },
        { id: 'servicos', label: 'Ajustes', icon: 'settings' },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-[#111a21] text-slate-900 dark:text-slate-100 font-['Manrope']">
            <main className="flex-1 overflow-y-auto pb-24">
                {children}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-6 pb-8 pt-3 flex justify-between items-center z-50">
                {navItems.map((item) => {
                    if (item.isAction) {
                        return (
                            <div key={item.id} className="relative -top-8">
                                <button
                                    onClick={() => onNavigate(item.id)}
                                    aria-label={item.label}
                                    className="bg-primary text-white size-14 rounded-full shadow-lg shadow-primary/40 flex items-center justify-center border-4 border-background-light dark:border-background-dark active:scale-95 transition-transform"
                                >
                                    <span className="material-symbols-outlined text-[32px]" translate="no">{item.icon}</span>
                                </button>
                            </div>
                        );
                    }

                    const isActive = currentScreen === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            aria-label={item.label}
                            aria-current={isActive ? 'page' : undefined}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[28px] ${isActive ? 'font-variation-fill' : ''}`} translate="no">
                                {item.icon}
                            </span>
                            <span className="text-[10px] font-bold">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default Layout;
