import type { SessionNotice } from '@/interfaces/session';

export interface OnboardingPageProps {
  readonly notice: SessionNotice | null;
}
