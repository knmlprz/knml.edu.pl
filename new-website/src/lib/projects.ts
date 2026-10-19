import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;

// Wszystkie projekty wg pola order (rosnąco).
export async function getProjects(): Promise<Project[]> {
  const projects = await getCollection('projects');
  return projects.sort((a, b) => a.data.order - b.data.order);
}

export const projectUrl = (project: Project) =>
  project.data.post ? `/blog/${project.data.post.id}/` : `/projekty/${project.id}/`;
