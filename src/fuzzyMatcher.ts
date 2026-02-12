import { Person, Family, Activity, FuzzyMatch } from "./types";

/**
 * Levenshtein distance algorithm for fuzzy string matching
 * Returns a distance score (lower = more similar)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const a = str1.toLowerCase();
  const b = str2.toLowerCase();

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Convert distance to similarity score (0-1)
 * Higher = more similar
 */
function distanceToSimilarity(distance: number, maxLength: number): number {
  if (maxLength === 0) return distance === 0 ? 1 : 0;
  return Math.max(0, 1 - distance / maxLength);
}

/**
 * Tokenize name for word-level matching
 */
function tokenizeName(name: string): string[] {
  return name
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * Check if tokens have common elements
 */
function hasCommonTokens(tokens1: string[], tokens2: string[]): boolean {
  return tokens1.some((t1) => tokens2.some((t2) => t1 === t2));
}

export class FuzzyMatcher {
  /**
   * Find similar person names
   * Returns matches sorted by similarity (best first)
   */
  static findSimilarPeople(
    searchName: string,
    people: Person[],
    threshold: number = 0.6,
  ): FuzzyMatch[] {
    const matches: FuzzyMatch[] = [];
    const searchTokens = tokenizeName(searchName);

    for (const person of people) {
      const distance = levenshteinDistance(searchName, person.name);
      const maxLen = Math.max(searchName.length, person.name.length);
      const similarity = distanceToSimilarity(distance, maxLen);

      // Boost score if common tokens found
      let adjustedSimilarity = similarity;
      const personTokens = tokenizeName(person.name);
      if (hasCommonTokens(searchTokens, personTokens)) {
        adjustedSimilarity = Math.min(1, similarity + 0.2);
      }

      if (adjustedSimilarity >= threshold) {
        matches.push({
          id: person.id,
          name: person.name,
          similarity: adjustedSimilarity,
        });
      }
    }

    // Sort by similarity (best first)
    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Find similar family names
   */
  static findSimilarFamilies(
    searchName: string,
    families: Family[],
    threshold: number = 0.6,
  ): FuzzyMatch[] {
    const matches: FuzzyMatch[] = [];
    const searchTokens = tokenizeName(searchName);

    for (const family of families) {
      const distance = levenshteinDistance(searchName, family.familyName);
      const maxLen = Math.max(searchName.length, family.familyName.length);
      const similarity = distanceToSimilarity(distance, maxLen);

      // Boost score if common tokens found
      let adjustedSimilarity = similarity;
      const familyTokens = tokenizeName(family.familyName);
      if (hasCommonTokens(searchTokens, familyTokens)) {
        adjustedSimilarity = Math.min(1, similarity + 0.2);
      }

      if (adjustedSimilarity >= threshold) {
        matches.push({
          id: family.id,
          name: family.familyName,
          similarity: adjustedSimilarity,
        });
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Find similar activity names
   */
  static findSimilarActivities(
    searchName: string,
    activities: Activity[],
    threshold: number = 0.6,
  ): FuzzyMatch[] {
    const matches: FuzzyMatch[] = [];
    const searchTokens = tokenizeName(searchName);

    for (const activity of activities) {
      const distance = levenshteinDistance(searchName, activity.name);
      const maxLen = Math.max(searchName.length, activity.name.length);
      const similarity = distanceToSimilarity(distance, maxLen);

      // Boost score if common tokens found
      let adjustedSimilarity = similarity;
      const activityTokens = tokenizeName(activity.name);
      if (hasCommonTokens(searchTokens, activityTokens)) {
        adjustedSimilarity = Math.min(1, similarity + 0.2);
      }

      if (adjustedSimilarity >= threshold) {
        matches.push({
          id: activity.id,
          name: activity.name,
          similarity: adjustedSimilarity,
        });
      }
    }

    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Find exact person match by name and area
   */
  static findPersonExact(
    name: string,
    area: string,
    people: Person[],
  ): Person | null {
    return (
      people.find(
        (p) =>
          p.name.toLowerCase() === name.toLowerCase() &&
          p.area.toLowerCase() === area.toLowerCase(),
      ) || null
    );
  }

  /**
   * Find exact family match by name
   */
  static findFamilyExact(name: string, families: Family[]): Family | null {
    return (
      families.find((f) => f.familyName.toLowerCase() === name.toLowerCase()) ||
      null
    );
  }

  /**
   * Find exact activity match by name
   */
  static findActivityExact(
    name: string,
    activities: Activity[],
  ): Activity | null {
    return (
      activities.find((a) => a.name.toLowerCase() === name.toLowerCase()) ||
      null
    );
  }

  /**
   * Get best match above threshold, or top match if none meet threshold
   */
  static getBestMatch(
    matches: FuzzyMatch[],
    threshold: number = 0.75,
  ): FuzzyMatch | null {
    if (matches.length === 0) return null;

    const aboveThreshold = matches.filter((m) => m.similarity >= threshold);
    if (aboveThreshold.length > 0) {
      return aboveThreshold[0];
    }

    // Return top match even if below threshold
    return matches[0];
  }

  /**
   * Get top N matches
   */
  static getTopMatches(matches: FuzzyMatch[], limit: number = 3): FuzzyMatch[] {
    return matches.slice(0, limit);
  }

  /**
   * Batch match multiple names to people
   */
  static batchMatchPeople(
    names: string[],
    people: Person[],
    threshold: number = 0.6,
  ): Map<string, FuzzyMatch[]> {
    const results = new Map<string, FuzzyMatch[]>();

    for (const name of names) {
      const matches = this.findSimilarPeople(name, people, threshold);
      results.set(name, matches);
    }

    return results;
  }

  /**
   * Calculate string similarity ratio (0-1)
   * Useful for debugging and testing
   */
  static calculateSimilarity(str1: string, str2: string): number {
    const distance = levenshteinDistance(str1, str2);
    const maxLen = Math.max(str1.length, str2.length);
    return distanceToSimilarity(distance, maxLen);
  }
}
