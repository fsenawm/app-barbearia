import { localDb, SyncQueueItem } from './localDb';
import { supabase } from './supabase';

// ── Connectivity check ──
export const isOnline = (): boolean => navigator.onLine;

// ── Enqueue an operation for later sync ──
export async function enqueue(
    table: string,
    operation: SyncQueueItem['operation'],
    recordId: string,
    payload: Record<string, unknown> | null
): Promise<void> {
    await localDb.sync_queue.add({
        table,
        operation,
        recordId,
        payload,
        createdAt: new Date().toISOString(),
    });
}

// ── Process all pending sync operations (FIFO) ──
export async function processQueue(): Promise<{ processed: number; errors: number }> {
    if (!isOnline()) return { processed: 0, errors: 0 };

    const pending = await localDb.sync_queue.orderBy('autoId').toArray();
    if (pending.length === 0) return { processed: 0, errors: 0 };

    let processed = 0;
    let errors = 0;

    for (const item of pending) {
        try {
            await executeSyncItem(item);
            await localDb.sync_queue.delete(item.autoId!);
            processed++;
        } catch (err) {
            console.error(`[SyncQueue] Failed to sync ${item.table}/${item.operation}:`, err);
            errors++;
            // Don't delete failed items — they'll be retried next time
        }
    }

    console.log(`[SyncQueue] Processed ${processed}, errors ${errors}`);
    return { processed, errors };
}

// ── Execute a single sync item against Supabase ──
async function executeSyncItem(item: SyncQueueItem): Promise<void> {
    const { table, operation, recordId, payload } = item;

    switch (operation) {
        case 'insert': {
            const { error } = await supabase.from(table).insert([payload!]);
            if (error) throw error;
            break;
        }
        case 'update': {
            const { error } = await supabase.from(table).update(payload!).eq('id', recordId);
            if (error) throw error;
            break;
        }
        case 'upsert': {
            const upsertOpts = table === 'schedule_config' ? { onConflict: 'day_index' } : {};
            const { error } = await supabase.from(table).upsert(payload!, upsertOpts);
            if (error) throw error;
            break;
        }
        case 'delete': {
            const { error } = await supabase.from(table).delete().eq('id', recordId);
            if (error) throw error;
            break;
        }
    }
}

// ── Get pending queue count ──
export async function getPendingCount(): Promise<number> {
    return localDb.sync_queue.count();
}

// ── Full sync: pull all data from Supabase into IndexedDB ──
export async function fullSync(): Promise<void> {
    if (!isOnline()) return;

    // First process any pending outgoing changes
    await processQueue();

    try {
        // Pull all data from Supabase in parallel
        const [clients, services, appointments, configs, blocks] = await Promise.all([
            supabase.from('clients').select('*').order('name'),
            supabase.from('services').select('*').order('name'),
            supabase.from('appointments').select('*'),
            supabase.from('schedule_config').select('*').order('day_index'),
            supabase.from('schedule_blocks').select('*').order('block_date'),
        ]);

        // Replace local data with remote data (inside a transaction)
        await localDb.transaction('rw',
            [localDb.clients, localDb.services, localDb.appointments, localDb.schedule_config, localDb.schedule_blocks],
            async () => {
                if (clients.data) {
                    await localDb.clients.clear();
                    await localDb.clients.bulkPut(clients.data);
                }
                if (services.data) {
                    await localDb.services.clear();
                    await localDb.services.bulkPut(services.data);
                }
                if (appointments.data) {
                    await localDb.appointments.clear();
                    await localDb.appointments.bulkPut(appointments.data);
                }
                if (configs.data) {
                    await localDb.schedule_config.clear();
                    await localDb.schedule_config.bulkPut(configs.data);
                }
                if (blocks.data) {
                    await localDb.schedule_blocks.clear();
                    await localDb.schedule_blocks.bulkPut(blocks.data);
                }
            }
        );

        console.log('[FullSync] Complete');
    } catch (err) {
        console.error('[FullSync] Error:', err);
    }
}
