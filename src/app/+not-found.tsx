import { Redirect } from 'expo-router';

// Toute adresse inconnue ramène à l'accueil (utile quand l'app est intégrée dans une autre page).
export default function Introuvable() {
  return <Redirect href="/" />;
}
