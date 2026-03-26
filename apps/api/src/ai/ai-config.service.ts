import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

export interface EffectiveAiConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  dailyLimit: number;
}

export interface AiConfigWithSource {
  provider: { value: string; source: 'custom' | 'default' };
  apiKey: { value: string; maskedValue: string; source: 'custom' | 'default' };
  baseUrl: { value: string; source: 'custom' | 'default' };
  model: { value: string; source: 'custom' | 'default' };
  dailyLimit: { value: number; source: 'custom' | 'default' };
}

@Injectable()
export class AiConfigService {
  private readonly logger = new Logger(AiConfigService.name);
  private readonly algorithm = 'aes-256-cbc';

  constructor(private prisma: PrismaService) {}

  private getEncryptionKey(): Buffer {
    const secret = process.env.JWT_SECRET || 'default-secret-key-for-dev';
    return crypto.createHash('sha256').update(secret).digest();
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.getEncryptionKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encrypted: string): string {
    try {
      const [ivHex, encryptedText] = encrypted.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.getEncryptionKey(), iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return encrypted; // fallback: return as-is if not encrypted
    }
  }

  private maskApiKey(key: string): string {
    if (!key || key.length < 8) return '***';
    return key.slice(0, 4) + '***' + key.slice(-4);
  }

  private getEnvDefaults() {
    return {
      provider: process.env.AI_PROVIDER || 'minimax',
      apiKey: process.env.AI_API_KEY || '',
      baseUrl: process.env.AI_BASE_URL || 'https://api.minimax.io/v1',
      model: process.env.AI_MODEL || 'MiniMax-Text-01',
      dailyLimit: parseInt(process.env.AI_DAILY_LIMIT || '50', 10),
    };
  }

  /**
   * Get the effective config (DB overrides > env defaults)
   */
  async getEffectiveConfig(): Promise<EffectiveAiConfig> {
    const defaults = this.getEnvDefaults();
    const dbConfig = await this.prisma.aiConfig.findUnique({
      where: { id: 'singleton' },
    });

    if (!dbConfig) return defaults;

    return {
      provider: dbConfig.provider || defaults.provider,
      apiKey: dbConfig.apiKey ? this.decrypt(dbConfig.apiKey) : defaults.apiKey,
      baseUrl: dbConfig.baseUrl || defaults.baseUrl,
      model: dbConfig.model || defaults.model,
      dailyLimit: dbConfig.dailyLimit ?? defaults.dailyLimit,
    };
  }

  /**
   * Get config with source info for admin display
   */
  async getConfigWithSource(): Promise<AiConfigWithSource> {
    const defaults = this.getEnvDefaults();
    const dbConfig = await this.prisma.aiConfig.findUnique({
      where: { id: 'singleton' },
    });

    const effective = await this.getEffectiveConfig();

    return {
      provider: {
        value: effective.provider,
        source: dbConfig?.provider ? 'custom' : 'default',
      },
      apiKey: {
        value: effective.apiKey,
        maskedValue: this.maskApiKey(effective.apiKey),
        source: dbConfig?.apiKey ? 'custom' : 'default',
      },
      baseUrl: {
        value: effective.baseUrl,
        source: dbConfig?.baseUrl ? 'custom' : 'default',
      },
      model: {
        value: effective.model,
        source: dbConfig?.model ? 'custom' : 'default',
      },
      dailyLimit: {
        value: effective.dailyLimit,
        source: dbConfig?.dailyLimit != null ? 'custom' : 'default',
      },
    };
  }

  /**
   * Update config (partial update, upsert singleton)
   */
  async updateConfig(data: {
    provider?: string;
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    dailyLimit?: number;
  }) {
    const updateData: any = {};
    if (data.provider !== undefined) updateData.provider = data.provider;
    if (data.apiKey !== undefined) updateData.apiKey = this.encrypt(data.apiKey);
    if (data.baseUrl !== undefined) updateData.baseUrl = data.baseUrl;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.dailyLimit !== undefined) updateData.dailyLimit = data.dailyLimit;

    return this.prisma.aiConfig.upsert({
      where: { id: 'singleton' },
      update: updateData,
      create: { id: 'singleton', ...updateData },
    });
  }

  /**
   * Reset a single field to default (set to null in DB)
   */
  async resetField(field: string) {
    const resetData: any = { [field]: null };
    // Special handling: dailyLimit is Int?, others are String?
    return this.prisma.aiConfig.upsert({
      where: { id: 'singleton' },
      update: resetData,
      create: { id: 'singleton' },
    });
  }
}
