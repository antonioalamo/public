// Configuration properties (this can be loaded dynamically)
const config = {
    "SANTIAGOX": {
        "ApiBaseUrl": "https://www.bolsadesantiago.com",
        "ApiPriceSummary": "/api/RV_Instrumentos/getResumenPrecios",
        "ApiLastTransactions": "/api/RV_Instrumentos/getUltimasTransacciones",
        "STOCKS": ["SOQUICOM", "PLANVITAL", "ILC", "SQM-B"]
    },
    "HEADERS": {
        "Referer": "https://www.bolsadesantiago.com/resumen_instrumento/",
        "Host": "www.bolsadesantiago.com",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Content-Type": "application/json;charset=utf-8",
        "X-CSRF-Token": "aKOIbzTG-30kbiF_crbrNIp9LukoxADunj0I"
    },
    "APP": {
        "WaitingSeconds": 120
    }
};

const dataContainer = document.getElementById('data-container');

async function fetchData(stock) {
    const url = `${config.SANTIAGOX.ApiBaseUrl}${config.SANTIAGOX.ApiPriceSummary}`;
    const headers = new Headers(config.HEADERS);
    headers.set('Referer', `${config.HEADERS.Referer}${stock}`);
    
    const payload = JSON.stringify({ nemo: stock });
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: payload
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.listaResult.filter(item => item.tipo_dato === 'puntas');
        } else {
            console.error(`Error fetching data for ${stock}:`, response.statusText);
        }
    } catch (error) {
        console.error(`Error fetching data for ${stock}:`, error);
    }
    return [];
}

async function fetchTransactions(stock) {
    const url = `${config.SANTIAGOX.ApiBaseUrl}${config.SANTIAGOX.ApiLastTransactions}`;
    const headers = new Headers(config.HEADERS);
    headers.set('Referer', `${config.HEADERS.Referer}${stock}`);
    
    const payload = JSON.stringify({ nemo: stock });
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: payload
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.listaResult.map(transaction => ({
                price: transaction.PRECIO,
                qty: transaction.CANTIDAD,
                time: transaction.HORA.replace(/\b\d{1,2}\/06\/2024 \b/, '')
            }));
        } else {
            console.error(`Error fetching transactions for ${stock}:`, response.statusText);
        }
    } catch (error) {
        console.error(`Error fetching transactions for ${stock}:`, error);
    }
    return [];
}

async function processStock(stock) {
    const stockData = await fetchData(stock);
    const transactions = await fetchTransactions(stock);

    displayData(stock, stockData, transactions);
}

function displayData(stock, stockData, transactions) {
    const stockDiv = document.createElement('div');
    stockDiv.className = 'stock-data';

    const stockTitle = document.createElement('h3');
    stockTitle.textContent = `Stock: ${stock}`;
    stockDiv.appendChild(stockTitle);

    const stockDetails = document.createElement('pre');
    stockDetails.textContent = JSON.stringify(stockData, null, 2);
    stockDiv.appendChild(stockDetails);

    const transactionsTitle = document.createElement('h4');
    transactionsTitle.textContent = `Transactions:`;
    stockDiv.appendChild(transactionsTitle);

    const transactionsDetails = document.createElement('pre');
    transactionsDetails.textContent = JSON.stringify(transactions, null, 2);
    stockDiv.appendChild(transactionsDetails);

    dataContainer.appendChild(stockDiv);
}

function clearData() {
    dataContainer.innerHTML = '';
}

async function main() {
    clearData();
    const stocks = config.SANTIAGOX.STOCKS;

    for (const stock of stocks) {
        await processStock(stock);
    }

    setTimeout(main, config.APP.WaitingSeconds * 1000);
}

main();
