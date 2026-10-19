import { getCollection, type CollectionEntry } from 'astro:content';
import { achievementPlaces } from '../content.config';

export type Achievement = CollectionEntry<'achievements'>;

const placeRank = (achievement: Achievement) => achievementPlaces.indexOf(achievement.data.place);

// Od najnowszego roku; w tym samym roku od najwyższego miejsca.
export async function getAchievements(): Promise<Achievement[]> {
  const achievements = await getCollection('achievements');
  return achievements.sort((a, b) => b.data.year - a.data.year || placeRank(a) - placeRank(b));
}
