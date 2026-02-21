import { test, expect } from '@playwright/test'

// ── Helpers ──────────────────────────────────────────────

async function waitForApp(page: Parameters<typeof test>[1] extends (page: infer P) => unknown ? P : never) {
    // Aguarda qualquer elemento de navegação estar visível
    await page.waitForSelector('nav, [data-testid="nav"], .bottom-nav, aside', { timeout: 10_000 })
}

// ── Testes de Navegação ──────────────────────────────────

test.describe('Navegação entre telas', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')
    })

    test('carrega a tela inicial (dashboard)', async ({ page }) => {
        await expect(page).toHaveURL('/')
        // Dashboard deve ter algum conteúdo visível
        await expect(page.locator('body')).not.toBeEmpty()
    })

    test('a página não tem erros de JavaScript graves', async ({ page }) => {
        const errors: string[] = []
        page.on('pageerror', (err) => errors.push(err.message))
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        // Filtra erros conhecidos/esperados (ex.: IndexedDB não disponível em headless)
        const fatalErrors = errors.filter(e =>
            !e.includes('IndexedDB') && !e.includes('IDBDatabase') && !e.includes('crypto')
        )
        expect(fatalErrors).toHaveLength(0)
    })

    test('responde em menos de 5 segundos no carregamento inicial', async ({ page }) => {
        const start = Date.now()
        await page.goto('/')
        await page.waitForLoadState('domcontentloaded')
        const elapsed = Date.now() - start
        expect(elapsed).toBeLessThan(5_000)
    })

    test('tem meta viewport para mobile', async ({ page }) => {
        await page.goto('/')
        const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
        expect(viewport).toContain('width=device-width')
    })
})

// ── Teste de PWA ─────────────────────────────────────────
// manifest e service worker só existem no build de produção (npm run build).
// Em dev (vite serve), esses recursos não são injetados.

test.describe('PWA', () => {
    test.skip('serve o manifest.json [requer build de produção]', async ({ page }) => {
        const response = await page.goto('/manifest.webmanifest')
        expect(response?.status()).toBe(200)
        const body = await response?.json()
        expect(body.name).toBeDefined()
        expect(body.icons).toBeDefined()
    })

    test.skip('tem link para o manifest no HTML [requer build de produção]', async ({ page }) => {
        await page.goto('/')
        const link = await page.locator('link[rel="manifest"]').getAttribute('href')
        expect(link).toBeTruthy()
    })
})

// ── Teste de Responsividade ──────────────────────────────

test.describe('Responsividade', () => {
    test('renderiza corretamente em viewport mobile (375x812)', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 })
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        // Não deve haver overflow horizontal
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
        const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5) // 5px de tolerância
    })

    test('renderiza corretamente em tablet (768x1024)', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 })
        await page.goto('/')
        await page.waitForLoadState('networkidle')
        await expect(page.locator('body')).not.toBeEmpty()
    })
})
