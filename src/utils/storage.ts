import { supabase } from '../lib/supabase';
import { localDb } from '../lib/localDb';
import { enqueue, isOnline } from '../lib/syncQueue';

// ── Interfaces (unchanged) ──

export interface Client {
    id: string;
    name: string;
    phone: string;
    birthDate?: string;
    notes?: string;
}

export interface Service {
    id: string;
    name: string;
    price: string;
    duration: string;
    icon: string;
    isPopular: boolean;
}

export interface Appointment {
    id: string;
    client_id: string;
    service_id: string;
    appointment_date: string;
    appointment_time: string;
    is_confirmed: boolean;
}

export interface AppointmentWithDetails extends Appointment {
    clientName: string;
    clientPhone: string;
    serviceName: string;
    servicePrice: string;
    serviceIcon: string;
    serviceDuration: string;
}

// ── Helper: generate UUID locally ──
function generateId(): string {
    return crypto.randomUUID();
}

// ── Helper: get current authenticated user ID ──
async function getUserId(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) throw new Error('Usuário não autenticado');
    return session.user.id;
}

// ── Helper: map local appointment + local client/service → AppointmentWithDetails ──
async function resolveAppointmentDetails(apt: Appointment): Promise<AppointmentWithDetails> {
    const client = await localDb.clients.get(apt.client_id);
    const service = await localDb.services.get(apt.service_id);
    return {
        ...apt,
        clientName: client?.name || 'Cliente',
        clientPhone: client?.phone || '',
        serviceName: service?.name || 'Serviço',
        servicePrice: service?.price || '',
        serviceIcon: service?.icon || 'content_cut',
        serviceDuration: service?.duration || '',
    };
}

// ══════════════════════════════════════════════════════
// CLIENTS
// ══════════════════════════════════════════════════════

export const clientsStorage = {
    getClients: async (): Promise<Client[]> => {
        // Read from local
        const local = await localDb.clients.orderBy('name').toArray();
        return local.map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            birthDate: c.birth_date || undefined,
            notes: c.notes || undefined,
        }));
    },

    saveClient: async (client: Omit<Client, 'id'>) => {
        const id = generateId();
        const user_id = await getUserId();
        const record = {
            id,
            name: client.name,
            phone: client.phone,
            birth_date: client.birthDate || null,
            notes: client.notes || null,
            user_id,
        };

        // Save locally first
        await localDb.clients.put(record);

        // Sync to Supabase
        if (isOnline()) {
            try {
                const { error } = await supabase.from('clients').insert([record]);
                if (error) throw error;
            } catch (err) {
                console.error('[Clients] Online insert failed, queued:', err);
                await enqueue('clients', 'insert', id, record);
            }
        } else {
            await enqueue('clients', 'insert', id, record);
        }

        return { ...record };
    },

    updateClient: async (id: string, client: Partial<Omit<Client, 'id'>>) => {
        const mapped: Record<string, unknown> = {};
        if (client.name !== undefined) mapped.name = client.name;
        if (client.phone !== undefined) mapped.phone = client.phone;
        if (client.birthDate !== undefined) mapped.birth_date = client.birthDate || null;
        if (client.notes !== undefined) mapped.notes = client.notes || null;

        // Update locally
        await localDb.clients.update(id, mapped);

        // Sync to Supabase
        if (isOnline()) {
            try {
                const { error } = await supabase.from('clients').update(mapped).eq('id', id);
                if (error) throw error;
            } catch (err) {
                console.error('[Clients] Online update failed, queued:', err);
                await enqueue('clients', 'update', id, mapped);
            }
        } else {
            await enqueue('clients', 'update', id, mapped);
        }
    },

    deleteClient: async (id: string) => {
        // Delete locally
        await localDb.clients.delete(id);

        // Sync to Supabase
        if (isOnline()) {
            try {
                const { error } = await supabase.from('clients').delete().eq('id', id);
                if (error) throw error;
            } catch (err) {
                console.error('[Clients] Online delete failed, queued:', err);
                await enqueue('clients', 'delete', id, null);
            }
        } else {
            await enqueue('clients', 'delete', id, null);
        }
    },
};

// ══════════════════════════════════════════════════════
// SERVICES
// ══════════════════════════════════════════════════════

