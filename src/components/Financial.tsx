import React from 'react';
import { useFinancial } from '../hooks/useFinancial';

interface FinancialProps {
    readonly onNavigate?: (screen: string) => void;
}

const Financial: React.FC<FinancialProps> = ({ onNavigate }) => {
    const { currentMonth, summary, transactions, dailyData, isLoading, changeMonth } = useFinancial();

    return (
        <>
            {/* Header */}
            <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between z-10">
                <button
                    onClick={() => onNavigate?.('dashboard')}
                    className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/50"
                >
                    <span className="material-symbols-outlined">arrow_back_ios_new</span>
                </button>
                <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Extrato Financeiro</h2>
                <div className="flex size-10 items-center justify-end">
                    <button className="flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/50 size-10 text-slate-900 dark:text-slate-100">
                        <span className="material-symbols-outlined">ios_share</span>
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto hide-scrollbar pb-4">
                {/* Month Selector */}
                <div className="flex items-center justify-between px-4 py-4">
                    <button onClick={() => changeMonth('prev')} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">{currentMonth}</span>
                        {isLoading && (
                            <div className="size-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mt-1"></div>
                        )}
                        {!isLoading && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">{summary.totalServices} atendimentos no mês</span>
                        )}
                    </div>
                    <button onClick={() => changeMonth('next')} className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>

                {/* Summary Card */}
                <div className="px-4 pb-6">
                    <div className="bg-slate-100 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
                        <div className="mb-6">
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Faturamento Total</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-slate-900 dark:text-slate-100 text-3xl font-extrabold tracking-tight">{summary.totalRevenue}</h3>
                                <span className="text-primary text-xs font-bold flex items-center bg-primary/10 px-2 py-0.5 rounded-full">
                                    <span className="material-symbols-outlined text-sm">trending_up</span> {summary.growth}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">Total de Serviços</p>
                                <p className="text-slate-900 dark:text-slate-100 text-xl font-bold">{summary.totalServices}</p>
                                <p className="text-slate-400 text-[10px] mt-1">atendimentos no mês</p>
                            </div>
                            <div className="bg-white dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">Lucro Estimado</p>
                                <p className="text-green-500 text-xl font-bold">{summary.estimatedProfit}</p>
                                <p className="text-slate-400 text-[10px] mt-1">Margem de {summary.margin}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chart */}
                <div className="px-4 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-slate-900 dark:text-slate-100 font-bold">Ganhos Diários</h4>
                        <span className="text-xs text-slate-500 font-medium">{currentMonth}</span>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800/20 rounded-xl p-4 h-48 flex items-end justify-between gap-1 border border-slate-100 dark:border-slate-800">
                        {(dailyData.length > 0 ? dailyData : Array(16).fill(0)).map((h, i) => (
                            <div
                                key={i}
                                className={`flex-1 rounded-t-sm ${h > 0 ? 'bg-primary' : 'bg-primary/25'}`}
                                style={{ height: `${Math.max(h, 3)}%` }}
                            ></div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 px-1">
                        <span className="text-[10px] text-slate-400">Início do mês</span>
                        <span className="text-[10px] text-slate-400">Fim do mês</span>
                    </div>
                </div>

                {/* Transaction List */}
                <div className="px-4">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-slate-900 dark:text-slate-100 font-bold">Últimas Transações</h4>
                        <button
                            onClick={() => onNavigate?.('ranking')}
                            className="text-xs font-bold text-primary"
                        >
                            Ver Ranking
                        </button>
                    </div>
                    {transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                            <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-700">receipt_long</span>
                            <p className="text-slate-500 text-sm">Nenhuma transação neste mês.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined">{tx.icon}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{tx.customer}</p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{tx.type} • {tx.time}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-green-500">{tx.amount}</p>
                                        <p className="text-[10px] text-slate-400">{tx.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Financial;
