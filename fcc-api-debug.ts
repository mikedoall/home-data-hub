/**
 * FCC API Debug Helper
 * 
 * This module provides functions to debug FCC API responses and authentication issues
 */

import fetch from 'node-fetch';

/**
 * Try both Open Data API and traditional FCC API with various authentication methods
 * Returns comprehensive debug information
 */
export async function testFccApis(latitude: number, longitude: number) {
  const results: any = {
    openDataApi: {
      status: 'not_attempted',
      datasets: {}
    },
    traditionalApi: {
      status: 'not_attempted',
      endpoints: {}
    },
    credentials: {
      username: process.env.FCC_USERNAME ? 'configured' : 'missing',
      token: process.env.FCC_TOKEN ? 'configured' : 'missing',
      apiKey: process.env.FCC_BROADBAND_API_KEY ? 'configured' : 'missing'
    }
  };

  // First try the Open Data API with various datasets
  const datasets = [
    { id: 'jdr4-3q4p', name: 'Fixed Broadband Deployment Data: June 2021 Status V1' },
    { id: 'yd9y-6jqe', name: 'Provider Table June 2021 Status V1' },
    { id: 'xvwq-qtaj', name: 'Area Table June 2021 Status V1' }
  ];

  // Try each dataset
  for (const dataset of datasets) {
    results.openDataApi.datasets[dataset.id] = await testOpenDataApi(latitude, longitude, dataset.id);
  }

  // Now try the traditional FCC API with various endpoints and auth methods
  const endpoints = [
    'https://broadbandmap.fcc.gov/nbm/map/api/published/fixed/location',
    'https://broadbandmap.fcc.gov/nbm/api/national-broadband-map/data/availability/fixed',
    'https://broadbandmap.fcc.gov/api/fixed/location',
    'https://broadbandmap.fcc.gov/api/national-broadband-map/data/availability/fixed'
  ];

  for (const endpoint of endpoints) {
    const url = `${endpoint}?latitude=${latitude}&longitude=${longitude}`;
    results.traditionalApi.endpoints[endpoint] = await testTraditionalApiWithAuthMethods(url);
  }

  return results;
}

/**
 * Test Open Data API with a specific dataset ID
 */
async function testOpenDataApi(latitude: number, longitude: number, datasetId: string) {
  const result = {
    appTokenHeader: { status: 'not_attempted' },
    appTokenQuery: { status: 'not_attempted' },
    noAuth: { status: 'not_attempted' }
  };

  // Calculate a small bounding box around the coordinates (approximately 1km)
  const lat = parseFloat(latitude.toString());
  const lng = parseFloat(longitude.toString());
  const latRadius = 0.01; // roughly 1km in latitude
  const lngRadius = 0.01; // roughly 1km in longitude 

  // Build the query to find broadband availability within this bounding box
  const whereClause = encodeURIComponent(
    `latitude >= ${lat - latRadius} AND latitude <= ${lat + latRadius} AND longitude >= ${lng - lngRadius} AND longitude <= ${lng + lngRadius}`
  );

  // Base URL for the dataset
  const baseUrl = `https://opendata.fcc.gov/resource/${datasetId}.json?$where=${whereClause}&$limit=10`;
  
  // Get the app token
  const appToken = process.env.FCC_BROADBAND_API_KEY;

  // Method 1: Try with X-App-Token header
  try {
    if (appToken) {
      const response = await fetch(baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-App-Token': appToken
        }
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('json') 
        ? await response.json()
        : await response.text();

      result.appTokenHeader = {
        status: response.status,
        statusText: response.statusText,
        contentType,
        isJson: contentType.includes('json'),
        data: typeof data === 'string' ? (data.length > 200 ? data.substring(0, 200) + '...' : data) : data,
        url: baseUrl
      };
    }
  } catch (error) {
    result.appTokenHeader = {
      status: 'error',
      error: String(error),
      url: baseUrl
    };
  }

  // Method 2: Try with $$app_token query parameter
  try {
    if (appToken) {
      const url = `${baseUrl}&$$app_token=${appToken}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('json') 
        ? await response.json()
        : await response.text();

      result.appTokenQuery = {
        status: response.status,
        statusText: response.statusText,
        contentType,
        isJson: contentType.includes('json'),
        data: typeof data === 'string' ? (data.length > 200 ? data.substring(0, 200) + '...' : data) : data,
        url
      };
    }
  } catch (error) {
    result.appTokenQuery = {
      status: 'error',
      error: String(error),
      url: `${baseUrl}&$$app_token=[REDACTED]`
    };
  }

  // Method 3: Try with no authentication (some datasets allow anonymous access)
  try {
    const response = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('json') 
      ? await response.json()
      : await response.text();

    result.noAuth = {
      status: response.status,
      statusText: response.statusText,
      contentType,
      isJson: contentType.includes('json'),
      data: typeof data === 'string' ? (data.length > 200 ? data.substring(0, 200) + '...' : data) : data,
      url: baseUrl
    };
  } catch (error) {
    result.noAuth = {
      status: 'error',
      error: String(error),
      url: baseUrl
    };
  }

  return result;
}

/**
 * Test traditional FCC API with various authentication methods
 */
async function testTraditionalApiWithAuthMethods(url: string) {
  const result = {
    standardAuth: { status: 'not_attempted' },
    headerVariations: {}
  };

  // Get credentials
  const username = process.env.FCC_USERNAME;
  const token = process.env.FCC_TOKEN;

  if (!username || !token) {
    return {
      status: 'skipped',
      message: 'Missing FCC_USERNAME or FCC_TOKEN'
    };
  }

  // Standard authentication
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'username': username,
        'hash_value': token
      }
    });

    const contentType = response.headers.get('content-type') || '';
    const isHtml = contentType.includes('html');
    const data = await response.text();
    const firstChars = data.length > 200 ? data.substring(0, 200) + '...' : data;

    result.standardAuth = {
      status: response.status,
      statusText: response.statusText,
      contentType,
      isHtml,
      startOfResponse: firstChars,
      url
    };
  } catch (error) {
    result.standardAuth = {
      status: 'error',
      error: String(error),
      url
    };
  }

  // Try various header combinations
  const headerVariations = [
    { 'Username': username, 'Hash-Value': token },
    { 'username': username, 'hash-value': token },
    { 'user-name': username, 'hash-value': token },
    { 'Username': username, 'Token': token },
    { 'username': username, 'token': token },
    { 'user': username, 'token': token },
    { 'user': username, 'hash': token },
    { 'Authorization': `Basic ${Buffer.from(`${username}:${token}`).toString('base64')}` }
  ];

  for (let i = 0; i < headerVariations.length; i++) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headerVariations[i]
    };

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers
      });

      result.headerVariations[`variation_${i+1}`] = {
        status: response.status,
        statusText: response.statusText,
        headers: headerVariations[i]
      };
    } catch (error) {
      result.headerVariations[`variation_${i+1}`] = {
        status: 'error',
        error: String(error),
        headers: headerVariations[i]
      };
    }
  }

  return result;
}