import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateActivityLogDto {
  userId: string;
  action: string;
  endpoint: string;
  method: string;
  statusCode: number;
  ip?: string;
  userAgent?: string;
  description?: string;
  metadata?: any;
}

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un nuevo registro de actividad
   */
  async createLog(data: CreateActivityLogDto) {
    return this.prisma.activityLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        endpoint: data.endpoint,
        method: data.method,
        statusCode: data.statusCode,
        ip: data.ip,
        userAgent: data.userAgent,
        description: data.description,
        metadata: data.metadata,
      },
    });
  }

  /**
   * Obtiene todos los logs con filtros opcionales
   */
  async getLogs(filters?: {
    userId?: string;
    action?: string;
    endpoint?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.endpoint) {
      where.endpoint = { contains: filters.endpoint };
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: filters?.limit || 100,
        skip: filters?.offset || 0,
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data: logs,
      total,
      limit: filters?.limit || 100,
      offset: filters?.offset || 0,
    };
  }

  /**
   * Obtiene logs de un usuario específico
   */
  async getUserLogs(userId: string, limit = 50) {
    return this.prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Obtiene estadísticas de actividad
   */
  async getActivityStats(userId?: string) {
    const where = userId ? { userId } : {};

    const [totalLogs, logsByAction, logsByEndpoint, recentActivity] =
      await Promise.all([
        this.prisma.activityLog.count({ where }),
        this.prisma.activityLog.groupBy({
          by: ['action'],
          where,
          _count: {
            id: true,
          },
        }),
        this.prisma.activityLog.groupBy({
          by: ['endpoint'],
          where,
          _count: {
            id: true,
          },
          orderBy: {
            _count: {
              id: 'desc',
            },
          },
          take: 10,
        }),
        this.prisma.activityLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        }),
      ]);

    return {
      totalLogs,
      logsByAction,
      logsByEndpoint,
      recentActivity,
    };
  }
}
