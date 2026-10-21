import { Choix } from '@/components/ui';
import { type PreferenceAffichage, useAffichage } from '@/lib/theme';

const LIBELLES = { auto: 'Automatique', clair: 'Clair', sombre: 'Sombre' } as const satisfies Record<PreferenceAffichage, string>;
const OPTIONS = Object.values(LIBELLES);

/** Choix de l'affichage : automatique (réglage de l'appareil), clair ou sombre. */
export function ChoixAffichage() {
  const { preference, choisir } = useAffichage();
  return (
    <Choix
      label="Affichage"
      options={OPTIONS}
      valeur={LIBELLES[preference]}
      onChange={(v) => choisir((Object.keys(LIBELLES) as PreferenceAffichage[]).find((k) => LIBELLES[k] === v) ?? 'auto')}
    />
  );
}
