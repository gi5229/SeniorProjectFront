const axios = require('axios');
const authService = require('./auth-service');

async function getPrivateData() {
    const result = await axios.get('http://localhost:3000/private', {
        headers: {
            'Authorization': `Bearer ${authService.getAccessToken()}`,
        },
    });
    console.log(`Status Code: ${result.status}`);
    return result.data;
}

//drive info for usage (backend repo - index.js - line 381)
async function getDriveInfo(drive) {
    try {
        const result = await axios.get(`http://localhost:3000/get-drive-info`, {
            drive: drive,
        }, { 
            headers: {
                'Authorization': `Bearer ${authService.getAccessToken()}`
            }
        });
        return result.data;
    } catch (error) {
        console.error('Error getting drive info:', error);
        throw error;
    }
}

// added the drive info export.
module.exports = {
    getPrivateData,
    getDriveInfo
};