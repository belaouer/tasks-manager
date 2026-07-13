import { computed } from 'vue';
import type { NetworkStatusPort } from '../domain/network-status.port';
import { BrowserNetworkStatusAdapter } from '../infrastructure/browser-network-status.adapter';

const NETWORK_ONLINE_KEY = 'tasks-manager.network.online';
const NETWORK_LISTENING_KEY = 'tasks-manager.network.listening';

interface UseNetworkStatusDependencies {
  readonly networkStatusPort?: NetworkStatusPort;
}

const defaultPort = new BrowserNetworkStatusAdapter();
let cleanupListeners: (() => void) | null = null;

export function useNetworkStatus(deps: UseNetworkStatusDependencies = {}) {
  const networkStatusPort = deps.networkStatusPort ?? defaultPort;
  const isOnline = useState<boolean>(NETWORK_ONLINE_KEY, () => networkStatusPort.getCurrentStatus());
  const isListening = useState<boolean>(NETWORK_LISTENING_KEY, () => false);

  function startTracking(): void {
    if (isListening.value) {
      return;
    }

    isOnline.value = networkStatusPort.getCurrentStatus();
    cleanupListeners = networkStatusPort.bind({
      onOnline: () => {
        isOnline.value = true;
      },
      onOffline: () => {
        isOnline.value = false;
      }
    });
    isListening.value = true;
  }

  function stopTracking(): void {
    if (!isListening.value) {
      return;
    }

    cleanupListeners?.();
    cleanupListeners = null;
    isListening.value = false;
  }

  return {
    isOnline: computed(() => isOnline.value),
    startTracking,
    stopTracking
  };
}
