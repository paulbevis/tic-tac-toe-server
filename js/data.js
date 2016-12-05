export const GAME_ABANDONED = {code: 'GAME_OVER', description: 'Game Abandoned'};
export const WAITING = {code: 'WAITING', description: "Waiting..."};
export const GAME_OVER = {code: 'GAME_OVER', description: "Game Over"};
export const GAME_DRAWN = {code: 'GAME_OVER', description: 'Game Over - It was a draw!'};
export const PLAYING = {code: 'PLAYING', description: "Playing"};

export const winningPatterns = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];