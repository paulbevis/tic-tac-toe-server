import {makeExecutableSchema} from 'graphql-tools';

import resolvers from './resolvers';

const schema = `
type Counter {
  value: Int
}

type Player {
  id: String!,
  endStatus: PlayerEndState,
  value: String,
  name: String,
  browserId: String
}

type Cell{
  id: Int!,
  value: String,
  partOfWinLine: Boolean
}

enum GameStatus {
  WAITING,
  PLAYING,
  GAME_OVER,
  GAME_ABANDONED
}

enum PlayerEndState{
  Won,
  Lost,
  Drew
}

type Status {
  code: GameStatus!,
  description: String!
}

type Game {
  id: Int!,
  players: [Player],
  cells: [Cell],
  status: Status!,
  nextTurn: Player
}  


# the schema allows the following query:
type Query {
  specificGameBoard(gameBoardId: Int!): Game,
  firstAvailableGameBoard: Game,
  currentCounterResult:Counter
}

# this schema allows the following mutation:
type Mutation {
  selectCell(playerValue: String!, cellId: Int!, gameBoardId: Int!): Cell,
  incrementCounter(increaseBy: Int!):Counter,
  joinGame( browserId: String, playerId: String!, playerName: String):Int
}

type Subscription {
  gameUpdated(gameBoardId: Int!): Game,
  newGameCreated: Game,
}`;

export default makeExecutableSchema({
  typeDefs: schema,
  resolvers,
});
