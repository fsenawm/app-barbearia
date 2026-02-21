import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks via vi.hoisted ──────────────────────────────────

const { mockLocalDb, mockIsOnline, mockEnqueue, mockSupabaseFrom } = vi.hoisted(() => {
    // Chainable helper
    const chainable = (data: unknown[]) => ({ toArray: vi.fn().mockResolvedValue(data) })

    const mockLocalDb = {
        clients: {
            orderBy: vi.fn().mockReturnValue(chainable([])),
            get: vi.fn(),
            put: vi.fn().mockResolvedValue(undefined),
            update: vi.fn().mockResolvedValue(1),
            delete: vi.fn().mockResolvedValue(undefined),
        },
        services: {
            orderBy: vi.fn().mockReturnValue(chainable([])),
            put: vi.fn().mockResolvedValue(undefined),
            update: vi.fn().mockResolvedValue(1),
            delete: vi.fn().mockResolvedValue(undefined),
        },
        appointments: {
            put: vi.fn().mockResolvedValue(undefined),
            where: vi.fn(),
            delete: vi.fn().mockResolvedValue(undefined),
            update: vi.fn().mockResolvedValue(1),
        },
    }
    const mockIsOnline = vi.fn().mockReturnValue(false)
    const mockEnqueue = vi.fn().mockResolvedValue(undefined)
    const mockSupabaseFrom = vi.fn()
    return { mockLocalDb, mockIsOnline, mockEnqueue, mockSupabaseFrom }
})

vi.mock('../../lib/localDb', () => ({ localDb: mockLocalDb }))
vi.mock('../../lib/syncQueue', () => ({ isOnline: mockIsOnline, enqueue: mockEnqueue }))
vi.mock('../../lib/supabase', () => ({ supabase: { from: mockSupabaseFrom } }))

import { clientsStorage, servicesStorage, appointmentsStorage } from '../../utils/storage'

// Chainable helper disponível nos testes
function chainableOrderBy(data: unknown[]) {
    return { toArray: vi.fn().mockResolvedValue(data) }
}

// ── clientsStorage ───────────────────────────────────────

