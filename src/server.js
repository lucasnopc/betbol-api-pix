if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express');
const bodyParser = require('body-parser');
const GNRequest = require('./apis/gerencianet');
const fs = require('fs');
const axios = require('axios');

const app = express();

app.set('port', process.env.NODE_PORT);
app.use(bodyParser.json());
app.use(express.static('static'));

const reqGNAlready = GNRequest({
  clientID: process.env.GN_CLIENT_ID,
  clientSecret: process.env.GN_CLIENT_SECRET
})
app.get('/', async (req, res) => {
  const value = req.query.value
  const cpf = req.query.cpf
  const name = req.query.name
  const reqGN = await reqGNAlready

  if (typeof value == 'undefined') {
    res.status(301).json({ err: "insira umma query value: {99.00}" })
  }
  const dataCob = {
    calendario: {
      expiracao: 3600
    },
    valor: {
      original: value
    },
    chave: 'f54efa19-a7cb-427c-8e3c-63504f506ed3',
    solicitacaoPagador: 'Transfira um pix para sua conta betbol.'
  }
  if (cpf && name) {
    dataCob.devedor = {
      cpf: cpf,
      nome: name
    }
  }
  const funcqrcodeRespose = async (reqGN) => {
    try {
      const cobResponse = await reqGN.post('/v2/cob', dataCob)
      const qrcodeResponse = await reqGN.get(`/v2/loc/${cobResponse.data.loc.id}/qrcode`)
      res.send({ qrcodeImage: qrcodeResponse.data.imagemQrcode })
    } catch (error) {
      console.log('restart request ', error)
      const reqGNAlready = GNRequest({
        clientID: process.env.GN_CLIENT_ID,
        clientSecret: process.env.GN_CLIENT_SECRET
      })
      const reqGN2 = await reqGNAlready
      funcqrcodeRespose(reqGN2)
    }
  }
});

app.get('/cobrancas', async (req, res) => {
  const reqGN = await reqGNAlready;

  const cobResponse = await reqGN.get('/v2/cob?inicio=2022-03-06T05:01:35Z&fim=2022-03-22T23:59:00Z');

  res.send(cobResponse.data);
});

app.post('/webhook(/pix)?', (req, res) => {
  try {
    axios.post(process.env.WEBHOOK_SERVER, req.body);
    res.send('200');
  }catch (err) {
    console.log(err)
  }
});

app.listen(app.get('port'), function () {

  console.log('Node app is running on port', app.get('port'));
});