import express from 'express';
import {graphqlExpress, graphiqlExpress} from 'graphql-server-express';
import bodyParser from 'body-parser';
import cors from 'cors';
import {createServer} from 'http';
import {SubscriptionServer} from 'subscriptions-transport-ws';
import {printSchema} from 'graphql/utilities/schemaPrinter';

import {subscriptionManager} from './js/subscriptions';
import schema from './js/schema';
import OpticsAgent from 'optics-agent';

const GRAPHQL_PORT = 8181;
const WS_PORT = 8090;


OpticsAgent.instrumentSchema(schema);


const graphQLServer = express().use('*', cors());


graphQLServer.use('/graphql', OpticsAgent.middleware());

graphQLServer.use('/graphql', bodyParser.json(), graphqlExpress(request => ({
  schema,
  context: {opticsContext: OpticsAgent.context(request)},
})));


graphQLServer.use('/graphiql', graphiqlExpress({
  endpointURL: '/graphql',
}));

graphQLServer.use('/schema', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(printSchema(schema));
});

graphQLServer.listen(GRAPHQL_PORT, () => console.log(
  `GraphQL Server is now running on http://localhost:${GRAPHQL_PORT}/graphql`
));

// WebSocket server for subscriptions
const websocketServer = createServer((request, response) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Request-Method', '*');
  res.setHeader('Access-Control-Allow-Headers', req.header.origin);
  response.writeHead(404);
  response.end();
});

websocketServer.listen(WS_PORT, () => console.log( // eslint-disable-line no-console
  `Websocket Server is now running on http://localhost:${WS_PORT}`
));

// eslint-disable-next-line
new SubscriptionServer(
  {
    subscriptionManager,
  },
  websocketServer
);
