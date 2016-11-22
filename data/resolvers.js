import {all, find, map, propEq} from 'ramda';
import {pubsub} from './subscriptions';


const winningPatterns = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

const games = [];


const createNewGame = function() {
  const game = {
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
  return game;
};

const checkIfGameOver = (game) => {
  const valueNotSet = cell => !propEq('value', 0)
  if (all(valueNotSet)(game.cells)) {
    game.status = 'Game Over';
    pubsub.publish('gamestatusUpdated', game);
  }
  const winningRowCheck = (winningRowArray) => {
    return game.cells[winningRowArray[0]].value && game.cells[winningRowArray[0]].value === game.cells[winningRowArray[1]].value &&
      game.cells[winningRowArray[1]].value === game.cells[winningRowArray[2]].value
  };
  let winningRow = find(winningRowCheck)(winningPatterns);
  if (winningRow) {
    game.status = 'Game Over';
    game.cells[winningRow[0]].partOfWinLine = true;
    game.cells[winningRow[1]].partOfWinLine = true;
    game.cells[winningRow[2]].partOfWinLine = true;
    if (game.players[0].value === winningRow[0].value) {
      game.players[0].status = 'Won';
      game.players[1].status = 'Lost';
    }
    if (game.players[1].value === winningRow[0].value) {
      game.players[1].status = 'Won';
      game.players[0].status = 'Lost';
    }
    console.log('IsGame Over? :', game)
    pubsub.publish('gamestatusUpdated', counter);
  }
};

const counter = {value: 0};
const resolveFunctions = {
  Query: {
    specificGameBoard(_, {gameBoardId}){
      return games[gameBoardId];
    },
    firstAvailableGameBoard(){
      console.log('firstAvailableGameBoard called: result: ', games);
      return find(propEq('status', 'Waiting'))(games)
    },
    currentCounterResult(){
      return counter;
    }

  },
  Mutation: {
    incrementCounter(_, {increaseBy}){
      counter.value = counter.value + increaseBy;
      pubsub.publish('counterChanged', counter);
      return counter
    },

    selectCell(_, {playerValue, cellId, gameBoardId}) {
      const game = games[gameBoardId];
      if (!game.cells[cellId].value) {
        game.cells[cellId].value = playerValue;
        checkIfGameOver(game);
        game.nextTurn = game.nextTurn === game.players[0] ? game.players[1] : game.players[0];
        console.log('game updated....')
        pubsub.publish('gameUpdated', game);
      }

      return game.cells[cellId];
    },

    joinGame(_, {playerId, playerName}) {
      const player = {id: playerId, name: playerName}
      const onlyOnePlayerThatIsNotYou = (game)=>game.players.length === 1 && game.players[0].id !== playerId;
      let game = find(onlyOnePlayerThatIsNotYou)(games);
      if (!game) {
        game = createNewGame();
        games.push(game);
      } else {
        console.log('game exists: ')
        game.status = 'Playing';
        pubsub.publish('gamestatusUpdated', game);
      }
      if (game.players.length === 0) {
        player.value = 'X';
        game.nextTurn = player;
      } else {
        player.value = 'O';
      }
      game.players.push(player);
      pubsub.publish('gameJoined', game);

      return game.id;
    }

  },
  Subscription: {
    gameUpdated(game) {
      return game;
    },
    cellSelected(game)
    {
      return game;
    },
    newGameCreated(game)
    {
      return game;
    },
    counterChanged(counter)
    {
      return counter;
    },
    gameJoined(game)
    {
      return game;
    }
  }
};

export default resolveFunctions;
