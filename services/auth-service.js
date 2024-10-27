const jwtDecode = require('jwt-decode');
console.log(typeof jwtDecode);

const axios = require('axios');
const url = require('url');
const envVariables = require('../env-variables');
const keytar = require('keytar');
const os = require('os');

const {apiIdentifier, auth0Domain, clientId} = envVariables;

const redirectUri = 'http://localhost/callback';

const keytarService = 'electron-openid-oauth';
const keytarAccount = os.userInfo().username;

let accessToken = null;
let profile = null;
let refreshToken = null;

function getAccessToken() {
  return accessToken;
}

function getProfile() {
  return profile;
}

function getRefreshToken() {
  return refreshToken;
}

function getAuthenticationURL() {
  return (
    "https://" +
    auth0Domain +
    "/authorize?" +
    "scope=openid profile offline_access&" +
    "response_type=code&" +
    "client_id=" +
    clientId +
    "&" +
    "redirect_uri=" +
    redirectUri
  );
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

    if (query.signup) {
      console.log('User has just signed up');
      // TODO: Create the user in the Truenas and set the refresh token as the user password
      //  Post request to truenas to create user with json: https://73.161.236.103/api/v2.0/user
      // const truenasUserOptions = {
      //   method: 'POST',
      //   url: 'https://73.161.236.103/api/v2.0/user',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   data: {
      //     username: profile.nickname,
      //     password: refreshToken,
      //     email: profile.email,
      //     full_name: profile.name,


      //     // TODO: Get the uid from the mysql database
      //     uid: profile.sub, // This is the user id from the auth
      //     username: profile.email,
      //     group: 0,
      //     group_create: false,
      //     home: "string",
      //     "home_mode": "string",
      //     "shell": "string",
      //     "full_name": "string",
      //     "email": "string",
      //     "password": "string",
      //     "password_disabled": true,
      //     "locked": true,
      //     "microsoft_account": true,
      //     "smb": true,
      //     "sudo": true,
      //     "sudo_nopasswd": true,
      //     "sudo_commands": [
      //       "string"
      //     ],
      //     "sshpubkey": "string",
      //     "groups": [
      //       null
      //     ],
      //     "attributes": {
      //       "additionalProp1": {}
      //     },
      //   }
      // };

      try {
        const truenasResponse = await axios(truenasUserOptions);
        console.log('User created in Truenas:', truenasResponse.data);
      } catch (truenasError) {
        console.error('Error creating user in Truenas:', truenasError);
      }

    } else {
      console.log('User has logged in');
      // TODO: Set the refresh token as the user password in the Truenas
    }
  } catch (error) {
    await logout();

    throw error;
  }
}

async function logout() {
  await keytar.deletePassword(keytarService, keytarAccount);
  accessToken = null;
  profile = null;
  refreshToken = null;
}

function getLogOutUrl() {
  return `https://${auth0Domain}/v2/logout`;
}

module.exports = {
  getAccessToken,
  getRefreshToken,
  getAuthenticationURL,
  getLogOutUrl,
  getProfile,
  loadTokens,
  logout,
  refreshTokens,
};