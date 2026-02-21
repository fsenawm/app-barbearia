import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Mocks via vi.hoisted (evita problema de hoisting) ────

const { mockSyncQueueTable, mockLocalDb, mockSupabaseFrom } = vi.hoisted(() => {
    const mockSyncQueueTable = {
        add: vi.fn(),
        orderBy: vi.fn(),
        count: vi.fn(),
        delete: vi.fn(),
    }
    const mockLocalDb = {
        sync_queue: mockSyncQueueTable,
        clients: { clear: vi.fn(), bulkPut: vi.fn() },
        services: { clear: vi.fn(), bulkPut: vi.fn() },
        appointments: { clear: vi.fn(), bulkPut: vi.fn() },
        schedule_config: { clear: vi.fn(), bulkPut: vi.fn() },
        schedule_blocks: { clear: vi.fn(), bulkPut: vi.fn() },
        transaction: vi.fn(),
    }
    const mockSupabaseFrom = vi.fn()
    return { mockSyncQueueTable, mockLocalDb, mockSupabaseFrom }
})

vi.mock('../../lib/localDb', () => ({ localDb: mockLocalDb }))
vi.mock('../../lib/supabase', () => ({ supabase: { from: mockSupabaseFrom } }))

// Mock navigator.onLine via Object.defineProperty
const setOnline = (value: boolean) => {
    Object.defineProperty(navigator, 'onLine', { value, configurable: true, writable: true })
}

import { enqueue, processQueue, getPendingCount } from '../../lib/syncQueue'

// ── enqueue ──────────────────────────────────────────────

describe('enqueue', () => {
    beforeEach(() => vi.clearAllMocks())

    it('adiciona item à sync_queue com os campos corretos', async () => {
        mockSyncQueueTable.add.mockResolvedValue(1)
        await enqueue('clients', 'insert', 'uuid-1', { name: 'João' })
        expect(mockSyncQueueTable.add).toHaveBeenCalledWith({
            table: 'clients',
            operation: 'insert',
            recordId: 'uuid-1',
            payload: { name: 'João' },
            createdAt: expect.any(String),
        })
    })

    it('aceita payload null para operações delete', async () => {
        mockSyncQueueTable.add.mockResolvedValue(2)
        await enqueue('clients', 'delete', 'uuid-2', null)
        expect(mockSyncQueueTable.add).toHaveBeenCalledWith(
            expect.objectContaining({ payload: null, operation: 'delete' })
        )
    })

    it('createdAt é uma string ISO 8601 válida', async () => {
        mockSyncQueueTable.add.mockResolvedValue(3)
        await enqueue('services', 'update', 'uuid-3', {})
        const call = mockSyncQueueTable.add.mock.calls[0][0]
        expect(() => new Date(call.createdAt).toISOString()).not.toThrow()
    })
})

// ── getPendingCount ──────────────────────────────────────

describe('getPendingCount', () => {
    beforeEach(() => vi.clearAllMocks())

    it('retorna o count da tabela sync_queue', async () => {
        mockSyncQueueTable.count.mockResolvedValue(5)
        expect(await getPendingCount()).toBe(5)
    })

    it('retorna 0 quando fila está vazia', async () => {
        mockSyncQueueTable.count.mockResolvedValue(0)
        expect(await getPendingCount()).toBe(0)
    })
})

// ── processQueue ─────────────────────────────────────────

describe('processQueue', () => {
    beforeEach(() => vi.clearAllMocks())
    afterEach(() => setOnline(true))

    it('retorna { processed: 0, errors: 0 } quando offline', async () => {
        setOnline(false)
        expect(await processQueue()).toEqual({ processed: 0, errors: 0 })
    })

    it('retorna { processed: 0, errors: 0 } quando fila está vazia', async () => {
        setOnline(true)
        mockSyncQueueTable.orderBy.mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
        expect(await processQueue()).toEqual({ processed: 0, errors: 0 })
    })

    it('processa item de insert com sucesso', async () => {
        setOnline(true)
        const item = { autoId: 1, table: 'clients', operation: 'insert', recordId: 'u1', payload: { name: 'A' }, createdAt: '' }
        mockSyncQueueTable.orderBy.mockReturnValue({ toArray: vi.fn().mockResolvedValue([item]) })
        mockSyncQueueTable.delete.mockResolvedValue(undefined)
        mockSupabaseFrom.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: null }) })

        const result = await processQueue()
        expect(result).toEqual({ processed: 1, errors: 0 })
        expect(mockSyncQueueTable.delete).toHaveBeenCalledWith(1)
    })

    it('processa item de delete com sucesso', async () => {
        setOnline(true)
        const item = { autoId: 2, table: 'appointments', operation: 'delete', recordId: 'apt1', payload: null, createdAt: '' }
        mockSyncQueueTable.orderBy.mockReturnValue({ toArray: vi.fn().mockResolvedValue([item]) })
        mockSyncQueueTable.delete.mockResolvedValue(undefined)
        const eqMock = vi.fn().mockResolvedValue({ error: null })
        mockSupabaseFrom.mockReturnValue({ delete: vi.fn().mockReturnValue({ eq: eqMock }) })

        const result = await processQueue()
        expect(result).toEqual({ processed: 1, errors: 0 })
    })

    it('conta erros sem remover itens falhos da fila', async () => {
        setOnline(true)
        const item = { autoId: 3, table: 'clients', operation: 'insert', recordId: 'u3', payload: {}, createdAt: '' }
        mockSyncQueueTable.orderBy.mockReturnValue({ toArray: vi.fn().mockResolvedValue([item]) })
        mockSupabaseFrom.mockReturnValue({ insert: vi.fn().mockResolvedValue({ error: { message: 'DB error' } }) })

        const result = await processQueue()
        expect(result).toEqual({ processed: 0, errors: 1 })
        expect(mockSyncQueueTable.delete).not.toHaveBeenCalled()
    })

    it('processa múltiplos itens em ordem (FIFO)', async () => {
        setOnline(true)
        const items = [
            { autoId: 1, table: 'clients', operation: 'insert', recordId: 'u1', payload: { name: 'A' }, createdAt: '' },
            { autoId: 2, table: 'clients', operation: 'update', recordId: 'u1', payload: { name: 'B' }, createdAt: '' },
        ]
        mockSyncQueueTable.orderBy.mockReturnValue({ toArray: vi.fn().mockResolvedValue(items) })
        mockSyncQueueTable.delete.mockResolvedValue(undefined)
        const eqMock = vi.fn().mockResolvedValue({ error: null })
        mockSupabaseFrom.mockReturnValue({
            insert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockReturnValue({ eq: eqMock }),
        })

        const result = await processQueue()
        expect(result).toEqual({ processed: 2, errors: 0 })
    })
})
