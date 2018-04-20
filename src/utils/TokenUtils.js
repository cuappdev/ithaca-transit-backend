// @flow
import https from 'https';
import axios from 'axios';
import qs from 'qs';
import fs from 'fs';

function getCredentials() {
	return JSON.parse(fs.readFileSync('config.json', 'utf8'));
};

function isAccessTokenExpired(credentials) {
	if (!("expiry_date" in credentials)) { // we have yet to generate an access token
		return true;
	}
	let currentDate = new Date();
	let expiryDate = new Date(credentials.expiry_date);
	return expiryDate.getTime() - 500 < currentDate.getTime(); // 0.5 second expiration buffer
}

async function generateAccessToken() {
	let credentials = getCredentials();
	try {
		const basicAuthHeader = 'Basic ' + credentials.basic_token;
		const agent = new https.Agent({  
		  rejectUnauthorized: false
		});
		let tokenRequest = await axios.post('https://gateway.api.cloud.wso2.com:443/token', qs.stringify({"grant_type": "client_credentials"}), {
			httpsAgent: agent, 
			headers: {Authorization: basicAuthHeader}
		});
		let currentDate = new Date();
		let newCredentials = {basic_token: credentials.basic_token, 
							  access_token: tokenRequest.data.access_token,
							  expiry_date: new Date(currentDate.getTime() + tokenRequest.data.expires_in*1000)};
		fs.writeFile('config.json', JSON.stringify(newCredentials), 'utf8', function(err) {
			if (err)
				console.log(err);
		});
		return newCredentials.access_token;
	} catch (err) {
		return err;
	}
}

async function getAuthorizationHeader() {
	let credentials = getCredentials();
	let accessToken;
	if (isAccessTokenExpired(credentials)) {
		accessToken = await generateAccessToken();
	} else {
		accessToken = credentials.access_token;
	}
	return 'Bearer ' + accessToken;
}

export default {
    getAuthorizationHeader: getAuthorizationHeader
}