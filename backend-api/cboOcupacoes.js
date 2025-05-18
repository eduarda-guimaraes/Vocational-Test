const fs = require('fs');
const iconv = require('iconv-lite');
const xml2js = require('xml2js');
const path = require('path');

async function carregarCboOcupacoes() {
  const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
  const xmlPath = path.join(__dirname, 'CBO2002 - Ocupacao.xml');

  try {
    // Tenta com utf-8
    let xmlBuffer = fs.readFileSync(xmlPath);
    let xmlData = iconv.decode(xmlBuffer, 'utf8');

    // Verifica se tem erro visível (caracter corrompido)
    if (xmlData.includes('ï¿½')) {
      // Tenta com latin1 se ainda estiver corrompido
      console.warn('⚠️ Detected encoding issue. Trying with latin1...');
      xmlData = iconv.decode(xmlBuffer, 'latin1');
    }

    const result = await parser.parseStringPromise(xmlData);
    const linhas = result['office:document']['office:body']['office:spreadsheet']['table:table']['table:table-row'];

    const ocupacoes = linhas
      .map(row => {
        let cell = row['table:table-cell'];
        if (Array.isArray(cell)) cell = cell[0];
        if (!cell || !cell['text:p']) return null;

        let conteudo = cell['text:p'];
        if (Array.isArray(conteudo)) conteudo = conteudo[0];
        if (typeof conteudo !== 'string' || !conteudo.includes(';')) return null;

        const [codigo, nome] = conteudo.split(';');
        return { codigo: codigo.trim(), nome: nome.trim() };
      })
      .filter(Boolean);

    return ocupacoes;
  } catch (err) {
    console.error('Erro ao carregar o XML:', err.message);
    return [];
  }
}

module.exports = { carregarCboOcupacoes };