describe('clientsStorage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockIsOnline.mockReturnValue(false)
        mockEnqueue.mockResolvedValue(undefined)
        mockLocalDb.clients.put.mockResolvedValue(undefined)
        mockLocalDb.clients.update.mockResolvedValue(1)
        mockLocalDb.clients.delete.mockResolvedValue(undefined)
    })

    describe('getClients', () => {
        it('retorna clientes mapeados de camelCase', async () => {
            mockLocalDb.clients.orderBy.mockReturnValue(
                chainableOrderBy([
                    { id: '1', name: 'João', phone: '11999999999', birth_date: '1990-01-01', notes: 'VIP' },
                ])
            )
            const result = await clientsStorage.getClients()
            expect(result).toHaveLength(1)
            expect(result[0]).toEqual({
                id: '1',
                name: 'João',
                phone: '11999999999',
                birthDate: '1990-01-01',
                notes: 'VIP',
            })
        })

        it('mapeia birth_date null para undefined', async () => {
            mockLocalDb.clients.orderBy.mockReturnValue(
                chainableOrderBy([{ id: '2', name: 'Ana', phone: '11888888888', birth_date: null, notes: null }])
            )
            const result = await clientsStorage.getClients()
            expect(result[0].birthDate).toBeUndefined()
            expect(result[0].notes).toBeUndefined()
        })

        it('retorna lista vazia quando não há clientes', async () => {
            mockLocalDb.clients.orderBy.mockReturnValue(chainableOrderBy([]))
            expect(await clientsStorage.getClients()).toHaveLength(0)
        })
    })

    describe('saveClient', () => {
        it('salva no localDb sempre', async () => {
            await clientsStorage.saveClient({ name: 'Pedro', phone: '11777777777' })
            expect(mockLocalDb.clients.put).toHaveBeenCalledOnce()
        })

        it('enfileira no sync_queue quando offline', async () => {
            await clientsStorage.saveClient({ name: 'Pedro', phone: '11777777777' })
            expect(mockEnqueue).toHaveBeenCalledWith('clients', 'insert', expect.any(String), expect.any(Object))
        })

        it('salva no Supabase quando online', async () => {
            mockIsOnline.mockReturnValue(true)
            const insertMock = vi.fn().mockResolvedValue({ error: null })
            mockSupabaseFrom.mockReturnValue({ insert: insertMock })
            await clientsStorage.saveClient({ name: 'Pedro', phone: '11777777777' })
            expect(mockSupabaseFrom).toHaveBeenCalledWith('clients')
            expect(insertMock).toHaveBeenCalledOnce()
        })

        it('retorna registro com id gerado e dados corretos', async () => {
            const result = await clientsStorage.saveClient({ name: 'Maria', phone: '11666666666' })
            expect(result.id).toBeDefined()
            expect(result.name).toBe('Maria')
            expect(result.phone).toBe('11666666666')
        })

        it('mapeia birthDate para birth_date no registro', async () => {
            await clientsStorage.saveClient({ name: 'Ana', phone: '11555', birthDate: '1995-03-15' })
            const putArg = mockLocalDb.clients.put.mock.calls[0][0]
            expect(putArg.birth_date).toBe('1995-03-15')
        })
    })

    describe('updateClient', () => {
        it('atualiza no localDb', async () => {
            await clientsStorage.updateClient('1', { name: 'João Novo' })
            expect(mockLocalDb.clients.update).toHaveBeenCalledWith('1', { name: 'João Novo' })
        })

        it('mapeia birthDate → birth_date', async () => {
            await clientsStorage.updateClient('1', { birthDate: '2000-05-20' })
            expect(mockLocalDb.clients.update).toHaveBeenCalledWith('1', { birth_date: '2000-05-20' })
        })

        it('enfileira quando offline', async () => {
            await clientsStorage.updateClient('1', { name: 'Novo' })
            expect(mockEnqueue).toHaveBeenCalledWith('clients', 'update', '1', expect.any(Object))
        })
    })

    describe('deleteClient', () => {
        it('deleta do localDb', async () => {
            await clientsStorage.deleteClient('abc')
            expect(mockLocalDb.clients.delete).toHaveBeenCalledWith('abc')
        })

        it('enfileira delete quando offline', async () => {
            await clientsStorage.deleteClient('abc')
            expect(mockEnqueue).toHaveBeenCalledWith('clients', 'delete', 'abc', null)
        })
    })
})

// ── servicesStorage ──────────────────────────────────────

describe('servicesStorage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockIsOnline.mockReturnValue(false)
        mockEnqueue.mockResolvedValue(undefined)
        mockLocalDb.services.put.mockResolvedValue(undefined)
        mockLocalDb.services.delete.mockResolvedValue(undefined)
    })

    describe('getServices', () => {
        it('mapeia snake_case para camelCase', async () => {
            mockLocalDb.services.orderBy.mockReturnValue(
                chainableOrderBy([
                    { id: 's1', name: 'Corte', price: '35.00', duration: '30min', icon: 'content_cut', is_popular: true },
                ])
            )
            const result = await servicesStorage.getServices()
            expect(result[0]).toEqual({
                id: 's1',
                name: 'Corte',
                price: '35.00',
                duration: '30min',
                icon: 'content_cut',
                isPopular: true,
            })
        })

        it('icon default é "content_cut" quando nulo', async () => {
            mockLocalDb.services.orderBy.mockReturnValue(
                chainableOrderBy([{ id: 's2', name: 'Barba', price: '25', duration: '', icon: null, is_popular: false }])
            )
            const result = await servicesStorage.getServices()
            expect(result[0].icon).toBe('content_cut')
        })
    })

    describe('saveService', () => {
        it('salva localmente e enfileira quando offline', async () => {
            await servicesStorage.saveService({ name: 'Hidratação', price: '50', duration: '1h', icon: 'spa', isPopular: false })
            expect(mockLocalDb.services.put).toHaveBeenCalledOnce()
            expect(mockEnqueue).toHaveBeenCalledWith('services', 'insert', expect.any(String), expect.any(Object))
        })

        it('mapeia isPopular → is_popular no registro', async () => {
            await servicesStorage.saveService({ name: 'Corte', price: '35', duration: '30min', icon: 'scissors', isPopular: true })
            const putArg = mockLocalDb.services.put.mock.calls[0][0]
            expect(putArg.is_popular).toBe(true)
        })
    })

    describe('updateService', () => {
        it('atualiza localmente', async () => {
            mockLocalDb.services.update.mockResolvedValue(1)
            await servicesStorage.updateService('s1', { name: 'Corte Novo' })
            expect(mockLocalDb.services.update).toHaveBeenCalledWith('s1', { name: 'Corte Novo' })
        })

        it('mapeia isPopular → is_popular na atualização', async () => {
            mockLocalDb.services.update.mockResolvedValue(1)
            await servicesStorage.updateService('s1', { isPopular: false })
            expect(mockLocalDb.services.update).toHaveBeenCalledWith('s1', { is_popular: false })
        })
    })

    describe('deleteService', () => {
        it('deleta localmente e enfileira quando offline', async () => {
            await servicesStorage.deleteService('s1')
            expect(mockLocalDb.services.delete).toHaveBeenCalledWith('s1')
            expect(mockEnqueue).toHaveBeenCalledWith('services', 'delete', 's1', null)
        })
    })
})

