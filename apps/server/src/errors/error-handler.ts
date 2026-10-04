import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod';
import { errorBody } from '../http/responses/envelope';
import type { App } from '../interfaces';
import { AppError } from './app-error';
import { InternalError, RouteNotFoundError, ValidationError } from './domain-errors';

const HTTP_CLIENT_ERROR_MIN = 400;
const HTTP_SERVER_ERROR_MIN = 500;

const readStatusCode = (error: unknown): number | undefined =>
  error instanceof Error && 'statusCode' in error && typeof error.statusCode === 'number'
    ? error.statusCode
    : undefined;

const clientErrorMessage = (statusCode: number): string => {
  if (statusCode === 413) return 'Request body too large';
  if (statusCode === 415) return 'Unsupported content type';
  return 'Malformed request';
};

/** Ramène n'importe quelle erreur à une AppError publique. Tout ce qui est inconnu devient INTERNAL_ERROR. */
export const toAppError = (error: unknown): AppError => {
  if (error instanceof AppError) return error;

  if (hasZodFastifySchemaValidationErrors(error)) {
    const issues = error.validation.map((issue) => ({
      path: issue.instancePath,
      message: issue.message,
    }));
    return new ValidationError('Invalid request', { in: error.validationContext, issues });
  }

  const statusCode = readStatusCode(error);
  if (
    statusCode !== undefined &&
    statusCode >= HTTP_CLIENT_ERROR_MIN &&
    statusCode < HTTP_SERVER_ERROR_MIN
  ) {
    return new ValidationError(clientErrorMessage(statusCode), undefined, statusCode);
  }

  return new InternalError();
};

export const registerErrorHandlers = (app: App): void => {
  app.setErrorHandler(async (error, request, reply) => {
    const appError = toAppError(error);
    if (appError instanceof InternalError) {
      request.log.error({ err: error }, 'Unhandled error');
    } else {
      request.log.info(
        { code: appError.code, statusCode: appError.statusCode },
        'Request rejected',
      );
    }
    await reply.code(appError.statusCode).send(errorBody(appError));
  });

  app.setNotFoundHandler(async (_request, reply) => {
    await reply.code(404).send(errorBody(new RouteNotFoundError()));
  });
};
