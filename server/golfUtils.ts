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
 * Calculate leaderboard position with fun tie-breaking
 * First by net score, then by rock/paper/scissors for tied players
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
  tieBreaker?: string;
}> {
  // Sort by net score first
  const sortedPlayers = players.sort((a, b) => {
    if (a.totalNetScore !== b.totalNetScore) {
      return a.totalNetScore - b.totalNetScore;
    }
    
    // For tied players, use rock/paper/scissors tie-breaker
    // Generate consistent "choice" based on user ID for deterministic results
    const choices = ['rock', 'paper', 'scissors'];
    const aChoice = choices[a.userId % 3];
    const bChoice = choices[b.userId % 3];
    
    // Rock beats scissors, scissors beats paper, paper beats rock
    if (aChoice === bChoice) return 0; // Still tied
    if (
      (aChoice === 'rock' && bChoice === 'scissors') ||
      (aChoice === 'scissors' && bChoice === 'paper') ||
      (aChoice === 'paper' && bChoice === 'rock')
    ) {
      return -1; // a wins
    }
    return 1; // b wins
  });

  // Assign positions and track tie-breakers
  const results = [];
  let currentPosition = 1;
  
  for (let i = 0; i < sortedPlayers.length; i++) {
    const player = sortedPlayers[i];
    
    // Check if this player tied with the previous player on score
    const hasTie = i > 0 && sortedPlayers[i - 1].totalNetScore === player.totalNetScore;
    
    if (hasTie) {
      // Same position as previous player, but tie-breaker applied
      const choices = ['rock', 'paper', 'scissors'];
      const tieBreaker = choices[player.userId % 3];
      
      results.push({
        userId: player.userId,
        position: results[i - 1].position,
        totalNetScore: player.totalNetScore,
        tieBreaker: tieBreaker,
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

/**
 * Get rock/paper/scissors emoji for display
 */
export function getTieBreakerEmoji(choice: string): string {
  switch (choice) {
    case 'rock': return '🪨';
    case 'paper': return '📄';
    case 'scissors': return '✂️';
    default: return '';
  }
}