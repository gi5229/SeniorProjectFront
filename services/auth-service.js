const jwtDecode = require('jwt-decode');
const axios = require('axios');
const url = require('url');
const envVariables = require('../env-variables');
const { BrowserWindow } = require('electron');
const keytar = require('keytar');
const os = require('os');
const { exec } = require('child_process'); 


const {apiIdentifier, auth0Domain, clientId} = envVariables;

const redirectUri = 'http://localhost/callback';

const keytarService = 'electron-openid-oauth';
const keytarAccount = os.userInfo().username;

// TODO: Remove special console log later
var nodeConsole = require('console');
var myConsole = new nodeConsole.Console(process.stdout, process.stderr);




let accessToken = null;
let profile = null;
let refreshToken = null;
let uid = null;
let drive = null;


function getAccessToken() {
  return accessToken;
}

function getRefreshToken() {
  return refreshToken;
}

function getProfile() {
  return profile;
}

function getUid() {
  return uid;
}

function getDrive() {
  return drive;
}

function getAuthenticationURL() {
  return 'https://' + auth0Domain + '/authorize?' +
    'audience=' + apiIdentifier + '&' +
    'scope=openid profile offline_access&' +
    'response_type=code&' +
    'client_id=' + clientId + '&' +
    'redirect_uri=' + redirectUri;
}

async function refreshTokens() {
  const refreshToken = await keytar.getPassword(keytarService, keytarAccount);

  if (refreshToken) {
    const refreshOptions = {
      method: 'POST',
      url: `https://${auth0Domain}/oauth/token`,
      headers: {'content-type': 'application/json'},
      data: {
        grant_type: 'refresh_token',
        client_id: clientId,
        refresh_token: refreshToken,
      }
    };

    try {
      const response = await axios(refreshOptions);

      accessToken = response.data.access_token;
      profile = jwtDecode(response.data.id_token);
    } catch (error) {
      await logout();

      throw error;
    }
  } else {
    throw new Error("No available refresh token.");
  }
}

async function loadTokens(callbackURL) {
  const urlParts = url.parse(callbackURL, true);
  const query = urlParts.query;

  const exchangeOptions = {
    'grant_type': 'authorization_code',
    'client_id': clientId,
    'code': query.code,
    'redirect_uri': redirectUri,
  };

  const options = {
    method: 'POST',
    url: `https://${auth0Domain}/oauth/token`,
    headers: {
      'content-type': 'application/json'
    },
    data: JSON.stringify(exchangeOptions),
  };

  try {
    const response = await axios(options);

    accessToken = response.data.access_token;
    profile = jwtDecode(response.data.id_token);
    refreshToken = response.data.refresh_token;
    

    if (refreshToken) {
      await keytar.setPassword(keytarService, keytarAccount, refreshToken);
    }
  } catch (error) {
    await logout();

    throw error;
  }

  if(profile.uid === 0) {
    try {
      myConsole.log(profile.user_id);
      const data = await axios.post('http://localhost:3000/create-user', {
        nickname: profile.nickname,
        refreshToken: `${getRefreshToken()}`,
        authUserId: profile.user_id,
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (data.status == 200) {
        uid = data.data.uid;
        drive = profile.nickname;
      } else {
        myConsole.log(data);
        await createLogoutWindow();
        //throw new Error('Failed to create user in cloud storage. Please close and reopen the app, and try signing in. If this persists, please contact support at jacobreich404@gmail.com');
      }
    } catch (error) { // TODO: This is currently catching the 500 status code error, This needs to be handled here. The 200 if statement is currently only hit if the user is created successfully so it can be dropped and all errors handled here.
      myConsole.log(error);
      myConsole.log(error.status);
      await createLogoutWindow();
      //throw error;
    }
  } else {
    //TODO: Reset the users truenas password with the refresh token
    try {
      const data = await axios.put('http://localhost:3000/set-password', {
        uid: profile.uid,
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (data.status != 200) {
        myConsole.log(data);
        await createLogoutWindow();
        //throw new Error('Failed to create user in cloud storage. Please close and reopen the app, and try signing in. If this persists, please contact support at jacobreich404@gmail.com');
      } 
    } catch (error) { // TODO: This is currently catching the 500 status code error, This needs to be handled here. The 200 if statement is currently only hit if the user is created successfully so it can be dropped and all errors handled here.
      myConsole.log(error);
      myConsole.log(error.status);
      await createLogoutWindow();
      //throw error;

    }
  }

  /*
  if(!profile.limited) {
    try {
      const data = await axios.post('http://localhost:3000/set-user-size', {
        uid: profile.uid,
        password: refreshToken,
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    } catch (error) { // TODO: This is currently catching the 500 status code error, This needs to be handled here. The 200 if statement is currently only hit if the user is created successfully so it can be dropped and all errors handled here.
      myConsole.log(error);
      myConsole.log(error.status);
      await createLogoutWindow();
      //throw error;

    }
  }
    */
}


async function createDrive(driveName) {
  myConsole.log("Drive object name: " + driveName);
  try {
    const data = await axios.post('http://localhost:3000/create-drive', {
      drive: profile.drive,
      dataSetName: driveName,
      authUserId: profile.user_id,
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (data.status != 200) {
      //myConsole.log(data);
      
      //throw new Error('Failed to create user in cloud storage. Please close and reopen the app, and try signing in. If this persists, please contact support at
    }
    refreshTokens();
  }
  catch (error) {
    //myConsole.log(error);
    //myConsole.log(error.status);
    
    //throw error;
  }
}

async function mountDrive(driveLetter, dataset) {
  
  myConsole.log(`Mounting drive: ${driveLetter} for dataset: ${dataset}`);
    const command = `net use ${driveLetter}: \\\\10.0.0.246\\jnpj\\${dataset} /user:${profile.drive} ${refreshToken} /persistent:no`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        myConsole.error(`Error mounting drive: ${error.message}`);
          return;
      }
      if (stderr) {
        myConsole.error(`Error: ${stderr}`);
          return;
      }
      myConsole.log(`Drive mounted successfully: ${stdout}`);
    }
  );

}



async function logout() {
  await keytar.deletePassword(keytarService, keytarAccount);
  accessToken = null;
  profile = null;
  refreshToken = null;

  // Close all windows
  BrowserWindow.getAllWindows().forEach(window => window.close());

  // Create the logout window
  //createLogoutWindow();
}

// TODO: Add a popup to let the user know about the error and do not let them interact with the app, close the app after the popup is closed/confirmed
function createLogoutWindow() {
  const logoutWindow = new BrowserWindow({
    show: false,
  });

  logoutWindow.loadURL(getLogOutUrl());

  logoutWindow.on('ready-to-show', async () => {
    await logout();
    logoutWindow.close();
  });
}

function getLogOutUrl() {
  return `https://${auth0Domain}/v2/logout`;
}

module.exports = {
  getAccessToken,
  getAuthenticationURL,
  getLogOutUrl,
  getProfile,
  loadTokens,
  logout,
  refreshTokens,
  getRefreshToken,
  getUid,
  getDrive,
  createDrive,
  mountDrive,
};
