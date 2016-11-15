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


  }
  var result = game.players.map((player)=> {
    let winningRow = winningPatterns.filter(winningRowArray => {
      return game.cells[winningRowArray[0]].value === player.id
    })
    if (winningRow.length === 3) {
      player.status = 'Won';
      game.status = 'Game Over';
    }

  })
  console.log('result for win: ', result);
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
    registerPlayer(_, {playerId, gameBoardId, playerName}) {
      const game = games[gameBoardId];
      if (game.players.length === 2) {
        game.players = [];
      }
      if (game.players.length === 1 && game.players[0].id !== playerId) {
        game.players.push({id: playerId, value: 'O', name: playerName})
        if (game.players.length === 2) {
          game.status = 'Playing';
        } else {
          game.status = 'Waiting';
        }
        // pubsub.publish('gameUpdated', game);
      }
      if (game.players.length === 0) {
        game.players.push({id: playerId, value: 'X', name: playerName});
        const resetCellValue = (cell)=> {
          cell.value = '';
          return cell
        };
        game.cells = map(resetCellValue, game.cells);

        // pubsub.publish('gameUpdated', game);
      }
      return game.players[game.players.length - 1];
    },

    selectCell(_, {playerValue, cellId, gameBoardId}) {
      const game = games[gameBoardId];
      if (!game.cells[cellId].value) {
        game.cells[cellId].value = playerValue;
        checkIfGameOver(game);
        pubsub.publish('gameUpdated', game);
      }

      return game.cells[cellId];
    },

    joinGame(_, {playerId, playerName}) {
      const player = {id: playerId, name: playerName}
      const onlyOnePlayerThatIsNotYou = (game)=>game.players.length === 1 && game.players[0].id !== playerId;
      let game = find(onlyOnePlayerThatIsNotYou)(games);
      if (!game) {
        console.log('Creating new game...')
        game = createNewGame();
        games.push(game);
      } else {
        console.log('game exists: ')
      }
      if (game.players.length === 0) {
        player.value = 'X';
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
