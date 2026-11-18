import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'toledo_snow_disabled';
const CHANGE_EVENT = 'toledo:snow-preference';

const readDisabled = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

const subscribe = (callback) => {
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY) callback();
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', onStorage);
  };
};

// Per-viewer snow preference. The feature itself is gated by `[seasonal.snow]` in config.toml.
export function useSnowPreference() {
  const disabled = useSyncExternalStore(subscribe, readDisabled, () => false);

  const setEnabled = useCallback((enabled) => {
    try {
      if (enabled) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Storage unavailable (private mode): the toggle simply won't persist.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { snowEnabled: !disabled, setSnowEnabled: setEnabled };
}
