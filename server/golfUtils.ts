import type { Course, Hole, User } from "@shared/schema";

/**
 * Calculate course handicap using official golf formula
 * Course Handicap = (Handicap Index × Slope Rating ÷ 113) + (Course Rating - Par)
 */
export function calculateCourseHandicap(
  handicapIndex: number,
  slopeRating: number,
  courseRating: number,
  par: number
): number {
  const courseHandicap = Math.round(
    (handicapIndex * slopeRating / 113) + (courseRating - par)
  );
  return Math.max(0, courseHandicap); // Handicap can't be negative
}

/**
 * Calculate how many strokes a player gets on a specific hole
 * based on their course handicap and the hole's difficulty ranking
 */
export function getStrokesForHole(
  courseHandicap: number,
  holeHandicapRanking: number
): number {
  if (courseHandicap >= holeHandicapRanking) {
    // Player gets at least 1 stroke on this hole
    const additionalStrokes = Math.floor((courseHandicap - holeHandicapRanking) / 18);
    return 1 + additionalStrokes;
  }
  return 0; // No strokes on this hole
}

/**
 * Calculate net strokes for a hole (gross strokes minus handicap strokes)
 */
export function calculateNetStrokes(
  grossStrokes: number,
  strokesReceived: number
): number {
  return Math.max(0, grossStrokes - strokesReceived);
}

/**
 * Calculate maximum score allowed for a hole (typically double par + handicap strokes)
 */
export function getMaxScoreForHole(
  par: number,
  strokesReceived: number
): number {
  return (par * 2) + strokesReceived;
}

/**
 * Calculate net score for a round using proper golf handicap system
 */
export function calculateRoundNetScore(
  scores: Array<{
    strokes: number;
    hole: Hole;
  }>,
  user: User,
  course: Course
): number {
  const courseHandicap = calculateCourseHandicap(
    parseFloat(user.handicapIndex.toString()),
    course.slopeRating,
    parseFloat(course.courseRating.toString()),
    course.par
  );

  let totalNetStrokes = 0;
  
  for (const score of scores) {
    const strokesReceived = getStrokesForHole(courseHandicap, score.hole.handicapRanking);
    const netStrokes = calculateNetStrokes(score.strokes, strokesReceived);
    totalNetStrokes += netStrokes;
  }

  return totalNetStrokes;
}

/**
 * Calculate gross score relative to par
 */
export function calculateScoreToPar(totalStrokes: number, par: number): number {
  return totalStrokes - par;
}

/**
 * Format score display (e.g., "E", "+2", "-1")
 */
export function formatScoreToPar(scoreToPar: number): string {
  if (scoreToPar === 0) return "E";
  return scoreToPar > 0 ? `+${scoreToPar}` : `${scoreToPar}`;
}

/**
 * Validate if a score is within acceptable range for a hole
 * Maximum score is double par + handicap strokes received
 */
export function validateHoleScore(
  strokes: number,
  hole: Hole,
  strokesReceived: number
): { isValid: boolean; maxScore: number } {
  const maxScore = getMaxScoreForHole(hole.par, strokesReceived);
  return {
    isValid: strokes >= 1 && strokes <= maxScore,
    maxScore
  };
}

/**
 * Get validation message for invalid score
 */
export function getScoreValidationMessage(
  strokes: number,
  hole: Hole,
  strokesReceived: number
): string {
  const { isValid, maxScore } = validateHoleScore(strokes, hole, strokesReceived);
  if (!isValid) {
    if (strokes < 1) {
      return "Score must be at least 1 stroke";
    }
    return `Maximum score for this hole is ${maxScore} (double par + ${strokesReceived} handicap strokes)`;
  }
  return "";
}

/**
 * Calculate leaderboard position with standard golf tie-breaking
 * Players with the same net score share the same position
 */
export function calculateLeaderboardPositions(
  players: Array<{
    userId: number;
    totalNetScore: number;
    scores: Array<{ holeNumber: number; netStrokes: number }>;
  }>
): Array<{
  userId: number;
  position: number;
  totalNetScore: number;
}> {
  // Sort by net score (lower is better)
  const sortedPlayers = players.sort((a, b) => {
    return a.totalNetScore - b.totalNetScore;
  });

  // Assign positions (handle ties properly)
  const results = [];
  let currentPosition = 1;
  
  for (let i = 0; i < sortedPlayers.length; i++) {
    const player = sortedPlayers[i];
    
    // Check if this player tied with the previous player
    if (i > 0 && sortedPlayers[i - 1].totalNetScore === player.totalNetScore) {
      // Same position as previous player
      results.push({
        userId: player.userId,
        position: results[i - 1].position,
        totalNetScore: player.totalNetScore,
      });
    } else {
      // New position
      results.push({
        userId: player.userId,
        position: currentPosition,
        totalNetScore: player.totalNetScore,
      });
    }
    
    currentPosition = i + 2; // Next available position
  }
  
  return results;
}