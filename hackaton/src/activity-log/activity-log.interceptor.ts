import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityLogService } from './activity-log.service';

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private readonly activityLogService: ActivityLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const user = request.user;

    // Solo registrar si hay un usuario autenticado
    if (!user) {
      return next.handle();
    }

    const startTime = Date.now();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';

    return next.handle().pipe(
      tap({
        next: () => {
          const statusCode = response.statusCode;
          const duration = Date.now() - startTime;

          // Determinar la acción basada en el método y la URL
          const action = this.determineAction(method, url);

          // Crear el log de actividad
          this.activityLogService
            .createLog({
              userId: user.id,
              action,
              endpoint: url,
              method,
              statusCode,
              ip,
              userAgent,
              description: `${method} ${url} - ${statusCode}`,
              metadata: {
                duration: `${duration}ms`,
                query: request.query,
                params: request.params,
              },
            })
            .catch((error) => {
              // Log silencioso para no interrumpir la petición
              console.error('Error al crear log de actividad:', error);
            });
        },
        error: (error) => {
          const statusCode = error.status || 500;
          const duration = Date.now() - startTime;
          const action = this.determineAction(method, url);

          // Registrar también los errores
          this.activityLogService
            .createLog({
              userId: user.id,
              action,
              endpoint: url,
              method,
              statusCode,
              ip,
              userAgent,
              description: `${method} ${url} - Error ${statusCode}`,
              metadata: {
                duration: `${duration}ms`,
                error: error.message,
                query: request.query,
                params: request.params,
              },
            })
            .catch((logError) => {
              console.error('Error al crear log de actividad:', logError);
            });
        },
      }),
    );
  }

  private determineAction(method: string, url: string): string {
    // Extraer la acción principal de la URL
    const urlParts = url.split('?')[0].split('/');
    const resource = urlParts[2] || 'UNKNOWN'; // Asumiendo /api/{resource}
    const action = urlParts[3] || '';

    const actionMap: Record<string, string> = {
      GET: 'READ',
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };

    const baseAction = actionMap[method] || method;

    // Crear una acción más descriptiva
    if (resource === 'auth') {
      if (action === 'login') return 'LOGIN';
      if (action === 'register') return 'REGISTER';
    }

    if (resource === 'visitas') {
      if (method === 'GET' && !action) return 'GET_VISITS';
      if (method === 'GET' && action) return 'GET_VISIT_DETAILS';
      if (method === 'POST' && !action) return 'CREATE_VISIT';
      if (action === 'checkin') return 'CHECKIN_VISIT';
      if (action === 'aprobar') return 'APPROVE_VISIT';
      if (action === 'rechazar') return 'REJECT_VISIT';
      if (action === 'validarVisitaPendiente') return 'VALIDATE_PENDING_VISIT';
    }

    if (resource === 'agenda') {
      return 'GET_AGENDA';
    }

    return `${baseAction}_${resource.toUpperCase()}`;
  }
}
