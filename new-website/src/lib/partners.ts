import { getCollection, type CollectionEntry } from 'astro:content';
import { localizeEntry, type Locale } from '../i18n';
import { isoDate } from './posts';

export type Partner = CollectionEntry<'partners'>;

// validUntil to ostatni dzień współpracy, więc porównujemy same daty (bez godzin).
// Strona jest statyczna: partner znika przy pierwszym buildzie po tej dacie.
const isActive = (partner: Partner) =>
  !partner.data.validUntil || isoDate(partner.data.validUntil) >= isoDate(new Date());

// Wszyscy aktualni partnerzy. Hero, sekcja Partnerzy i stopka biorą dane tylko stąd.
export async function getPartners(locale: Locale): Promise<Partner[]> {
  const partners = await getCollection('partners', isActive);
  return partners.map((partner) => localizeEntry(partner, locale));
}

export const isStrategic = (partner: Partner) => partner.data.tier === 'strategic';
