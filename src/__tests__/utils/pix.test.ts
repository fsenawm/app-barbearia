import { describe, it, expect } from 'vitest';
import { cleanPixKey, generateStaticPixPayload } from '../../utils/pix';

describe('Pix payload utility', () => {
    describe('cleanPixKey', () => {
        it('deve manter CPF de 11 dígitos sem adicionar +55', () => {
            // CPF válido matematicamente
            const validCpf = '11144477735';
            expect(cleanPixKey(validCpf)).toBe('11144477735');
        });

        it('deve limpar CPF formatado sem adicionar +55', () => {
            expect(cleanPixKey('111.444.777-35')).toBe('11144477735');
        });

        it('deve adicionar +55 em telefone celular', () => {
            expect(cleanPixKey('(11) 98765-4321')).toBe('+5511987654321');
            expect(cleanPixKey('11987654321')).toBe('+5511987654321');
        });

        it('deve preservar telefone que já tem +55', () => {
            expect(cleanPixKey('+5511987654321')).toBe('+5511987654321');
        });

        it('deve limpar CNPJ sem adicionar +55', () => {
            expect(cleanPixKey('12.345.678/0001-90')).toBe('12345678000190');
            expect(cleanPixKey('12345678000190')).toBe('12345678000190');
        });

        it('deve manter email em minúsculo', () => {
            expect(cleanPixKey('Contato@Barbearia.com')).toBe('contato@barbearia.com');
        });

        it('deve manter chave aleatória (EVP)', () => {
            const evp = '123e4567-e89b-12d3-a456-426614174000';
            expect(cleanPixKey(evp)).toBe(evp);
        });
    });

    describe('generateStaticPixPayload', () => {
        it('não deve incluir o campo 54 quando o valor for zero ou zerado', () => {
            const payloadZeroStr = generateStaticPixPayload('11144477735', 'Barbearia', 'Brasil', '0');
            const payloadZeroDec = generateStaticPixPayload('11144477735', 'Barbearia', 'Brasil', '0.00');
            const payloadZeroBRL = generateStaticPixPayload('11144477735', 'Barbearia', 'Brasil', 'R$ 0,00');

            expect(payloadZeroStr).not.toContain('54040.00');
            expect(payloadZeroDec).not.toContain('54040.00');
            expect(payloadZeroBRL).not.toContain('54040.00');
            expect(payloadZeroStr).not.toContain('54');
        });

        it('deve incluir o campo 54 com valor correto quando maior que zero', () => {
            const payload = generateStaticPixPayload('11144477735', 'Barbearia', 'Brasil', 'R$ 35,00');
            expect(payload).toContain('540535.00');
        });

        it('deve conter o padrão BACEN 000201 e 010211', () => {
            const payload = generateStaticPixPayload('11144477735', 'Barbearia', 'Brasil', '50.00');
            expect(payload.startsWith('000201010211')).toBe(true);
        });
    });
});
