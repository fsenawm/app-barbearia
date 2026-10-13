function isValidCpf(val: string): boolean {
    if (val.length !== 11 || /^(\d)\1{10}$/.test(val)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(val[i], 10) * (10 - i);
    let rest = 11 - (sum % 11);
    let d1 = (rest === 10 || rest === 11) ? 0 : rest;
    if (d1 !== parseInt(val[9], 10)) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(val[i], 10) * (11 - i);
    rest = 11 - (sum % 11);
    let d2 = (rest === 10 || rest === 11) ? 0 : rest;
    return d2 === parseInt(val[10], 10);
}

export function cleanPixKey(key: string): string {
    const raw = key.trim();
    if (raw.includes('@')) {
        return raw.toLowerCase();
    }
    // Chave aleatória (EVP / UUID)
    if (/^[0-9a-fA-F-]{32,36}$/.test(raw) && raw.includes('-') && !raw.includes('.')) {
        return raw;
    }

    const digits = raw.replace(/\D/g, '');

    // CNPJ (14 dígitos)
    if (digits.length === 14) {
        return digits;
    }

    // Telefone com formato explícito (+55... ou (XX)...)
    if (raw.startsWith('+')) {
        return '+' + digits;
    }
    if (raw.includes('(') || raw.includes(')')) {
        return '+55' + digits;
    }

    // CPF formatado (000.000.000-00)
    if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(raw)) {
        return digits;
    }

    // 11 dígitos numéricos: checar se é CPF válido ou telefone
    if (digits.length === 11) {
        if (isValidCpf(digits)) {
            return digits; // CPF não pode ter +55
        }
        return '+55' + digits; // Telefone com DDD
    }

    // 10 dígitos (Telefone fixo com DDD)
    if (digits.length === 10) {
        return '+55' + digits;
    }

    return raw;
}

export function generateStaticPixPayload(key: string, name: string = 'Barbearia', city: string = 'Brasil', amount?: string): string {
    const payloadFormatIndicator = "000201";
    const pointOfInitiation = "010211"; // QR Code estático reutilizável
    
    const cleanKey = cleanPixKey(key);

    const merchantAccountInformation = `26${(22 + cleanKey.length).toString().padStart(2, '0')}0014br.gov.bcb.pix01${cleanKey.length.toString().padStart(2, '0')}${cleanKey}`;
    const merchantCategoryCode = "52040000";
    const transactionCurrency = "5303986";
    
    let transactionAmount = "";
    if (amount) {
        const cleanAmt = amount.replace(/[^\d.,]/g, '').trim();
        if (cleanAmt) {
            let numStr = cleanAmt;
            if (cleanAmt.includes(',') && cleanAmt.includes('.')) {
                numStr = cleanAmt.replace(/\./g, '').replace(',', '.');
            } else if (cleanAmt.includes(',')) {
                numStr = cleanAmt.replace(',', '.');
            }
            const floatVal = parseFloat(numStr);
            // Regra BACEN: O campo 54 só deve existir se o valor for estritamente maior que 0.00
            if (!isNaN(floatVal) && floatVal > 0) {
                const amountStr = floatVal.toFixed(2);
                transactionAmount = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
            }
        }
    }

    const countryCode = "5802BR";
    
    // Remove acentos e caracteres especiais para compatibilidade EMV
    const safeName = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .substring(0, 25)
        .trim() || 'Barbearia';

    const safeCity = city
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .substring(0, 15)
        .trim() || 'Brasil';

    const merchantName = `59${safeName.length.toString().padStart(2, '0')}${safeName}`;
    const merchantCity = `60${safeCity.length.toString().padStart(2, '0')}${safeCity}`;
    const additionalDataFieldTemplate = "62070503***";
    
    const payload = payloadFormatIndicator + pointOfInitiation + merchantAccountInformation + merchantCategoryCode + transactionCurrency + transactionAmount + countryCode + merchantName + merchantCity + additionalDataFieldTemplate + "6304";
    
    // Cálculo CRC16-CCITT (Polinômio 0x1021, valor inicial 0xFFFF)
    const polynomial = 0x1021;
    let result = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        result ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((result & 0x8000) !== 0) {
                result = ((result << 1) ^ polynomial) & 0xFFFF;
            } else {
                result = (result << 1) & 0xFFFF;
            }
        }
    }
    const crc = (result & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
    return payload + crc;
}
