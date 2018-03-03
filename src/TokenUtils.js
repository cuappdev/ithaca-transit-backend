// @flow
import fs from 'fs';
import https from 'https';
import axios from 'axios';
import qs from 'qs';
import credentials from '../config.json';

function isAccessTokenExpired() {
	let currentDate = new Date();
	let expiryDate = new Date(credentials.expiry_date);
	return expiryDate.getTime() - 500 < currentDate.getTime(); // 0.5 second expiration buffer
}

async function generateAccessToken() {
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
			if (err) {
				return err;
			} else {
				return newCredentials.access_token;
			}
		});
	} catch (err) {
		return err;
	}
}

async function getAuthorizationHeader() {
	let accessToken;
	if (isAccessTokenExpired()) {
		accessToken = await generateAccessToken();
	} else {
		accessToken = credentials.access_token;
	}
	return 'Bearer ' + accessToken;
}

export default {
    getAuthorizationHeader: getAuthorizationHeader
}