export const servicesStorage = {
    getServices: async (): Promise<Service[]> => {
        const local = await localDb.services.orderBy('name').toArray();
        return local.map(s => ({
            id: s.id,
            name: s.name,
            price: s.price || '',
            duration: s.duration || '',
            icon: s.icon || 'content_cut',
            isPopular: s.is_popular,
        }));
    },

    saveService: async (service: Omit<Service, 'id'>) => {
        const id = generateId();
        const user_id = await getUserId();
        const record = {
            id,
            name: service.name,
            price: service.price,
            duration: service.duration,
            icon: service.icon,
            is_popular: service.isPopular,
            user_id,
        };

        await localDb.services.put(record);

        if (isOnline()) {
            try {
                const { error } = await supabase.from('services').insert([record]);
                if (error) throw error;
            } catch (err) {
                console.error('[Services] Online insert failed, queued:', err);
                await enqueue('services', 'insert', id, record);
            }
        } else {
            await enqueue('services', 'insert', id, record);
        }

        return { ...record };
    },

    updateService: async (id: string, service: Partial<Omit<Service, 'id'>>) => {
        const mapped: Record<string, unknown> = {};
        if (service.name !== undefined) mapped.name = service.name;
        if (service.price !== undefined) mapped.price = service.price;
        if (service.duration !== undefined) mapped.duration = service.duration;
        if (service.icon !== undefined) mapped.icon = service.icon;
        if (service.isPopular !== undefined) mapped.is_popular = service.isPopular;

        await localDb.services.update(id, mapped);

        if (isOnline()) {
            try {
                const { error } = await supabase.from('services').update(mapped).eq('id', id);
                if (error) throw error;
            } catch (err) {
                console.error('[Services] Online update failed, queued:', err);
                await enqueue('services', 'update', id, mapped);
            }
        } else {
            await enqueue('services', 'update', id, mapped);
        }
    },

    deleteService: async (id: string) => {
        await localDb.services.delete(id);

        if (isOnline()) {
            try {
                const { error } = await supabase.from('services').delete().eq('id', id);
                if (error) throw error;
            } catch (err) {
                console.error('[Services] Online delete failed, queued:', err);
                await enqueue('services', 'delete', id, null);
            }
        } else {
            await enqueue('services', 'delete', id, null);
        }
    },
};

// ══════════════════════════════════════════════════════
// APPOINTMENTS
// ══════════════════════════════════════════════════════

export const appointmentsStorage = {
    saveAppointment: async (appointment: Omit<Appointment, 'id'>) => {
        const id = generateId();
        const user_id = await getUserId();
        const record = { id, ...appointment, user_id };

        await localDb.appointments.put(record);

        if (isOnline()) {
            try {
                const { error } = await supabase.from('appointments').insert([record]);
                if (error) throw error;
            } catch (err) {
                console.error('[Appointments] Online insert failed, queued:', err);
                await enqueue('appointments', 'insert', id, record);
            }
        } else {
            await enqueue('appointments', 'insert', id, record);
        }

        return record;
    },

    getByDate: async (date: string): Promise<AppointmentWithDetails[]> => {
        const local = await localDb.appointments
            .where('appointment_date')
            .equals(date)
            .toArray();
        // Sort by time
        local.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
        // Resolve details from local tables
        return Promise.all(local.map(resolveAppointmentDetails));
    },

    getUpcoming: async (limit = 10): Promise<AppointmentWithDetails[]> => {
        const today = new Date().toISOString().split('T')[0];
        const all = await localDb.appointments
            .where('appointment_date')
            .aboveOrEqual(today)
            .toArray();
        // Sort by date then time
        all.sort((a, b) => {
            const dateCmp = a.appointment_date.localeCompare(b.appointment_date);
            return dateCmp !== 0 ? dateCmp : a.appointment_time.localeCompare(b.appointment_time);
        });
        const sliced = all.slice(0, limit);
        return Promise.all(sliced.map(resolveAppointmentDetails));
    },

    getByMonthRange: async (startDate: string, endDate: string): Promise<AppointmentWithDetails[]> => {
        const all = await localDb.appointments
            .where('appointment_date')
            .between(startDate, endDate, true, true)
            .toArray();
        all.sort((a, b) => {
            const dateCmp = a.appointment_date.localeCompare(b.appointment_date);
            return dateCmp !== 0 ? dateCmp : a.appointment_time.localeCompare(b.appointment_time);
        });
        return Promise.all(all.map(resolveAppointmentDetails));
    },

    deleteAppointment: async (id: string) => {
        await localDb.appointments.delete(id);

        if (isOnline()) {
            try {
                const { error } = await supabase.from('appointments').delete().eq('id', id);
                if (error) throw error;
            } catch (err) {
                console.error('[Appointments] Online delete failed, queued:', err);
                await enqueue('appointments', 'delete', id, null);
            }
        } else {
            await enqueue('appointments', 'delete', id, null);
        }
    },

    toggleConfirmation: async (id: string, confirmed: boolean) => {
        await localDb.appointments.update(id, { is_confirmed: confirmed });

        if (isOnline()) {
            try {
                const { error } = await supabase.from('appointments')
                    .update({ is_confirmed: confirmed }).eq('id', id);
                if (error) throw error;
            } catch (err) {
                console.error('[Appointments] Online toggle failed, queued:', err);
                await enqueue('appointments', 'update', id, { is_confirmed: confirmed });
            }
        } else {
            await enqueue('appointments', 'update', id, { is_confirmed: confirmed });
        }
    },
};

