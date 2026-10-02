import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export class Utilities {
	constructor(
		private readonly propertiesFilePath = resolve(__dirname, '../config/qaConfig.properties'),
	) {}

	readProperties(): Record<string, string> {
		const properties: Record<string, string> = {};
		const lines = readFileSync(this.propertiesFilePath, 'utf8').split(/\r?\n/);

		for (const rawLine of lines) {
			const line = rawLine.trim();
			if (!line || line.startsWith('#') || line.startsWith('!')) {
				continue;
			}

			const separatorIndex = line.indexOf('=');
			if (separatorIndex === -1) {
				continue;
			}

			const key = line.slice(0, separatorIndex).trim();
			if (key) {
				properties[key] = line.slice(separatorIndex + 1).trim();
			}
		}

		return properties;
	}

	getProperty(key: string): string | undefined {
		return this.readProperties()[key];
	}

	encrypt(value: string, passphrase: string): string {
		const salt = randomBytes(16);
		const iv = randomBytes(12);
		const cipher = createCipheriv('aes-256-gcm', this.deriveKey(passphrase, salt), iv);
		const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);

		return [
			'v1',
			salt.toString('base64'),
			iv.toString('base64'),
			cipher.getAuthTag().toString('base64'),
			ciphertext.toString('base64'),
		].join(':');
	}

	decrypt(encryptedValue: string, passphrase: string): string {
		const [version, encodedSalt, encodedIv, encodedAuthTag, encodedCiphertext, ...extra] = encryptedValue.split(':');
		if (version !== 'v1' || !encodedSalt || !encodedIv || !encodedAuthTag || encodedCiphertext === undefined || extra.length > 0) {
			throw new Error('Invalid encrypted value format');
		}

		const salt = Buffer.from(encodedSalt, 'base64');
		const iv = Buffer.from(encodedIv, 'base64');
		const authTag = Buffer.from(encodedAuthTag, 'base64');
		const decipher = createDecipheriv('aes-256-gcm', this.deriveKey(passphrase, salt), iv);
		decipher.setAuthTag(authTag);

		const plaintext = Buffer.concat([
			decipher.update(Buffer.from(encodedCiphertext, 'base64')),
			decipher.final(),
		]);
		return plaintext.toString('utf8');
	}

	private deriveKey(passphrase: string, salt: Buffer): Buffer {
		if (!passphrase) {
			throw new Error('A non-empty passphrase is required');
		}

		return scryptSync(passphrase, salt, 32);
	}
}
