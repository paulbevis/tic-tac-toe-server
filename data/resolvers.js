import {all, find, has, map, propEq} from 'ramda';
import {pubsub} from './subscriptions';


const winningPatterns = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const games = [];


const createNewGame = () => {
  return {
    id: games.length,
    status: 'Waiting',
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
  game.status = 'Game Over';
  game.cells[winningRow[0]].partOfWinLine = true;
  game.cells[winningRow[1]].partOfWinLine = true;
  game.cells[winningRow[2]].partOfWinLine = true;
  console.log('winning row: ',winningRow)
  if (game.players[0].value === game.cells[winningRow[0]].value) {
    game.players[0].status = 'Won!';
    game.players[1].status = 'Lost...';
  }
  if (game.players[1].value === game.cells[winningRow[0]].value) {
    game.players[1].status = 'Won!';
    game.players[0].status = 'Lost...';
  }
}

const getWinningRow = (game) => {
  const winningRowCheck = (winningRowArray) => {
    return game.cells[winningRowArray[0]].value && game.cells[winningRowArray[0]].value === game.cells[winningRowArray[1]].value &&
      game.cells[winningRowArray[1]].value === game.cells[winningRowArray[2]].value
  };
  return find(winningRowCheck)(winningPatterns);
}
const checkIfGameOver = (game) => {
  let winningRow = getWinningRow(game);
  if (winningRow) {
    updateGame(game, winningRow);
  } else {
    const valueNotSet = has('value')
    if (all(valueNotSet)(game.cells)) {
      game.status = 'Game Over - It was a draw!';
    }
  }
};

const findGameAvailableToJoin = (browserId, playerId) => {
  const onlyOnePlayerThatIsNotYou = (game)=> game.players.length === 1 && game.players[0].browserId !== browserId;
  return find(onlyOnePlayerThatIsNotYou)(games);
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
        game.cells[cellId].value = playerValue;
        game.nextTurn = game.nextTurn === game.players[0] ? game.players[1] : game.players[0];
        checkIfGameOver(game);
        console.log('selectCell:   ', game)
        pubsub.publish('gameUpdated', game);
      }
      return game.cells[cellId];
    },
    joinGame(_, {browserId, playerId, playerName}) {
      const player = {id: playerId, name: playerName, browserId}
      let game = findGameAvailableToJoin(browserId, playerId);
      if (!game) {
        game = createNewGame();
        games.push(game);
        console.log('created new game')
      } else {
        game.status = 'Playing';
        // pubsub.publish('gameUpdated', game);
      }
      if (game.players.length === 0) {
        player.value = 'X';
        game.nextTurn = player;
      } else {
        player.value = 'O';
      }
      game.players.push(player);
      pubsub.publish('gameUpdated', game);
      console.log('game joined ',game)
      return game.id;
    }
  },

  Subscription: {
    gameUpdated(game) {
      return game;
    },
    newGameCreated(game) {
      return game;
    },
    gameUpdated(game){
      return game;
    }
  }
};

export default resolveFunctions;
