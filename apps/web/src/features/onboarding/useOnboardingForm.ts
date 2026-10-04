import type { ClientErrorCode } from '@/interfaces/api';
import type { NameListState, OnboardingForm } from '@/interfaces/session';
import { GUEST_NAMES_MAX_COUNT, NICKNAMES_MAX_COUNT, sessionSettingsSchema } from '@tablee/shared';
import type { RefObject } from 'react';
import { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useSession } from '@/hooks/useSession';
import { errorCodeOf } from '@/services/api/api-error';
import { addNames } from './name-list';

/**
 * Formulaire d'accueil, pré-rempli avec la dernière table. La langue est celle de l'interface.
 * `listenerRef` désigne le champ du prénom, où l'on ramène le focus s'il manque.
 */
export function useOnboardingForm(listenerRef: RefObject<HTMLInputElement | null>): OnboardingForm {
  const { draft: lastTable, startSession } = useSession();
  const { language, messages } = useI18n();
  const [listenerName, setListenerName] = useState(lastTable?.listenerName ?? '');
  const [nicknames, setNicknames] = useState<NameListState>({
    names: lastTable?.nicknames ?? [],
    draft: '',
  });
  const [guests, setGuests] = useState<NameListState>({
    names: lastTable?.guestNames ?? [],
    draft: '',
  });
  const [listenerMissing, setListenerMissing] = useState(false);
  const [submitError, setSubmitError] = useState<ClientErrorCode | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (): Promise<void> => {
    // Un prénom tapé mais pas encore « ajouté » compte quand même : personne ne doit le perdre.
    const parsed = sessionSettingsSchema.safeParse({
      listenerName,
      nicknames: addNames(nicknames.names, nicknames.draft, NICKNAMES_MAX_COUNT),
      guestNames: addNames(guests.names, guests.draft, GUEST_NAMES_MAX_COUNT),
      language,
    });
    if (!parsed.success) {
      const listenerEmpty = listenerName.trim() === '';
      setListenerMissing(listenerEmpty);
      setSubmitError(listenerEmpty ? null : 'VALIDATION_ERROR');
      listenerRef.current?.focus();
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await startSession(parsed.data);
    } catch (error) {
      setSubmitError(errorCodeOf(error));
      setSubmitting(false);
    }
  };

  return {
    listenerName,
    nicknames,
    guests,
    listenerError:
      listenerMissing && listenerName.trim() === '' ? messages.onboarding.listenerRequired : null,
    submitError: submitError === null ? null : messages.errors[submitError],
    submitting,
    setListenerName,
    setNicknames,
    setGuests,
    submit,
  };
}
