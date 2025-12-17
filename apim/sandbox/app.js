const express = require('express');
const morgan = require('morgan');

const app = express();
const PORT = 9000;

app.use(morgan('combined'));
app.use(express.json());

const handlers = require('./handlers');

app.get('/_ping', handlers.status);
app.get('/_status', handlers.status);
app.post('/results', handlers.results);

const server = app.listen(PORT, () => {
  console.log(
    JSON.stringify({
      timestamp: Date.now(),
      server_port: server.address().port
    })
  );
});
