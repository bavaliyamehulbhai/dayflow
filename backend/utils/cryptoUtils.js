const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes tag

/**
 * Encrypts text using AES-256-GCM
 * Returns string in format: iv.authTag.encryptedContent
 */
const encrypt = (text) => {
    if (!text) return text;
    if (!process.env.ENCRYPTION_KEY) {
        console.error('ENCRYPTION_KEY is not set');
        return text;
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
        ALGORITHM,
        Buffer.from(process.env.ENCRYPTION_KEY, 'hex'),
        iv
    );

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}.${authTag}.${encrypted}`;
};

/**
 * Decrypts text using AES-256-GCM
 * Input format: iv.authTag.encryptedContent
 */
const isHex = (str) => /^[0-9a-f]+$/i.test(str);

const decrypt = (hash) => {
    if (!hash) return hash;
    if (!process.env.ENCRYPTION_KEY) {
        // Log once to avoid flooding
        return hash;
    }

    // Encrypted format is exactly: ivHex.authTagHex.encryptedHex
    const parts = hash.split('.');
    if (parts.length !== 3) return hash; // Not encrypted data

    const [ivHex, authTagHex, encryptedHex] = parts;

    // Validate all parts are non-empty hex strings with expected lengths
    if (!ivHex || !authTagHex || !encryptedHex) return hash;
    if (!isHex(ivHex) || !isHex(authTagHex) || !isHex(encryptedHex)) return hash;
    if (ivHex.length !== IV_LENGTH * 2 || authTagHex.length !== AUTH_TAG_LENGTH * 2) return hash;

    try {
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const encrypted = Buffer.from(encryptedHex, 'hex');

        const decipher = crypto.createDecipheriv(
            ALGORITHM,
            Buffer.from(process.env.ENCRYPTION_KEY, 'hex'),
            iv
        );

        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption failed:', error.message);
        // If decryption fails, it might be unencrypted legacy data
        return hash;
    }
};

module.exports = { encrypt, decrypt };
