import type { SessionDto, SessionSettings } from '@tablee/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { SessionContext } from '@/hooks/useSession';
import type { SessionNotice, SessionPhase } from '@/interfaces/session';
import { errorCodeOf } from '@/services/api/api-error';
import { createSession, deleteSession, fetchSession } from '@/services/api/sessions';
import {
  clearSessionId,
  loadLastTable,
  loadSessionId,
  saveLastTable,
  saveSessionId,
} from '@/services/storage/preferences';
import type { ProviderProps } from './providers.types';

function initialPhase(): SessionPhase {
  return loadSessionId() === null ? { status: 'onboarding', notice: null } : { status: 'restoring' };
}

/** Cycle de vie de la table : accueil → table, retour à l'accueil quand on quitte ou qu'elle expire. */
export function SessionProvider({ children }: ProviderProps) {
  const { setLanguage } = useI18n();
  const [phase, setPhase] = useState<SessionPhase>(initialPhase);
  const [draft, setDraft] = useState<SessionSettings | null>(loadLastTable);

  const activate = useCallback(
    (session: SessionDto) => {
      saveSessionId(session.id);
      saveLastTable(session.settings);
      setDraft(session.settings);
      setLanguage(session.settings.language);
      setPhase({ status: 'active', session });
    },
    [setLanguage],
  );

  useEffect(() => {
    const sessionId = loadSessionId();
    if (sessionId === null) {
      return undefined;
    }
    let cancelled = false;
    fetchSession(sessionId)
      .then((session) => {
        if (!cancelled) {
          activate(session);
        }
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        clearSessionId();
        const notice: SessionNotice =
          errorCodeOf(error) === 'NETWORK_ERROR' ? 'server_unreachable' : 'session_lost';
        setPhase({ status: 'onboarding', notice });
      });
    return () => {
      cancelled = true;
    };
  }, [activate]);

  const startSession = useCallback(
    async (settings: SessionSettings) => {
      activate(await createSession(settings));
    },
    [activate],
  );

  const leaveTable = useCallback(() => {
    if (phase.status === 'active') {
      deleteSession(phase.session.id).catch(() => undefined);
    }
    clearSessionId();
    setPhase({ status: 'onboarding', notice: null });
  }, [phase]);

  const endSession = useCallback((notice: SessionNotice) => {
    clearSessionId();
    setPhase({ status: 'onboarding', notice });
  }, []);

  const value = useMemo(
    () => ({ phase, draft, startSession, leaveTable, endSession }),
    [phase, draft, startSession, leaveTable, endSession],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}
