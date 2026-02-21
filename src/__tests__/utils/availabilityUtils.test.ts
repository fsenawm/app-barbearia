import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getAvailabilityForRange } from '../../utils/availabilityUtils'

// ── Mocks ────────────────────────────────────────────────

vi.mock('../../utils/storage', () => ({
    scheduleStorage: {
        getConfig: vi.fn(),
        getBlocks: vi.fn(),
    },
    appointmentsStorage: {
        getByDate: vi.fn(),
    },
}))

import { scheduleStorage, appointmentsStorage } from '../../utils/storage'

const mockConfig = [
    { id: '0', day_index: 0, day_name: 'Domingo',        is_open: false, start_time: '--:--', end_time: '--:--' },
    { id: '1', day_index: 1, day_name: 'Segunda-feira',  is_open: true,  start_time: '09:00', end_time: '12:00' },
    { id: '2', day_index: 2, day_name: 'Terça-feira',    is_open: true,  start_time: '09:00', end_time: '12:00' },
    { id: '3', day_index: 3, day_name: 'Quarta-feira',   is_open: true,  start_time: '09:00', end_time: '12:00' },
    { id: '4', day_index: 4, day_name: 'Quinta-feira',   is_open: true,  start_time: '09:00', end_time: '12:00' },
    { id: '5', day_index: 5, day_name: 'Sexta-feira',    is_open: true,  start_time: '09:00', end_time: '12:00' },
    { id: '6', day_index: 6, day_name: 'Sábado',         is_open: true,  start_time: '09:00', end_time: '12:00' },
]

// Fixa em uma segunda-feira 09:00
const MONDAY_9AM = new Date('2025-01-06T09:00:00')

describe('getAvailabilityForRange', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(MONDAY_9AM)
        vi.mocked(scheduleStorage.getConfig).mockResolvedValue(mockConfig)
        vi.mocked(scheduleStorage.getBlocks).mockResolvedValue([])
        vi.mocked(appointmentsStorage.getByDate).mockResolvedValue([])
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.clearAllMocks()
    })

    it('retorna o número correto de dias', async () => {
        const result = await getAvailabilityForRange(5)
        expect(result).toHaveLength(5)
    })

    it('dia fechado (domingo) tem isClosed=true e slots vazios', async () => {
        // Segunda (06/01) + 6 dias → chega em Domingo (12/01)
        const result = await getAvailabilityForRange(7)
        const sunday = result.find(d => d.dateStr === '2025-01-12')
        expect(sunday).toBeDefined()
        expect(sunday!.isClosed).toBe(true)
        expect(sunday!.slots).toHaveLength(0)
    })

    it('dia aberto gera slots a cada 30 minutos', async () => {
        // 09:00 – 12:00 = 6 slots: 09:00, 09:30, 10:00, 10:30, 11:00, 11:30
        const result = await getAvailabilityForRange(2)
        // result[0] é hoje (segunda); slots futuros após agora+15min (09:15)
        // 09:00 e 09:15 já passaram → restam: 09:30, 10:00, 10:30, 11:00, 11:30
        const tomorrow = result[1]
        expect(tomorrow.isClosed).toBe(false)
        expect(tomorrow.slots).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'])
    })

    it('dia bloqueado tem isClosed=true', async () => {
        vi.mocked(scheduleStorage.getBlocks).mockResolvedValue([
            { id: 'b1', block_date: '2025-01-07', reason: 'Feriado' },
        ])
        const result = await getAvailabilityForRange(2)
        const blocked = result.find(d => d.dateStr === '2025-01-07')
        expect(blocked!.isClosed).toBe(true)
        expect(blocked!.slots).toHaveLength(0)
    })

    it('slots ocupados são removidos (duração 30min)', async () => {
        vi.mocked(appointmentsStorage.getByDate).mockImplementation(async (date) => {
            if (date === '2025-01-07') {
                return [{
                    id: 'a1',
                    client_id: 'c1',
                    service_id: 's1',
                    appointment_date: '2025-01-07',
                    appointment_time: '09:00',
                    is_confirmed: false,
                    clientName: 'João',
                    clientPhone: '',
                    serviceName: 'Corte',
                    servicePrice: '',
                    serviceIcon: '',
                    serviceDuration: '30min',
                }]
            }
            return []
        })
        const result = await getAvailabilityForRange(2)
        const tuesday = result.find(d => d.dateStr === '2025-01-07')
        expect(tuesday!.slots).not.toContain('09:00')
        expect(tuesday!.slots).toContain('09:30')
    })

    it('slots ocupados são removidos (duração 1h = 2 slots)', async () => {
        vi.mocked(appointmentsStorage.getByDate).mockImplementation(async (date) => {
            if (date === '2025-01-07') {
                return [{
                    id: 'a1',
                    client_id: 'c1',
                    service_id: 's1',
                    appointment_date: '2025-01-07',
                    appointment_time: '09:00',
                    is_confirmed: false,
                    clientName: 'João',
                    clientPhone: '',
                    serviceName: 'Barba+Corte',
                    servicePrice: '',
                    serviceIcon: '',
                    serviceDuration: '1h',
                }]
            }
            return []
        })
        const result = await getAvailabilityForRange(2)
        const tuesday = result.find(d => d.dateStr === '2025-01-07')
        expect(tuesday!.slots).not.toContain('09:00')
        expect(tuesday!.slots).not.toContain('09:30')
        expect(tuesday!.slots).toContain('10:00')
    })

    it('hoje filtra slots que já passaram (+ 15min de buffer)', async () => {
        // Agora = 09:00 → buffer = 09:15 → remove 09:00, mantém 09:30+
        const result = await getAvailabilityForRange(1)
        const today = result[0]
        expect(today.slots).not.toContain('09:00')
        expect(today.slots).toContain('09:30')
    })

    it('retorna dateStr formatado como YYYY-MM-DD', async () => {
        const result = await getAvailabilityForRange(1)
        expect(result[0].dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
})
