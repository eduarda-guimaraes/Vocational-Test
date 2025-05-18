// backend/profissoes.js
const axios = require('axios');

async function obterProfissoes() {
  try {
    const url = 'https://raw.githubusercontent.com/wallacemaxters/7863699e750a48fc2e283892738f8ca5/raw/lista_cargos.json';
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar lista de profissões:', error.message);
    return [];
  }
}

module.exports = { obterProfissoes };