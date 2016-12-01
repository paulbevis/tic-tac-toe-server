import {makeExecutableSchema} from 'graphql-tools';

import resolvers from './resolvers';

const schema = `
type Counter {
  value: Int
}

type Player {
  id: String!,
  status: String,
  value: String,
  name: String,
  browserId: String
}

type Cell{
  id: Int!,
  value: String,
  partOfWinLine: Boolean
}

type Game {
  id: Int!,
  players: [Player],
  cells: [Cell],
  status: String,
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
  createNewGame:Int,
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
