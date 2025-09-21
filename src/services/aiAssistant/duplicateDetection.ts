/**
 * AI Assistant Service - Duplicate Detection
 * Helps prevent duplicate idea submissions by finding similar existing entries
 */

export interface SimilarityResult {
  id: string;
  title: string;
  similarity: number;
  category?: string;
}

/**
 * Calculate similarity between two strings using a simple algorithm
 * Returns a score between 0 and 1 (1 being identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  // Exact match
  if (s1 === s2) return 1;

  // Calculate word-based similarity
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  // Jaccard similarity coefficient
  const jaccard = intersection.size / union.size;

  // Check for substring matches
  const substringBonus = s1.includes(s2) || s2.includes(s1) ? 0.2 : 0;

  return Math.min(1, jaccard + substringBonus);
}

/**
 * Find similar ideas based on title and description
 */
export function findSimilarIdeas(
  newTitle: string,
  newDescription: string,
  existingIdeas: Array<{
    id: string;
    title: string;
    description: string;
    category?: string;
  }>,
  threshold = 0.3
): SimilarityResult[] {
  const results: SimilarityResult[] = [];

  for (const idea of existingIdeas) {
    // Calculate title similarity
    const titleSimilarity = calculateSimilarity(newTitle, idea.title);

    // Calculate description similarity
    const descSimilarity = calculateSimilarity(
      newDescription,
      idea.description
    );

    // Combined similarity score (weighted average)
    const combinedScore = titleSimilarity * 0.7 + descSimilarity * 0.3;

    if (combinedScore >= threshold) {
      results.push({
        id: idea.id,
        title: idea.title,
        similarity: combinedScore,
        category: idea.category,
      });
    }
  }

  // Sort by similarity score (highest first)
  return results.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Get similarity level description
 */
export function getSimilarityLevel(score: number): string {
  if (score >= 0.8) return 'Very High';
  if (score >= 0.6) return 'High';
  if (score >= 0.4) return 'Moderate';
  if (score >= 0.3) return 'Low';
  return 'Very Low';
}

/**
 * Format similarity percentage
 */
export function formatSimilarityPercentage(score: number): string {
  return `${Math.round(score * 100)}%`;
}
