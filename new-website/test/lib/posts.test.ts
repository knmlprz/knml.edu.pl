import { beforeEach, describe, expect, it } from 'vitest';
import { collections } from '../astro-content';
import { posts } from '../fixtures/content';
import { formatDate, getPosts, isoDate } from '../../src/lib/posts';

beforeEach(() => {
  collections.blog = posts;
});

describe('getPosts', () => {
  it('pomija szkice i sortuje od najnowszego, także w obrębie jednego dnia', async () => {
    const ids = (await getPosts()).map((post) => post.id);
    expect(ids).toEqual(['wieczor', 'rano', 'stary']);
  });
});

describe('daty', () => {
  it('formatDate: po polsku DD.MM.RRRR, po angielsku en-GB', () => {
    const date = new Date('2023-10-06T08:00:00+02:00');
    expect(formatDate(date, 'pl')).toBe('06.10.2023');
    expect(formatDate(date, 'en')).toBe('6 Oct 2023');
  });

  it('isoDate: sama data RRRR-MM-DD, zgodna z datą pokazaną na stronie', () => {
    const date = new Date('2026-10-19T08:00:00+02:00');
    expect(isoDate(date)).toBe('2026-10-19');
    expect(formatDate(date, 'pl')).toBe('19.10.2026');
  });

  it('isoDate: data bez godziny z YAML (północ UTC) zostaje tym samym dniem', () => {
    expect(isoDate(new Date('2026-11-30'))).toBe('2026-11-30');
  });
});