// ── appointmentsStorage ──────────────────────────────────

describe('appointmentsStorage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockIsOnline.mockReturnValue(false)
        mockEnqueue.mockResolvedValue(undefined)
        mockLocalDb.appointments.put.mockResolvedValue(undefined)
        mockLocalDb.appointments.update.mockResolvedValue(1)
        mockLocalDb.appointments.delete.mockResolvedValue(undefined)
    })

    describe('saveAppointment', () => {
        it('salva localmente e enfileira quando offline', async () => {
            const payload = {
                client_id: 'c1',
                service_id: 's1',
                appointment_date: '2025-06-10',
                appointment_time: '10:00',
                is_confirmed: false,
            }
            const result = await appointmentsStorage.saveAppointment(payload)
            expect(mockLocalDb.appointments.put).toHaveBeenCalledOnce()
            expect(result.id).toBeDefined()
            expect(result.appointment_date).toBe('2025-06-10')
            expect(mockEnqueue).toHaveBeenCalledWith('appointments', 'insert', result.id, expect.any(Object))
        })

        it('retorna o registro com id gerado', async () => {
            const result = await appointmentsStorage.saveAppointment({
                client_id: 'c1', service_id: 's1',
                appointment_date: '2025-07-01', appointment_time: '14:00', is_confirmed: false,
            })
            expect(typeof result.id).toBe('string')
            expect(result.id.length).toBeGreaterThan(0)
        })
    })

    describe('toggleConfirmation', () => {
        it('atualiza is_confirmed para true localmente', async () => {
            await appointmentsStorage.toggleConfirmation('apt1', true)
            expect(mockLocalDb.appointments.update).toHaveBeenCalledWith('apt1', { is_confirmed: true })
        })

        it('atualiza is_confirmed para false localmente', async () => {
            await appointmentsStorage.toggleConfirmation('apt1', false)
            expect(mockLocalDb.appointments.update).toHaveBeenCalledWith('apt1', { is_confirmed: false })
        })

        it('enfileira update quando offline', async () => {
            await appointmentsStorage.toggleConfirmation('apt1', false)
            expect(mockEnqueue).toHaveBeenCalledWith('appointments', 'update', 'apt1', { is_confirmed: false })
        })
    })

    describe('deleteAppointment', () => {
        it('deleta localmente e enfileira quando offline', async () => {
            await appointmentsStorage.deleteAppointment('apt2')
            expect(mockLocalDb.appointments.delete).toHaveBeenCalledWith('apt2')
            expect(mockEnqueue).toHaveBeenCalledWith('appointments', 'delete', 'apt2', null)
        })
    })
})
