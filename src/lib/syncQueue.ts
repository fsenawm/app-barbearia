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

const MAX_RETRIES = 5;

// ── Process all pending sync operations (FIFO) ──
export async function processQueue(): Promise<{ processed: number; errors: number }> {
    if (!isOnline()) return { processed: 0, errors: 0 };

    const pending = await localDb.sync_queue.orderBy('autoId').toArray();
    if (pending.length === 0) return { processed: 0, errors: 0 };

    let processed = 0;
    let errors = 0;

    for (const item of pending) {
        const retryCount = item.retryCount ?? 0;

        // Descartar itens com falhas permanentes para não bloquear a fila
        if (retryCount >= MAX_RETRIES) {
            console.warn(`[SyncQueue] Descartando item após ${MAX_RETRIES} tentativas:`, item);
            await localDb.sync_queue.delete(item.autoId!);
            continue;
        }

        try {
            await executeSyncItem(item);
            await localDb.sync_queue.delete(item.autoId!);
            processed++;
        } catch (err) {
            console.error(`[SyncQueue] Falha ao sincronizar ${item.table}/${item.operation} (tentativa ${retryCount + 1}/${MAX_RETRIES}):`, err);
            errors++;
            await localDb.sync_queue.update(item.autoId!, { retryCount: retryCount + 1 });
        }
    }

    console.log(`[SyncQueue] Processados ${processed}, erros ${errors}`);
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
            const { error } = await supabase.from(table).upsert(payload!, { onConflict: 'id' });
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

    // Helper to fetch all rows circumventing the 1000 row limit
    const fetchAll = async (table: string, orderBy?: string) => {
        let allData: any[] = [];
        let start = 0;
        const limit = 1000;
        while (true) {
            let query = supabase.from(table).select('*').range(start, start + limit - 1);
            if (orderBy) {
                query = query.order(orderBy, { ascending: false });
            }
            const { data, error } = await query;
            if (error) throw error;
            if (!data || data.length === 0) break;
            allData = allData.concat(data);
            if (data.length < limit) break;
            start += limit;
        }
        return { data: allData };
    };

    try {
        // Pull all data from Supabase in parallel using fetchAll to prevent limit omissions
        const [clients, services, appointments, configs, blocks] = await Promise.all([
            fetchAll('clients', 'name'),
            fetchAll('services', 'name'),
            fetchAll('appointments', 'appointment_date'),
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
