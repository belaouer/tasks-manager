export interface LandingCard {
  readonly title: string;
  readonly description: string;
}

export interface LandingContent {
  readonly title: string;
  readonly lead: string;
  readonly cards: readonly LandingCard[];
}
