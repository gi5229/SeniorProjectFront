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
      // Sign up
      const options = await makeAuthenticatedRequest('create-user', 'GET', { 
        username: profile.nickname ,
        password: refreshToken,
      });

      try {
        const result = await axios(options);
        // Check http status code
        if (!result.status === 201) {
          console.error('Failed to create user in Truenas:', result.status);
        } else {
          // User created successfully, set custom profile property nasUid
          profile.nasUid = result.data;
        }
      } catch (error) {
        // Delete user from Auth0 and display error message
        const deleteUserOptions = {
          method: 'DELETE',
          url: `https://${auth0Domain}/api/v2/users/${profile.sub}`,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        };

        try {
          await axios(deleteUserOptions);
          console.error('Error creating user in Truenas, user deleted from Auth0:', error);
        } catch (deleteError) {
          console.error('Failed to delete user from Auth0:', deleteError);
        }

        await logout();
        throw new Error('Failed to create user, please try again');
      }
    } else {
      // Login
      const options = await makeAuthenticatedRequest('reset-password', 'GET', { 
        uid: profile.nasUid ,
        password: refreshToken,
      });

      try {
        const result = await axios(options);
      } catch (error) {
        await logout();
        throw new Error('Failed to sign in user, please try again');
      }
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



async function makeAuthenticatedRequest(endpoint, method = 'GET', data = null) {
  if (!accessToken) {
    await refreshTokens();
  }

  const options = {
    method: method,
    url: `https://127.0.0.1/api/private/${endpoint}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    if (method === 'GET') {
      options.params = data; // For GET requests, use query parameters
    } else {
      options.data = data; // For POST, PUT, etc., use request body
    }
  }

  return options;
}


async function changePassword(newPassword) {
  //Change password on auth0
  const options = {
    method: 'PATCH',
    url: `https://${auth0Domain}/api/v2/users/${profile.sub}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    data: {
      password: newPassword,
    },
  };

  try {
    const result = await axios(options);
    if (result.status !== 200) {
      // Todo: handle error
      console.error('Failed to change password in Auth0:', result.status);
    }
  } catch (error) {
    // Todo: Handle error
    console.error('Failed to change password in Auth0:', error);
  }
  

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