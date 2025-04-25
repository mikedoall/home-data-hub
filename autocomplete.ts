import express from 'express';
import fetch from 'node-fetch';

// Create a router
const router = express.Router();

/**
 * Address autocomplete endpoint that queries OpenCage for address suggestions
 */
router.get('/autocomplete', async (req, res) => {
  const { q } = req.query;
  
  if (!q || typeof q !== 'string' || q.length < 3) {
    return res.status(400).json({
      success: false,
      error: 'Query parameter must be a string with at least 3 characters'
    });
  }
  
  const apiKey = process.env.OPENCAGE_API_KEY;
  
  if (!apiKey) {
    console.error('Missing OpenCage API key');
    return res.status(500).json({
      success: false,
      error: 'OpenCage geocoding service is not configured'
    });
  }
  
  try {
    // URL for OpenCage geocoding API
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(q)}&key=${apiKey}&limit=5&countrycode=us`;
    
    console.log(`Querying OpenCage API for suggestions: ${q}`);
    console.log(`Full OpenCage API URL: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log(`OpenCage API responded with status ${response.status}`);
      const errorText = await response.text();
      console.log(`Response text: ${errorText}`);
      throw new Error(`OpenCage API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`OpenCage API response received successfully`);
    
    // Format results for the autocomplete dropdown
    const results = (data as any).results.map((result: any) => ({
      formatted: result.formatted,
      components: result.components,
      geometry: result.geometry
    }));
    
    console.log(`Found ${results.length} suggestions for query: ${q}`);
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error fetching address suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch address suggestions'
    });
  }
});

export default router;