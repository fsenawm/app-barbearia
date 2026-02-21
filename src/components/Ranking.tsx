import React from 'react';
import { useRanking } from '../hooks/useRanking';

interface RankingProps {
    readonly onNavigate?: (screen: string) => void;
}

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const getPeriodLabel = (period: 'week' | 'month' | 'year') => {
    const now = new Date();
    if (period === 'week') return 'Últimos 7 dias';
    if (period === 'month') return `${MONTHS_SHORT[now.getMonth()]} ${now.getFullYear()}`;
    return String(now.getFullYear());
};

const Ranking: React.FC<RankingProps> = ({ onNavigate }) => {
    const { period, setPeriod, top1, ranking } = useRanking();

    return (
        <>
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-[#0F1219]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between px-4 py-4">
                    <button
                        onClick={() => onNavigate?.('financeiro')}
                        className="flex items-center justify-center size-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">arrow_back_ios_new</span>
                    </button>
                    <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Ranking de Lucratividade</h1>
                    <button className="flex items-center justify-center size-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <span className="material-symbols-outlined text-slate-900 dark:text-slate-100">calendar_month</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto px-4 pb-4">
                {/* Period Filter */}
                <div className="my-6">
                    <div className="flex h-11 items-center justify-center rounded-xl bg-slate-200 dark:bg-[#1E222B] p-1">
                        {(['week', 'month', 'year'] as const).map((p) => (
                            <label
                                key={p}
                                className={`flex cursor-pointer h-full grow items-center justify-center rounded-lg px-2 text-sm font-semibold transition-all ${period === p
                                    ? 'bg-white dark:bg-slate-800 shadow-sm text-primary dark:text-white'
                                    : 'text-slate-500 dark:text-slate-400'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="period"
                                    className="hidden"
                                    checked={period === p}
                                    onChange={() => setPeriod(p)}
                                />
                                <span className="capitalize">{p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Ano'}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Section Title */}
                <div className="flex items-end justify-between mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Serviços em Destaque</h2>
                    <span className="text-xs font-medium text-primary">{getPeriodLabel(period)}</span>
                </div>

                {/* Top 1 Highlight */}
                <div className="relative overflow-hidden rounded-2xl bg-[#1E222B] border border-[#FFD700]/20 p-5 mb-6 shadow-2xl shadow-[#FFD700]/5">
                    <div className="absolute -top-4 -right-4 size-24 opacity-10">
                        <span className="material-symbols-outlined text-[80px] text-[#FFD700]">workspace_premium</span>
                    </div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter text-[#FFD700]">
                                <span className="material-symbols-outlined text-[14px]">stars</span>
                                Top 1 Performance
                            </span>
                            <h3 className="text-xl font-extrabold text-white mt-1">{top1.title}</h3>
                            <p className="text-slate-400 text-xs font-medium">{top1.description}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-black text-white">{top1.revenue}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{top1.atendimentos} ATENDIMENTOS</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                            <span>Meta de Lucro</span>
                            <span>112%</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#FFD700] to-[#B8860B] rounded-full shadow-[0_0_12px_rgba(255,215,0,0.3)] transition-all duration-1000"
                                style={{ width: `${top1.progress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Ranking List */}
                <div className="space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Ranking de Faturamento</h2>
                    {ranking.map((item) => (
                        <div key={item.rank} className="bg-white dark:bg-[#1E222B] rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center size-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-sm">
                                        {item.rank}º
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white">{item.title}</h4>
                                        <p className="text-[11px] text-slate-500">{item.atendimentos} atendimentos</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-extrabold text-slate-900 dark:text-white">{item.revenue}</p>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-1000"
                                    style={{ width: `${item.progress}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Info */}
                <div className="mt-8 p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <div className="flex gap-3">
                        <span className="material-symbols-outlined text-primary">info</span>
                        <p className="text-xs leading-relaxed text-slate-400">
                            Os dados acima consideram apenas serviços concluídos e pagos. O ticket médio atual da sua barbearia é de <span className="text-white font-bold">R$ 112,50</span> por cliente.
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
};

export default Ranking;
