const express = require('express');
const cors = require('cors');
const { carregarCboOcupacoes } = require('./cboOcupacoes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/ocupacoes', async (req, res) => {
  const dados = await carregarCboOcupacoes();
  res.json(dados);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`API em http://localhost:${PORT}/api/ocupacoes`);
});
