const config = {
    APP: {
        WaitingSeconds: 120
    },
    RSI: {
        enable: true,
        intervals: ['1h', '4h', '1d'],
        symbol: 'BTCUSDT'
    }
};

async function getCurrentPrice(symbol = 'BTCUSDT') {
    const baseUrl = 'https://api.binance.com/api/v3/ticker/price';
    const params = new URLSearchParams({ symbol });
    const response = await fetch(`${baseUrl}?${params}`);
    const data = await response.json();
    return parseFloat(data.price);
}

async function fetchData(symbol, interval) {
    const baseUrl = 'https://api.binance.com/api/v3/klines';
    const params = new URLSearchParams({
        symbol,
        interval,
        limit: 1000
    });

    try {
        const response = await fetch(`${baseUrl}?${params}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('Empty or invalid response data');
        }
        return data.map(item => ({
            timestamp: new Date(item[0]),
            close: parseFloat(item[4])
        }));
    } catch (error) {
        console.error('Error fetching data:', error);
        return []; // Return empty array to handle the error gracefully
    }
}


function calculateRSI(data, period = 14) {
    if (data.length < period + 1) {
        console.warn(`Not enough data points (${data.length}) to calculate RSI for period ${period}`);
        return null; // Return null or handle gracefully based on your application logic
    }

    let gains = 0, losses = 0;

    for (let i = 1; i <= period; i++) {
        const difference = data[i].close - data[i - 1].close;
        if (difference > 0) {
            gains += difference;
        } else {
            losses -= difference;
        }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
}


async function processInterval(symbol, interval, rsiPeriod = 14) {
    try {
        const data = await fetchData(symbol, interval);
        if (!data || data.length === 0) {
            console.warn(`No data fetched for ${symbol} - ${interval}`);
            return { rsi: null, interval };
        }

        const rsi = calculateRSI(data.slice(-rsiPeriod));
        if (rsi === null || isNaN(rsi)) {
            console.warn(`Unable to calculate RSI for ${symbol} - ${interval}`);
            return { rsi: null, interval };
        }

        const message = `Last RSI for ${symbol} on ${interval}: ${rsi.toFixed(2)}`;
        console.log(message);

        if (rsi < 30 || rsi > 70) {
            const alertMessage = `RSI Alert: ${message}`;
            console.log('%c' + alertMessage, 'color: red');
            // alert(alertMessage); // Optionally alert the user
        }

        return { rsi, interval };
    } catch (error) {
        console.error(`Error processing ${symbol} - ${interval}:`, error);
        return { rsi: null, interval }; // Return null RSI to indicate error
    }
}


async function processBTC() {
    const currentPrice = await getCurrentPrice('BTCUSDT');
    console.log(`Current BTC/USDT price: ${currentPrice}`);
    return currentPrice;
}

function displayData(data) {
    const container = document.getElementById('data-container');
    container.innerHTML = '';

    data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'highlighted';
        div.innerHTML = `<strong>${item.interval}</strong> RSI: ${item.rsi.toFixed(2)}`;
        container.appendChild(div);
    });
}

async function main() {
    const waitingSeconds = config.APP.WaitingSeconds * 1000;
    const intervals = config.RSI.intervals;
    const symbol = config.RSI.symbol;

    console.log('Here')

    while (true) {
        const data = [];

        for (const interval of intervals) {
            const result = await processInterval(symbol, interval);
            data.push(result);
        }

        await processBTC();

        displayData(data);

        console.log(`Waiting for ${config.APP.WaitingSeconds} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitingSeconds));
    }
}

main();
