import React from 'react';
import { useOnlineStatus } from '../lib/connectivity';

const OfflineBanner: React.FC = () => {
    const { isOnline, pendingCount, isSyncing } = useOnlineStatus();

    // Online and nothing pending — don't show anything
    if (isOnline && !isSyncing && pendingCount === 0) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-500 ${!isOnline
                    ? 'bg-orange-500 text-white'
                    : isSyncing
                        ? 'bg-blue-500 text-white'
                        : 'bg-green-500 text-white'
                }`}
        >
            <div className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold">
                {!isOnline ? (
                    <>
                        <span className="material-symbols-outlined text-sm">wifi_off</span>
                        <span>Sem conexão — dados salvos localmente</span>
                        {pendingCount > 0 && (
                            <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
                                {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </>
                ) : isSyncing ? (
                    <>
                        <div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Sincronizando dados...</span>
                    </>
                ) : pendingCount > 0 ? (
                    <>
                        <span className="material-symbols-outlined text-sm">sync_problem</span>
                        <span>{pendingCount} operação(ões) pendente(s)</span>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default OfflineBanner;
