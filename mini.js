const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

app.post('/ussd', (req, res) => {
  console.log('[MINI USSD HIT]', req.body);
  res.set('Content-Type', 'text/plain');
  res.send('CON TEST OK\n1. Next\n2. Exit');
});

app.listen(3000, () => console.log('MINI server on 3000'));