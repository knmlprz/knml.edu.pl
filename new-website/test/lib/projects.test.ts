import { beforeEach, describe, expect, it } from 'vitest';
import { collections } from '../astro-content';
import { posts, projectWithDraftPost, projectWithMissingPost, projects } from '../fixtures/content';
import { getProjects, projectUrl } from '../../src/lib/projects';

beforeEach(() => {
  collections.blog = posts;
  collections.projects = projects;
});

describe('getProjects', () => {
  it('sortuje wg pola order', async () => {
    const ids = (await getProjects('pl')).map((project) => project.id);
    expect(ids).toEqual(['bez-wpisu', 'z-wpisem']);
  });

  it('projekt z polem post prowadzi do wpisu, bez niego do /projekty/<id>/', async () => {
    const urls = (await getProjects('pl')).map(projectUrl);
    expect(urls).toEqual(['/projekty/bez-wpisu/', '/blog/rano/']);
  });

  it('zatrzymuje build, gdy post wskazuje wpis, którego nie ma', async () => {
    collections.projects = [...projects, projectWithMissingPost];
    await expect(getProjects('pl')).rejects.toThrow(/literowka.*nie-ma-takiego-wpisu/);
  });

  it('zatrzymuje build, gdy post wskazuje szkic', async () => {
    collections.projects = [...projects, projectWithDraftPost];
    await expect(getProjects('pl')).rejects.toThrow(/do-szkicu.*szkic/);
  });

  it('w wersji EN bierze pola z obiektu en', async () => {
    const [first] = await getProjects('en');
    expect(first.data.title).toBe('Project bez-wpisu');
  });
});
