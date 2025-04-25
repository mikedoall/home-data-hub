import React from 'react';

interface InteractiveMapProps {
  latitude: number;
  longitude: number;
  address: string;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ latitude, longitude, address }) => {
  // Create an embedded OpenStreetMap iframe with the marker
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01}%2C${latitude-0.01}%2C${longitude+0.01}%2C${latitude+0.01}&amp;layer=mapnik&amp;marker=${latitude}%2C${longitude}`;
  
  // Create a link to the FCC Broadband Map
  const viewMapUrl = `https://broadbandmap.fcc.gov/location-summary/fixed?version=jun2024&zoom=14&vlon=${longitude}&vlat=${latitude}`;
  
  return (
    <div className="map-wrapper" style={{ height: '500px', width: '100%' }}>
      <iframe 
        width="100%" 
        height="100%" 
        frameBorder="0" 
        scrolling="no" 
        marginHeight={0} 
        marginWidth={0} 
        src={mapUrl} 
        style={{ border: '1px solid #ccc' }}
        title={`Map showing ${address}`}
      />
      <div className="map-address" style={{ padding: '10px', backgroundColor: 'white', borderRadius: '4px', margin: '10px', position: 'absolute', bottom: 0, left: 0, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <strong>{address}</strong>
        <br />
        <a href={viewMapUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9em', color: '#FF5722', fontWeight: 'bold', textDecoration: 'underline' }}>
          View FCC Broadband Map →
        </a>
      </div>
    </div>
  );
};

export default InteractiveMap;