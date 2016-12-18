import {all, find, has, map, propEq} from 'ramda';
import {pubsub} from './subscriptions';

import * as data from './data';
export let games = [];


const createNewGame = () => {
  return {
    id: games.length,
    status: data.WAITING,
    players: [],
    cells: [
      {id: 0},
      {id: 1},
      {id: 2},
      {id: 3},
      {id: 4},
      {id: 5},
      {id: 6},
      {id: 7},
      {id: 8}
    ]
  };
};

const updateGame = (game, winningRow) => {
  game.status = data.GAME_OVER;
  game.cells[winningRow[0]].partOfWinLine = true;
  game.cells[winningRow[1]].partOfWinLine = true;
  game.cells[winningRow[2]].partOfWinLine = true;
  if (game.players[0].value === game.cells[winningRow[0]].value) {
    game.players[0].endStatus = 'Won';
    game.players[1].endStatus = 'Lost';
  } else {
    if (game.players[1].value === game.cells[winningRow[0]].value) {
      game.players[1].endStatus = 'Won';
      game.players[0].endStatus = 'Lost';
    }       else{
      game.players[0].endStatus = 'Drew';
      game.players[1].endStatus = 'Drew';

    }
  }
};

const getWinningRow = (game) => {
  const winningRowCheck = (winningRowArray) => {
    return game.cells[winningRowArray[0]].value && game.cells[winningRowArray[0]].value === game.cells[winningRowArray[1]].value &&
      game.cells[winningRowArray[1]].value === game.cells[winningRowArray[2]].value
  };
  return find(winningRowCheck)(data.winningPatterns);
};

const checkIfGameOver = (game) => {
  let winningRow = getWinningRow(game);
  if (winningRow) {
    updateGame(game, winningRow);
  } else {
    const valueNotSet = has('value');
    if (all(valueNotSet)(game.cells)) {
      game.status = data.GAME_DRAWN;
    }
  }
};

const findGameAvailableToJoin = (browserId) => {
  const onlyOnePlayerThatIsNotYou = (game) => game.players.length === 1 && game.players[0].browserId !== browserId;
  return find(onlyOnePlayerThatIsNotYou)(games);
};

const currentlyPlaying = (browserId) => {
  const alreadyPlaying = (game) => {
    return (game.status === data.PLAYING || game.status === data.WAITING) && !!find(player => player.browserId === browserId)(game.players);
  };
  return find(alreadyPlaying)(games);
};

const updateGameFromCellClick = (game, playerValue, cellId) => {
  game.cells[cellId].value = playerValue;
  game.nextTurn = game.nextTurn === game.players[0] ? game.players[1] : game.players[0];
  checkIfGameOver(game);
  pubsub.publish('gameUpdated', game);
};

const updateOrCreateGame = (browserId, player) => {
  let game = findGameAvailableToJoin(browserId);
  if (!game) {
    game = createNewGame();
    games.push(game);
  } else {
    game.status = data.PLAYING;
  }
  if (game.players.length === 0) {
    player.value = 'X';
    game.nextTurn = player;
  } else {
    player.value = 'O';
  }
  game.players.push(player);
  pubsub.publish('gameUpdated', game);
  return game;
};

const resolveFunctions = {
  Query: {
    specificGameBoard(_, {gameBoardId}){
      return games[gameBoardId];
    },
    firstAvailableGameBoard(){
      return find(propEq('status', 'Waiting'))(games)
    }
  },

  Mutation: {
    selectCell(_, {playerValue, cellId, gameBoardId}) {
      const game = games[gameBoardId];
      if (!game.cells[cellId].value) {
        updateGameFromCellClick(game, playerValue, cellId);
      }
      return game.cells[cellId];
    },
    joinGame(_, {browserId, playerId, playerName}) {
      const player = {id: playerId, name: playerName, browserId};
      const currentGameBeingPlayedByPlayer = currentlyPlaying(browserId);
      if (currentGameBeingPlayedByPlayer) {
        if (currentGameBeingPlayedByPlayer.players.length > 1) {
          if (currentGameBeingPlayedByPlayer.status !== data.GAME_ABANDONED) {
            currentGameBeingPlayedByPlayer.status = data.GAME_ABANDONED;
            pubsub.publish('gameUpdated', currentGameBeingPlayedByPlayer);
          }
        } else {
          return currentGameBeingPlayedByPlayer.id;
        }
      }
      return updateOrCreateGame(browserId, player).id
    },
  },

  Subscription: {
    gameUpdated(game){
      return game;
    },
  },
};

export default resolveFunctions;
