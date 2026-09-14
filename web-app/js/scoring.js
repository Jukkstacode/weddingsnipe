export const SCORING = {
  skater: { goals: 3, assists: 2, plusMinus: 1, pim: 0.25, powerPlayPoints: 1, shorthandedPoints: 1, gameWinningGoals: 1.5 },
  goalie: { wins: 3, goalsAgainst: -1.5, saves: 0.2, shutouts: 6 },
};

export function fantasyPoints(stats, position) {
  if (!stats) return 0;
  if (position === 'G') {
    const g = SCORING.goalie;
    const saves = (stats.shotsAgainst || 0) - (stats.goalsAgainst || 0);
    return (stats.wins || 0) * g.wins + (stats.goalsAgainst || 0) * g.goalsAgainst
      + saves * g.saves + (stats.shutouts || 0) * g.shutouts;
  }
  const s = SCORING.skater;
  return (stats.goals || 0) * s.goals + (stats.assists || 0) * s.assists
    + (stats.plusMinus || 0) * s.plusMinus + (stats.pim || 0) * s.pim
    + (stats.powerPlayPoints || 0) * s.powerPlayPoints
    + (stats.shorthandedPoints || 0) * s.shorthandedPoints
    + (stats.gameWinningGoals || 0) * s.gameWinningGoals;
}
