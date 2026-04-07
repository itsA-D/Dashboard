const axios = require('axios');

const baseURL = 'http://localhost:8000/api/v1';
const url = '/auth/login/';

// Mock axios behavior
function combineURLs(baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
}

console.log('Combined:', combineURLs(baseURL, url));

// Real axios experiment (if installed)
try {
    const client = axios.create({ baseURL });
    console.log('Axios config:', client.defaults.baseURL);
} catch (e) {
    console.log('Axios not available');
}
