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
  name: String
  }

type Cell{
  id: Int!,
  value: String 
}

type Game {
  id: Int!,
  players: [Player],
  cells: [Cell],
  status: String
}  



# the schema allows the following query:
type Query {
  specificGameBoard(gameBoardId: Int!): Game,
  firstAvailableGameBoard: Game,
  currentCounterResult:Counter
}

# this schema allows the following mutation:
type Mutation {
  registerPlayer(playerId: String!, gameBoardId: Int!): Player,
  selectCell(playerValue: String!, cellId: Int!, gameBoardId: Int!): Cell,
  createNewGame:Int,
  incrementCounter(increaseBy: Int!):Counter
}

type Subscription {
  gameUpdated: Game,
  cellSelected: Game,
  newGameCreated: Game,
  counterChanged:Counter
}
`;

export default makeExecutableSchema({
  typeDefs: schema,
  resolvers,
});
