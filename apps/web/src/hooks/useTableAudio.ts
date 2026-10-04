import { useMemo } from 'react';
import type { AudioStatus, TableAudioState } from '@/interfaces/audio';
import { createTableAudio } from '@/services/audio/table-audio';
import { useObservable } from './useObservable';

const initialAudioStatus: AudioStatus = { mic: 'starting', link: 'connecting' };

/** Démarre l'écoute de la table tant que le composant est monté. */
export function useTableAudio(sessionId: string): TableAudioState {
  const audio = useMemo(() => createTableAudio(sessionId), [sessionId]);
  const status = useObservable(audio.status$, initialAudioStatus);
  return { status, level$: audio.level$, restart: audio.restart };
}
