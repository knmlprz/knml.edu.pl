import { getCollection, type CollectionEntry } from 'astro:content';
import { achievementPlaces } from '../content.config';
import { localizeEntry, type Locale } from '../i18n';

export type Achievement = CollectionEntry<'achievements'>;

const placeRank = (achievement: Achievement) => achievementPlaces.indexOf(achievement.data.place);

// Od najnowszego roku; w tym samym roku od najwyższego miejsca.
export async function getAchievements(locale: Locale): Promise<Achievement[]> {
  const achievements = await getCollection('achievements');
  return achievements
    .map((achievement) => localizeEntry(achievement, locale))
    .sort((a, b) => b.data.year - a.data.year || placeRank(a) - placeRank(b));
}
