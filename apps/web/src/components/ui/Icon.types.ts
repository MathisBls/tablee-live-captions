export type IconName = 'close' | 'plus' | 'arrow-down' | 'sliders' | 'history' | 'refresh' | 'leave';

export interface IconProps {
  readonly name: IconName;
  readonly className?: string;
}
