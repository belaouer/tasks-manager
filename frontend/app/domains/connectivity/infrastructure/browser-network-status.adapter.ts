import { NetworkStatusPort } from '../domain/network-status.port';

export class BrowserNetworkStatusAdapter extends NetworkStatusPort {
  getCurrentStatus(): boolean {
    if (!import.meta.client) {
      return true;
    }

    return navigator.onLine;
  }

  bind(handlers: { readonly onOnline: () => void; readonly onOffline: () => void }): () => void {
    if (!import.meta.client) {
      return () => undefined;
    }

    window.addEventListener('online', handlers.onOnline);
    window.addEventListener('offline', handlers.onOffline);

    return () => {
      window.removeEventListener('online', handlers.onOnline);
      window.removeEventListener('offline', handlers.onOffline);
    };
  }
}
