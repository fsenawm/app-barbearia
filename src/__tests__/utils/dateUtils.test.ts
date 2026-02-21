import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
    formatDateLocal,
    getDatesInRange,
    generateDynamicDates,
} from '../../utils/dateUtils'

// ── formatDateLocal ──────────────────────────────────────

describe('formatDateLocal', () => {
    it('formata uma data como YYYY-MM-DD no fuso local', () => {
        const date = new Date(2025, 0, 5) // 5 Jan 2025
        expect(formatDateLocal(date)).toBe('2025-01-05')
    })

    it('adiciona zero à esquerda no mês e dia de um dígito', () => {
        const date = new Date(2025, 8, 3) // 3 Set 2025
        expect(formatDateLocal(date)).toBe('2025-09-03')
    })

    it('funciona corretamente em dezembro', () => {
        const date = new Date(2025, 11, 31) // 31 Dez 2025
        expect(formatDateLocal(date)).toBe('2025-12-31')
    })

    it('funciona corretamente em anos bissextos', () => {
        const date = new Date(2024, 1, 29) // 29 Fev 2024
        expect(formatDateLocal(date)).toBe('2024-02-29')
    })
})

// ── getDatesInRange ──────────────────────────────────────

describe('getDatesInRange', () => {
    it('retorna o número correto de datas', () => {
        const start = new Date(2025, 0, 1)
        const result = getDatesInRange(start, 5)
        expect(result).toHaveLength(5)
    })

    it('a primeira data é a data de início', () => {
        const start = new Date(2025, 5, 10) // 10 Jun 2025
        const result = getDatesInRange(start, 3)
        expect(formatDateLocal(result[0])).toBe('2025-06-10')
    })

    it('as datas são consecutivas', () => {
        const start = new Date(2025, 5, 10)
        const result = getDatesInRange(start, 4)
        expect(formatDateLocal(result[1])).toBe('2025-06-11')
        expect(formatDateLocal(result[2])).toBe('2025-06-12')
        expect(formatDateLocal(result[3])).toBe('2025-06-13')
    })

    it('não muta a data de início', () => {
        const start = new Date(2025, 0, 1)
        const originalTime = start.getTime()
        getDatesInRange(start, 7)
        expect(start.getTime()).toBe(originalTime)
    })

    it('retorna array vazio com count = 0', () => {
        const start = new Date(2025, 0, 1)
        expect(getDatesInRange(start, 0)).toHaveLength(0)
    })

    it('cruza corretamente a virada de mês', () => {
        const start = new Date(2025, 0, 30) // 30 Jan
        const result = getDatesInRange(start, 3)
        expect(formatDateLocal(result[0])).toBe('2025-01-30')
        expect(formatDateLocal(result[1])).toBe('2025-01-31')
        expect(formatDateLocal(result[2])).toBe('2025-02-01')
    })
})

// ── generateDynamicDates ─────────────────────────────────

describe('generateDynamicDates', () => {
    beforeEach(() => {
        // Fixa a data em 15 Jan 2025 (Quarta-feira, dia_index=3)
        vi.useFakeTimers()
        vi.setSystemTime(new Date(2025, 0, 15))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('retorna 7 datas por padrão', () => {
        expect(generateDynamicDates()).toHaveLength(7)
    })

    it('respeita o argumento count', () => {
        expect(generateDynamicDates(3)).toHaveLength(3)
        expect(generateDynamicDates(14)).toHaveLength(14)
    })

    it('o primeiro item tem day = "Hoje"', () => {
        const result = generateDynamicDates(5)
        expect(result[0].day).toBe('Hoje')
    })

    it('os dias seguintes têm abreviações corretas', () => {
        const result = generateDynamicDates(7)
        // 15 Jan 2025 é Quarta (índice 3) → próximos: Qui, Sex, Sáb, Dom, Seg, Ter
        expect(result[1].day).toBe('Qui')
        expect(result[2].day).toBe('Sex')
        expect(result[3].day).toBe('Sáb')
        expect(result[4].day).toBe('Dom')
        expect(result[5].day).toBe('Seg')
        expect(result[6].day).toBe('Ter')
    })

    it('as datas numéricas são sequenciais a partir de hoje', () => {
        const result = generateDynamicDates(3)
        expect(result[0].date).toBe(15)
        expect(result[1].date).toBe(16)
        expect(result[2].date).toBe(17)
    })

    it('o mês é "Jan" para datas em janeiro', () => {
        const result = generateDynamicDates(1)
        expect(result[0].month).toBe('Jan')
    })

    it('fullDate é um objeto Date', () => {
        const result = generateDynamicDates(1)
        expect(result[0].fullDate).toBeInstanceOf(Date)
    })
})
