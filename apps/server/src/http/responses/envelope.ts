import type { ApiErrorResponse } from '@tablee/shared';
import type { AppError } from '../../errors';
import type { DataResponse } from '../../interfaces';

export const ok = <TData>(data: TData): DataResponse<TData> => ({ data });

export const errorBody = (error: AppError): ApiErrorResponse => ({
  error: {
    code: error.code,
    message: error.publicMessage,
    ...(error.details === undefined ? {} : { details: error.details }),
  },
});
