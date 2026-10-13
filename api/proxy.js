const axios = require('axios');
const crypto = require('crypto');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-MBX-APIKEY, X-MBX-SECRETKEY, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { endpoint, method = 'GET', query = {}, body = {}, apiKey, secretKey } = req.method === 'GET' ? req.query : req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Falta el parámetro endpoint' });
    }

    const BINANCE_BASE_URL = 'https://api.binance.com';
    const queryParams = new URLSearchParams(query);
    const timestamp = Date.now();
    queryParams.set('timestamp', timestamp);

    let queryString = queryParams.toString();
    let finalUrl = `${BINANCE_BASE_URL}/${endpoint}`;

    if (secretKey) {
      const signature = crypto
        .createHmac('sha256', secretKey)
        .update(queryString)
        .digest('hex');
      queryString += `&signature=${signature}`;
    }

    if (queryString) {
      finalUrl += `?${queryString}`;
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
    };

    if (apiKey) {
      headers['X-MBX-APIKEY'] = apiKey;
    }

    const binanceResponse = await axios({
      method: method,
      url: finalUrl,
      headers: headers,
      data: method !== 'GET' ? body : undefined,
    });

    return res.status(binanceResponse.status).json(binanceResponse.data);

  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ error: error.message });
  }
}