// ══════════════════════════════════════════════════════
// SCHEDULE CONFIG & BLOCKS
// ══════════════════════════════════════════════════════

export interface ScheduleConfig {
    id: string;
    day_index: number;
    day_name: string;
    is_open: boolean;
    start_time: string;
    end_time: string;
}

export interface ScheduleBlock {
    id: string;
    block_date: string;
    reason: string | null;
}

const DEFAULT_SCHEDULE: Omit<ScheduleConfig, 'id'>[] = [
    { day_index: 0, day_name: 'Domingo', is_open: false, start_time: '--:--', end_time: '--:--' },
    { day_index: 1, day_name: 'Segunda-feira', is_open: true, start_time: '09:00', end_time: '18:00' },
    { day_index: 2, day_name: 'Terça-feira', is_open: true, start_time: '09:00', end_time: '19:00' },
    { day_index: 3, day_name: 'Quarta-feira', is_open: true, start_time: '09:00', end_time: '19:00' },
    { day_index: 4, day_name: 'Quinta-feira', is_open: true, start_time: '09:00', end_time: '19:00' },
    { day_index: 5, day_name: 'Sexta-feira', is_open: true, start_time: '09:00', end_time: '20:00' },
    { day_index: 6, day_name: 'Sábado', is_open: true, start_time: '08:00', end_time: '17:00' },
];

export const scheduleStorage = {
    getConfig: async (): Promise<ScheduleConfig[]> => {
        let local = await localDb.schedule_config.orderBy('day_index').toArray();

        if (local.length === 0) {
            // Insert defaults locally
            const defaults = DEFAULT_SCHEDULE.map(d => ({ ...d, id: generateId() }));
            await localDb.schedule_config.bulkPut(defaults);
            local = defaults;

            // Also try to insert in Supabase if online
            if (isOnline()) {
                try {
                    const user_id = await getUserId().catch(() => null);
                    if (user_id) {
                        const withUser = defaults.map(d => ({ ...d, user_id }));
                        await supabase.from('schedule_config').insert(withUser);
                    }
                } catch { /* ignore */ }
            }
        }

        return local as ScheduleConfig[];
    },

    saveConfig: async (configs: ScheduleConfig[]) => {
        // Save locally
        await localDb.schedule_config.bulkPut(configs);

        const user_id = await getUserId().catch(() => null);

        // Sync each config to Supabase
        for (const cfg of configs) {
            const payload: Record<string, unknown> = {
                id: cfg.id,
                day_index: cfg.day_index,
                day_name: cfg.day_name,
                is_open: cfg.is_open,
                start_time: cfg.start_time,
                end_time: cfg.end_time,
                updated_at: new Date().toISOString(),
            };
            if (user_id) payload.user_id = user_id;

            if (isOnline()) {
                try {
                    const { error } = await supabase.from('schedule_config')
                        .upsert(payload, { onConflict: 'id' });
                    if (error) throw error;
                } catch (err) {
                    console.error('[Schedule] Online upsert failed, queued:', err);
                    await enqueue('schedule_config', 'upsert', cfg.id, payload);
                }
            } else {
                await enqueue('schedule_config', 'upsert', cfg.id, payload);
            }
        }
    },

    getBlocks: async (): Promise<ScheduleBlock[]> => {
        const local = await localDb.schedule_blocks.orderBy('block_date').toArray();
        return local as ScheduleBlock[];
    },

    addBlock: async (blockDate: string, reason: string) => {
        const id = generateId();
        const user_id = await getUserId();
        const record = { id, block_date: blockDate, reason: reason || null, user_id };

        await localDb.schedule_blocks.put(record);

        if (isOnline()) {
            try {
                const { error } = await supabase.from('schedule_blocks').insert([record]);
                if (error) throw error;
            } catch (err) {
                console.error('[Blocks] Online insert failed, queued:', err);
                await enqueue('schedule_blocks', 'insert', id, record);
            }
        } else {
            await enqueue('schedule_blocks', 'insert', id, record);
        }

        return record as ScheduleBlock;
    },

    removeBlock: async (id: string) => {
        await localDb.schedule_blocks.delete(id);

        if (isOnline()) {
            try {
                const { error } = await supabase.from('schedule_blocks').delete().eq('id', id);
                if (error) throw error;
            } catch (err) {
                console.error('[Blocks] Online delete failed, queued:', err);
                await enqueue('schedule_blocks', 'delete', id, null);
            }
        } else {
            await enqueue('schedule_blocks', 'delete', id, null);
        }
    },

    getConfigForDay: async (dayIndex: number): Promise<ScheduleConfig | null> => {
        const local = await localDb.schedule_config.where('day_index').equals(dayIndex).first();
        if (local) return local as ScheduleConfig;

        // Fallback to defaults
        const fallback = DEFAULT_SCHEDULE.find(d => d.day_index === dayIndex);
        return fallback ? { ...fallback, id: String(dayIndex) } : null;
    },
};
