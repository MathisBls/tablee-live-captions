import {
  GUEST_NAMES_MAX_COUNT,
  languageSchema,
  NICKNAMES_MAX_COUNT,
  PERSON_NAME_MAX_LENGTH,
} from '@tablee/shared';
import { useId, useMemo, useRef } from 'react';
import { SafeArea } from '@/components/layout/SafeArea';
import { Wordmark } from '@/components/layout/Wordmark';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import { addNames } from '@/features/onboarding/name-list';
import { NameListField } from '@/features/onboarding/NameListField';
import { PlaceCard } from '@/features/onboarding/PlaceCard';
import { useOnboardingForm } from '@/features/onboarding/useOnboardingForm';
import { useI18n } from '@/hooks/useI18n';
import type { OnboardingPageProps } from './OnboardingPage.types';

export function OnboardingPage({ notice }: OnboardingPageProps) {
  const { messages, language, setLanguage } = useI18n();
  const copy = messages.onboarding;
  const listenerRef = useRef<HTMLInputElement>(null);
  const form = useOnboardingForm(listenerRef);
  const languageLabelId = useId();

  const listFormat = useMemo(
    () => new Intl.ListFormat(language, { type: 'conjunction' }),
    [language],
  );
  const guestNames = addNames(form.guests.names, form.guests.draft, GUEST_NAMES_MAX_COUNT);
  const guestsLine =
    guestNames.length === 0 ? null : copy.placeCardGuests(listFormat.format(guestNames));

  return (
    <SafeArea className="mx-auto grid max-w-7xl gap-x-20 gap-y-10 [grid-template-areas:'header'_'card'_'form'] md:landscape:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:landscape:[grid-template-areas:'header_card'_'form_card']">
      <header className="flex max-w-2xl flex-col gap-4 [grid-area:header]">
        <Wordmark name={messages.appName} className="text-3xl md:text-4xl" />
        <p className="mt-4 eyebrow text-candle">{copy.eyebrow}</p>
        <h1 className="font-serif text-[clamp(2.4rem,4.6vw,3.75rem)] leading-[1.05] font-semibold text-balance font-soft">
          {copy.title}
        </h1>
        <p className="max-w-xl text-xl text-pretty text-linen-muted">{copy.tagline}</p>
      </header>

      <PlaceCard
        brand={messages.appName}
        name={form.listenerName}
        emptyName={copy.placeCardEmpty}
        guestsLine={guestsLine}
        className="mx-auto w-full max-w-md self-start py-4 [grid-area:card] md:landscape:sticky md:landscape:top-24 md:landscape:mt-24"
      />

      <form
        noValidate
        className="flex max-w-2xl flex-col gap-9 [grid-area:form]"
        onSubmit={(event) => {
          event.preventDefault();
          void form.submit();
        }}
      >
        {notice !== null && (
          <p
            role="status"
            className="rounded-2xl border-2 border-terracotta bg-table-raised px-5 py-4 text-lg text-linen"
          >
            {copy.notices[notice]}
          </p>
        )}

        <TextField
          ref={listenerRef}
          label={copy.listenerLabel}
          hint={copy.listenerHint}
          placeholder={copy.listenerPlaceholder}
          value={form.listenerName}
          error={form.listenerError}
          maxLength={PERSON_NAME_MAX_LENGTH}
          autoComplete="off"
          autoCapitalize="words"
          enterKeyHint="next"
          onChange={(event) => {
            form.setListenerName(event.currentTarget.value);
          }}
        />

        <NameListField
          label={copy.nicknamesLabel}
          hint={copy.nicknamesHint}
          inputLabel={copy.nicknameInputLabel}
          addLabel={copy.addName}
          removeLabel={copy.removeName}
          max={NICKNAMES_MAX_COUNT}
          value={form.nicknames}
          onChange={form.setNicknames}
        />

        <NameListField
          label={copy.guestsLabel}
          hint={copy.guestsHint}
          inputLabel={copy.guestInputLabel}
          addLabel={copy.addName}
          removeLabel={copy.removeName}
          max={GUEST_NAMES_MAX_COUNT}
          value={form.guests}
          onChange={form.setGuests}
        />

        <div role="group" aria-labelledby={languageLabelId} className="flex flex-col gap-3">
          <span id={languageLabelId} className="text-xl font-bold text-linen">
            {copy.languageLabel}
          </span>
          <div className="flex flex-wrap gap-3">
            {languageSchema.options.map((code) => (
              <Chip
                key={code}
                lang={code}
                selected={code === language}
                onClick={() => {
                  setLanguage(code);
                }}
              >
                {messages.languageNames[code]}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Button
            type="submit"
            size="hero"
            busy={form.submitting}
            className="w-full md:landscape:w-auto md:landscape:min-w-80 md:landscape:self-start"
          >
            {form.submitting ? copy.submitting : copy.submit}
          </Button>
          {form.submitError !== null && (
            <p role="alert" className="text-lg font-bold text-terracotta">
              {form.submitError}
            </p>
          )}
          <p className="text-lg text-linen-muted">{copy.privacy}</p>
        </div>
      </form>
    </SafeArea>
  );
}
