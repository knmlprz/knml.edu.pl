import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { collections } from '../astro-content';
import { partners } from '../fixtures/content';
import { getPartners } from '../../src/lib/partners';

beforeEach(() => {
  collections.partners = partners;
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-30T12:00:00+01:00'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getPartners', () => {
  it('pokazuje partnerów bez validUntil i tych, których umowa trwa do dziś lub dłużej', async () => {
    const ids = (await getPartners('pl')).map((partner) => partner.id);
    expect(ids).toEqual(['bez-daty', 'do-dzis', 'do-jutra']);
  });

  it('dzień po validUntil partner znika', async () => {
    vi.setSystemTime(new Date('2026-12-01T12:00:00+01:00'));
    const ids = (await getPartners('pl')).map((partner) => partner.id);
    expect(ids).toEqual(['bez-daty', 'do-jutra']);
  });

  it('w wersji EN bierze pola z obiektu en', async () => {
    const [first] = await getPartners('en');
    expect(first.data.name).toBe('Partner bez-daty EN');
  });
});
