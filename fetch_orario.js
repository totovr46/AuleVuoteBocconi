const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const CACHE_FILE = path.join(__dirname, 'public', 'cache_orario.json');
async function fetchOrarioData() {
    try {
        const url = 'https://didattica.unibocconi.it/aule/lista_orario.php';
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        let orario = [];
        $('table tbody tr').each((i, row) => {
            const columns = $(row).find('td');
            if (columns.length === 8) {
                orario.push({
                    data: $(columns[0]).text().trim(),
                    dalle: $(columns[1]).text().trim(),
                    alle: $(columns[2]).text().trim(),
                    tipo: $(columns[3]).text().trim(),
                    codice: $(columns[4]).find('strong').text().trim(),
                    corso: $(columns[5]).html().replace(/<br>/g, ' - ').trim(),
                    docente: $(columns[6]).text().trim(),
                    aula: $(columns[7]).text().trim()
                });
            }
        });
        const cacheData = {
            timestamp: Date.now(),
            data: orario
        };
        fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData));
        console.log('Cache aggiornata con successo:', new Date().toLocaleString());
    } catch (error) {
        console.error('Errore nel recupero dei dati:', error);
        process.exit(1);
    }
}
fetchOrarioData();
