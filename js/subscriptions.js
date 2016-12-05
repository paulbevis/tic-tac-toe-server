import {PubSub, SubscriptionManager} from 'graphql-subscriptions';
import schema from './schema';

const pubsub = new PubSub();
const subscriptionManager = new SubscriptionManager({
  schema,
  pubsub,
  setupFunctions: {
    gameUpdated: (options, args) => {
      return {
        gameUpdated: {
          filter: game => {
            return game.id === args.gameBoardId
          }
        }
      }
    }
  }
});

export {subscriptionManager, pubsub};
