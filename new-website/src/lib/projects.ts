import { getCollection, type CollectionEntry } from 'astro:content';
import { getPosts } from './posts';

export type Project = CollectionEntry<'projects'>;

// Wszystkie projekty wg pola order (rosnąco).
// Zatrzymuje build, gdy pole post wskazuje wpis, którego nie ma albo który jest szkicem
// (Astro tego nie sprawdza — karta prowadziłaby do strony 404).
export async function getProjects(): Promise<Project[]> {
  const projects = await getCollection('projects');
  const publishedPostIds = new Set((await getPosts()).map((post) => post.id));
  for (const project of projects) {
    const postId = project.data.post?.id;
    if (postId && !publishedPostIds.has(postId)) {
      throw new Error(
        `Projekt „${project.id}”: pole post wskazuje wpis „${postId}”, którego nie ma na blogu ` +
          '(literówka albo wpis ze statusem draft: true). Wpisz nazwę folderu z src/content/blog/.',
      );
    }
  }
  return projects.sort((a, b) => a.data.order - b.data.order);
}

export const projectUrl = (project: Project) =>
  project.data.post ? `/blog/${project.data.post.id}/` : `/projekty/${project.id}/`;
