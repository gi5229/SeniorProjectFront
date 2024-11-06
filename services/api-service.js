const axios = require('axios');
const authService = require('./auth-service');

async function getPrivateData() {
  const result = await axios.get('http://localhost:3000/private', {
    headers: {
      'Authorization': `Bearer ${authService.getAccessToken()}`,
    },
  });
  // Example of how to log the status code of the response
  console.log(`Status Code: ${result.status}`);
  return result.data;
}

module.exports = {
  getPrivateData,
}
