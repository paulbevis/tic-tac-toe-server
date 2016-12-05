import resolveFunctions, {games} from './resolvers';
import {pubsub} from './subscriptions';
import * as data from './data';

// const pubsub = jest.mock('./subscriptions')

describe('When joining a game', () => {
  const context = {};
  const browserId1 = 'browser1';
  const playerId1 = 'playerId1';
  const playerName1 = 'Janet';
  const browserId2 = 'browser2';
  const playerId2 = 'playerId2';
  const playerName2 = 'John';
  const player1 = {browserId: browserId1, playerId: playerId1, playerName: playerName1};
  const player2 = {browserId: browserId2, playerId: playerId2, playerName: playerName2};

  beforeEach(() => {
    games.length = 0;
    var myMockPublish = jest.fn();
    pubsub.publish = myMockPublish;
  });
  afterEach(() => {
    jest.resetAllMocks()
  });

  it('is the first player to join', () => {
    let obj = {browserId: browserId1, playerId: playerId1, playerName: playerName1};
    const gameId = resolveFunctions.Mutation.joinGame(null, obj, context);
    expect(gameId).toBe(0);
    expect(pubsub.publish.mock.calls.length).toBe(1);

  });

  it('is the second (different) player to join', () => {
    let gameId = resolveFunctions.Mutation.joinGame(null, {browserId: browserId1, playerId: playerId1, playerName: playerName1});
    expect(gameId).toBe(0);
    gameId = resolveFunctions.Mutation.joinGame(null, {browserId: browserId2, playerId: playerId2, playerName: playerName2});
    expect(gameId).toBe(0);
    expect(pubsub.publish.mock.calls.length).toBe(2);
  });

  it('is the same player trying to join even though they are already waiting', () => {
    let gameId = resolveFunctions.Mutation.joinGame(null, player1);
    expect(gameId).toBe(0);
    gameId = resolveFunctions.Mutation.joinGame(null, player1);
    expect(gameId).toBe(0);
    expect(games[0].players.length).toBe(1);
    expect(games[0].players[0]).toEqual({id: playerId1, name: playerName1, browserId: browserId1, value: 'X'});
    expect(games[0].status).toEqual(data.WAITING);
    expect(pubsub.publish.mock.calls.length).toBe(1);
  });

  it('is the same player trying to join game, whilst currently playing', () => {
    let gameId = resolveFunctions.Mutation.joinGame(null, player1);
    expect(gameId).toBe(0);
    gameId = resolveFunctions.Mutation.joinGame(null, player2);
    expect(gameId).toBe(0);
    expect(games[0].players.length).toEqual(2);
    expect(games[0].status).toEqual(data.PLAYING);
    gameId = resolveFunctions.Mutation.joinGame(null, player1);
    expect(gameId).toBe(1);
    expect(games[0].players.length).toEqual(2);
    expect(games[0].status).toEqual(data.GAME_ABANDONED);
  });

  it('two players join, then both try and join another game', () => {
    //player 1 joins
    let gameId = resolveFunctions.Mutation.joinGame(null, player1);
    expect(gameId).toBe(0);
    expect(pubsub.publish.mock.calls.length).toBe(1);
    pubsub.publish.mockClear();

    //player 2 joins
    gameId = resolveFunctions.Mutation.joinGame(null, player2);
    expect(gameId).toBe(0);
    expect(games[0].players.length).toEqual(2);
    expect(games[0].status).toEqual(data.PLAYING);
    expect(pubsub.publish.mock.calls.length).toBe(1);
    pubsub.publish.mockClear();

    //player 1 tries to join another game
    gameId = resolveFunctions.Mutation.joinGame(null, player1);
    expect(games[0].status).toEqual(data.GAME_ABANDONED);
    expect(games[1].status).toEqual(data.WAITING);
    expect(gameId).toBe(1);
    expect(pubsub.publish.mock.calls.length).toBe(1);
    pubsub.publish.mockClear();

    gameId = resolveFunctions.Mutation.joinGame(null, player2);
    expect(gameId).toBe(1);
    expect(games[1].status).toEqual(data.PLAYING);
    expect(pubsub.publish.mock.calls.length).toBe(1);
  });


});
