import { useId } from 'react';
import { classNames } from './classNames';
import type { SliderProps } from './Slider.types';

export function Slider({ label, min, max, value, onChange, valueText, className }: SliderProps) {
  const inputId = useId();

  return (
    <div className={classNames('flex flex-col gap-1', className)}>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={inputId} className="text-xl font-bold text-linen">
          {label}
        </label>
        <span className="font-serif text-xl text-candle italic" aria-hidden="true">
          {valueText}
        </span>
      </div>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-valuetext={valueText}
        onChange={(event) => {
          onChange(event.currentTarget.valueAsNumber);
        }}
        className="range"
      />
    </div>
  );
}
