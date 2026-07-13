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
    },
    {
      title: 'Prochaine etape',
      description:
        "Mettre en place l'auth frontend: session, guards de route et ecrans login/register."
    }
  ]
};

export function useLandingContent(): LandingContent {
  return LANDING_CONTENT;
}
