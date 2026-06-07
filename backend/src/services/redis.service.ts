import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

class RedisService {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
    });

    this.client.on('error', (err) => {
      console.error('[RedisService] Connection Error:', err);
      // Fail-Fast: Si Redis échoue, on arrête l'application car c'est une dépendance critique
      process.exit(1);
    });

    this.client.on('connect', () => {
      console.log('[RedisService] Connected successfully');
    });
  }

  public async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  public getClient(): RedisClientType {
    return this.client;
  }
}

// Export a singleton instance
export const redisService = new RedisService();
