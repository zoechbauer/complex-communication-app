const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Welcome to our new app');
});

app.listen(3000);
