export abstract class NetworkStatusPort {
  abstract getCurrentStatus(): boolean;

  abstract bind(handlers: {
    readonly onOnline: () => void;
    readonly onOffline: () => void;
  }): () => void;
}
