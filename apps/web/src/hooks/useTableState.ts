import { useMemo } from 'react';
import type { TableState } from '@/interfaces/table';
import { watchTable } from '@/services/realtime/table-feed';
import { initialTableState } from '@/services/realtime/table-state';
import { useObservable } from './useObservable';

export function useTableState(sessionId: string): TableState {
  const table$ = useMemo(() => watchTable(sessionId), [sessionId]);
  return useObservable(table$, initialTableState);
}
