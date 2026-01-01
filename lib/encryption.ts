import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";

/**
 * Encrypt sensitive data using AES-256-CBC
 */
export function encrypt(text: string): string {
    if (!ENCRYPTION_KEY) {
        throw new Error(
            "Please define the ENCRYPTION_KEY environment variable inside .env.local"
        );
    }

    try {
        const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
        return encrypted;
    } catch (error) {
        console.error("Encryption error:", error);
        throw new Error("Failed to encrypt data");
    }
}

/**
 * Decrypt sensitive data using AES-256-CBC
 */
export function decrypt(encryptedText: string): string {
    if (!ENCRYPTION_KEY) {
        throw new Error(
            "Please define the ENCRYPTION_KEY environment variable inside .env.local"
        );
    }

    try {
        const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);

        if (!decrypted) {
            throw new Error("Decryption resulted in empty string");
        }

        return decrypted;
    } catch (error) {
        console.error("Decryption error:", error);
        throw new Error("Failed to decrypt data");
    }
}
