import Dexie, { type Table } from 'dexie';

// ── Local Database Schema (mirrors Supabase) ──

export interface LocalClient {
    id: string;
    name: string;
    phone: string;
    birth_date?: string | null;
    notes?: string | null;
}

export interface LocalService {
    id: string;
    name: string;
    price: string;
    duration: string;
    icon: string;
    is_popular: boolean;
}

export interface LocalAppointment {
    id: string;
    client_id: string;
    service_id: string;
    appointment_date: string;
    appointment_time: string;
    is_confirmed: boolean;
}

export interface LocalScheduleConfig {
    id: string;
    day_index: number;
    day_name: string;
    is_open: boolean;
    start_time: string;
    end_time: string;
}

export interface LocalScheduleBlock {
    id: string;
    block_date: string;
    reason: string | null;
}

export interface SyncQueueItem {
    autoId?: number;
    table: string;
    operation: 'insert' | 'update' | 'upsert' | 'delete';
    recordId: string;
    payload: Record<string, unknown> | null;
    createdAt: string;
}

class BarbeariaDB extends Dexie {
    clients!: Table<LocalClient, string>;
    services!: Table<LocalService, string>;
    appointments!: Table<LocalAppointment, string>;
    schedule_config!: Table<LocalScheduleConfig, string>;
    schedule_blocks!: Table<LocalScheduleBlock, string>;
    sync_queue!: Table<SyncQueueItem, number>;

    constructor() {
        super('BarbeariaDB');
        this.version(1).stores({
            clients: 'id, name',
            services: 'id, name',
            appointments: 'id, client_id, service_id, appointment_date, appointment_time',
            schedule_config: 'id, day_index',
            schedule_blocks: 'id, block_date',
            sync_queue: '++autoId, table, createdAt',
        });
    }
}

export const localDb = new BarbeariaDB();
