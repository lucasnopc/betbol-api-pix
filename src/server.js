if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express');
const bodyParser = require('body-parser');
const GNRequest = require('./apis/gerencianet');
const fs = require('fs');

const app = express();

app.set('port', 3000);
app.use(bodyParser.json());
app.use(express.static('static'));

const reqGNAlready = GNRequest({
  clientID: process.env.GN_CLIENT_ID,
  clientSecret: process.env.GN_CLIENT_SECRET
});

app.get('/', async (req, res) => {
  const value = req.query.value
  if(typeof value == 'undefined') {
    res.status(301).json({err: "insira umma query value: {99.00}"})
  }
  console.log(value)
  const reqGN = await reqGNAlready;
  const dataCob = {
    calendario: {
      expiracao: 3600
    },
    valor: {
      original: value
    },
    chave: 'f54efa19-a7cb-427c-8e3c-63504f506ed3',
    solicitacaoPagador: 'Transfira um pix para sua conta betbol.'
  };
  
  const cobResponse = await reqGN.post('/v2/cob', dataCob);
  const qrcodeResponse = await reqGN.get(`/v2/loc/${cobResponse.data.loc.id}/qrcode`);

  res.send({ qrcodeImage: qrcodeResponse.data.imagemQrcode })
});

app.get('/cobrancas', async(req, res) => {
  const reqGN = await reqGNAlready;

  const cobResponse = await reqGN.get('/v2/cob?inicio=2021-02-15T16:01:35Z&fim=2021-02-22T23:59:00Z');

  res.send(cobResponse.data);
});

app.post('/webhook(/pix)?', (req, res) => {
  console.log(req.body);
  res.send('200');
});

app.listen(app.get('port'), function() {
  if (process.env.DYNO) {
    console.log('This is on Heroku..!!');
    fs.openSync('/tmp/app-initialized', 'w');
  }
  console.log('Node app is running on port', app.get('port'));
});