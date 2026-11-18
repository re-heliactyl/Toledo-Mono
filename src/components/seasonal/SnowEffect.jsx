import { lazy, Suspense, useSyncExternalStore } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useSnowPreference } from '@/hooks/useSnowPreference';

// The canvas engine is only downloaded when snow is actually shown.
const SnowCanvas = lazy(() => import('./SnowCanvas'));

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const subscribeMotion = (callback) => {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
};
const getReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches;

export default function SnowEffect() {
  const { settings } = useSettings();
  const { snowEnabled } = useSnowPreference();
  const reducedMotion = useSyncExternalStore(subscribeMotion, getReducedMotion, () => true);

  if (!settings?.features?.snow || !snowEnabled) return null;

  return (
    <Suspense fallback={null}>
      <SnowCanvas still={reducedMotion} />
    </Suspense>
  );
}
