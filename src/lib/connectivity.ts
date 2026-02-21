import { useState, useEffect, useCallback } from 'react';
import { processQueue, fullSync, getPendingCount } from './syncQueue';

/**
 * Hook that tracks online/offline status and triggers sync on reconnect.
 */
export function useOnlineStatus() {
    const [online, setOnline] = useState(navigator.onLine);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);

    const refreshPendingCount = useCallback(async () => {
        const count = await getPendingCount();
        setPendingCount(count);
    }, []);

    useEffect(() => {
        const handleOnline = async () => {
            setOnline(true);
            setIsSyncing(true);
            try {
                await processQueue();
                await fullSync();
            } finally {
                setIsSyncing(false);
                refreshPendingCount();
            }
        };

        const handleOffline = () => {
            setOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial sync on mount if online
        if (navigator.onLine) {
            setIsSyncing(true);
            fullSync()
                .then(() => refreshPendingCount())
                .finally(() => setIsSyncing(false));
        }

        // Refresh pending count periodically
        const interval = setInterval(refreshPendingCount, 10000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [refreshPendingCount]);

    return { isOnline: online, pendingCount, isSyncing, refreshPendingCount };
}
