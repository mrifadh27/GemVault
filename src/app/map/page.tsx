import { Metadata } from 'next';
import MapPageClient from './MapPageClient';

export const metadata: Metadata = { title: 'Origin Map · GemGram' };

export default function MapPage() {
  return <MapPageClient />;
}
