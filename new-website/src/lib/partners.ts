import { getCollection, type CollectionEntry } from 'astro:content';
import { isoDate } from './posts';

export type Partner = CollectionEntry<'partners'>;

// validUntil to ostatni dzień współpracy, więc porównujemy same daty (bez godzin).
// Strona jest statyczna: partner znika przy pierwszym buildzie po tej dacie.
const isActive = (partner: Partner) =>
  !partner.data.validUntil || isoDate(partner.data.validUntil) >= isoDate(new Date());

// Wszyscy aktualni partnerzy. Hero, sekcja Partnerzy i stopka biorą dane tylko stąd.
export async function getPartners(): Promise<Partner[]> {
  return getCollection('partners', isActive);
}

export const isStrategic = (partner: Partner) => partner.data.tier === 'strategic';
