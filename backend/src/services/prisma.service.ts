import { PrismaClient } from '@prisma/client';

class PrismaService {
  public client: PrismaClient;

  constructor() {
    this.client = new PrismaClient();
  }

  public async connect(): Promise<void> {
    try {
      await this.client.$connect();
      console.log('[Prisma] Connecté à la base de données.');
    } catch (error) {
      console.error('[Prisma] Erreur de connexion à la base de données :', error);
    }
  }

  public async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }
}

export const prismaService = new PrismaService();
