export function generateStaticPixPayload(key: string, name: string = 'Barbearia', city: string = 'Brasil', amount?: string): string {
    const payloadFormatIndicator = "000201";
    
    // Remove formatting from key if it's CPF/CNPJ/Phone, but keep email or random key intact
    // Actually, PIX keys in payload should be raw. If it's phone, it must have +55. If it's CPF, no dots.
    // We will do a basic cleanup if it looks like phone or CPF.
    let cleanKey = key.trim();
    const isPhone = /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(cleanKey) || /^\d{11}$/.test(cleanKey);
    if (isPhone) {
        cleanKey = cleanKey.replace(/\D/g, '');
        if (cleanKey.length === 11) {
            cleanKey = '+55' + cleanKey;
        }
    } else if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cleanKey) || /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(cleanKey)) {
        cleanKey = cleanKey.replace(/\D/g, ''); // CPF or CNPJ
    }

    const merchantAccountInformation = `26${(22 + cleanKey.length).toString().padStart(2, '0')}0014br.gov.bcb.pix01${cleanKey.length.toString().padStart(2, '0')}${cleanKey}`;
    const merchantCategoryCode = "52040000";
    const transactionCurrency = "5303986";
    let transactionAmount = "";
    if (amount) {
        // Convert 'R$ 50,00' or '50.00' to a valid float string '50.00'
        const numericMatch = amount.match(/[\d.,]+/);
        if (numericMatch) {
            let numStr = numericMatch[0].replace(/\./g, '').replace(',', '.');
            if (!numStr.includes('.')) {
                // If the original had no decimal part and we just stripped everything, 
                // it might just be the raw number if the user typed 50
                // Let's rely on standard parsing
                const rawNum = amount.replace(/[^\d,.]/g, '');
                if (rawNum.includes(',')) {
                    numStr = rawNum.replace(/\./g, '').replace(',', '.');
                } else if (rawNum.includes('.')) {
                    numStr = rawNum;
                } else {
                    numStr = rawNum + '.00';
                }
            }
            const floatVal = parseFloat(numStr);
            if (!isNaN(floatVal)) {
                const amountStr = floatVal.toFixed(2);
                transactionAmount = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
            }
        }
    }
    const countryCode = "5802BR";
    
    // Clean name and city
    const safeName = name.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 25) || 'Barbearia';
    const safeCity = city.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 15) || 'Brasil';

    const merchantName = `59${safeName.length.toString().padStart(2, '0')}${safeName}`;
    const merchantCity = `60${safeCity.length.toString().padStart(2, '0')}${safeCity}`;
    const additionalDataFieldTemplate = "62070503***";
    
    let payload = payloadFormatIndicator + merchantAccountInformation + merchantCategoryCode + transactionCurrency + transactionAmount + countryCode + merchantName + merchantCity + additionalDataFieldTemplate + "6304";
    
    // Calculate CRC16 CCITT
    let polynomial = 0x1021;
    let result = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        result ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((result & 0x8000) !== 0) {
                result = (result << 1) ^ polynomial;
            } else {
                result = result << 1;
            }
        }
    }
    result = result & 0xFFFF;
    const crc = result.toString(16).toUpperCase().padStart(4, '0');
    return payload + crc;
}
