import { PERSON_NAME_MAX_LENGTH } from '@tablee/shared';
import { useId } from 'react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import { addNames } from './name-list';
import type { NameListFieldProps } from './NameListField.types';

/** Liste de prénoms : on tape, Entrée ou « Ajouter » crée une puce, toucher une puce la retire. */
export function NameListField({
  label,
  hint,
  inputLabel,
  placeholder,
  addLabel,
  removeLabel,
  max,
  value,
  onChange,
}: NameListFieldProps) {
  const legendId = useId();
  const full = value.names.length >= max;

  const commitDraft = (): void => {
    onChange({ names: addNames(value.names, value.draft, max), draft: '' });
  };

  return (
    <fieldset aria-labelledby={legendId} className="flex flex-col gap-3">
      <div className="flex flex-col">
        <span id={legendId} className="text-xl font-bold text-linen">
          {label}
        </span>
        <span className="text-lg text-linen-muted">{hint}</span>
      </div>
      {value.names.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.names.map((name) => (
            <li key={name}>
              <Chip
                trailingIcon="close"
                aria-label={removeLabel(name)}
                onClick={() => {
                  onChange({ ...value, names: value.names.filter((other) => other !== name) });
                }}
              >
                {name}
              </Chip>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-start gap-3">
        <TextField
          label={inputLabel}
          hideLabel
          className="min-w-0 flex-1"
          value={value.draft}
          placeholder={placeholder}
          maxLength={PERSON_NAME_MAX_LENGTH * 3}
          disabled={full}
          autoComplete="off"
          enterKeyHint="done"
          onChange={(event) => {
            onChange({ ...value, draft: event.currentTarget.value });
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commitDraft();
            }
          }}
        />
        <Button
          variant="quiet"
          icon="plus"
          className="min-h-16"
          disabled={full || value.draft.trim() === ''}
          onClick={commitDraft}
        >
          {addLabel}
        </Button>
      </div>
    </fieldset>
  );
}
