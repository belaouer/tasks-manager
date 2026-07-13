import type { LandingContent } from '../domain/landing-card';

const LANDING_CONTENT: LandingContent = {
  title: 'Pilotage des listes et taches en temps reel',
  lead: "Ce socle frontend inaugure la phase UI: structure Nuxt propre, direction visuelle claire et base responsive, avant l'integration fonctionnelle ecran par ecran.",
  cards: [
    {
      title: 'Architecture claire',
      description:
        'Layouts, pages et assets sont prets pour accueillir les modules fonctionnels.'
    },
    {
      title: 'UI responsive',
      description:
        'Interface lisible desktop/mobile avec typographie et contrastes intentionnels.'
    }
  ]
};

export function useLandingContent(): LandingContent {
  return LANDING_CONTENT;
}
