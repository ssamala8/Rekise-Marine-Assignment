import React, { useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer } from 'ol/layer';
import { OSM } from 'ol/source';
import { Draw } from 'ol/interaction';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { fromLonLat } from 'ol/proj';
import { getLength } from 'ol/sphere';
import { LineString } from 'ol/geom';
import './App.css';

function App() {
  const [map, setMap] = useState(null);
  const [coordinates, setCoordinates] = useState([]);
  const [segmentDistances, setSegmentDistances] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  React.useEffect(() => {
    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({ source: vectorSource });

    const mapInstance = new Map({
      target: 'map',
      layers: [
        new TileLayer({ source: new OSM() }),
        vectorLayer,
      ],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 2,
      }),
    });

    setMap(mapInstance);

    return () => mapInstance.setTarget(null);
  }, []);

  const calculateSegmentDistances = (coords) => {
    let distances = [];
    for (let i = 0; i < coords.length - 1; i++) {
      const start = coords[i];
      const end = coords[i + 1];

      // Calculate distance using `getLength` with WGS84 coordinates
      const segment = new LineString([start, end]);
      const length = getLength(segment, { projection: 'EPSG:4326' });
      distances.push((length / 1000).toFixed(2)); // Convert to kilometers
    }
    return distances;
  };

  const startDrawing = (type) => {
    if (!map) return;

    const source = map.getLayers().getArray()[1].getSource();

    const draw = new Draw({
      source,
      type,
    });

    draw.on('drawend', (event) => {
      const feature = event.feature;
      const geometry = feature.getGeometry();

      if (type === 'LineString') {
        const coords = geometry.getCoordinates();
        const distances = calculateSegmentDistances(coords);
        setCoordinates(coords);
        setSegmentDistances(distances);
      } else if (type === 'Polygon') {
        const rings = geometry.getCoordinates();
        const distances = rings.map((ring) => calculateSegmentDistances(ring));
        setCoordinates(rings);
        setSegmentDistances(distances);
      }

      setModalVisible(true);
      map.removeInteraction(draw);
    });

    map.addInteraction(draw);
  };

  const resetMap = () => {
    if (!map) return;
    const source = map.getLayers().getArray()[1].getSource();
    source.clear();
    setCoordinates([]);
    setSegmentDistances([]);
    setModalVisible(false);
  };

  return (
    <div>
      <div id="map" style={{ width: '100%', height: '500px', marginBottom: '20px' }}></div>

      <div className="controls">
        <button onClick={() => startDrawing('LineString')}>Draw LineString</button>
        <button onClick={() => startDrawing('Polygon')}>Draw Polygon</button>
        <button onClick={resetMap}>Reset</button>
      </div>

      {modalVisible && (
        <div className="modal">
          <h2>Coordinates and Segment Distances</h2>
          <ul>
            {coordinates.map((coord, index) => {
              if (Array.isArray(coord[0])) {
                // Nested coordinates (e.g., for a Polygon)
                return (
                  <li key={index}>
                    Ring {index + 1}:
                    <ul>
                      {coord.map((innerCoord, innerIndex) => (
                        <li key={innerIndex}>
                          WP({String(innerIndex).padStart(2, '0')}): [{innerCoord[0].toFixed(6)}, {innerCoord[1].toFixed(6)}]
                        </li>
                      ))}
                      <li>
                        Total Distance: {segmentDistances[index]?.reduce((sum, dist) => sum + parseFloat(dist), 0).toFixed(2)} km
                      </li>
                    </ul>
                  </li>
                );
              } else {
                // Single coordinate (e.g., for a LineString)
                return (
                  <li key={index}>
                    WP({String(index).padStart(2, '0')}): [{coord[0].toFixed(6)}, {coord[1].toFixed(6)}]
                    {index < segmentDistances.length && (
                      <span> - Segment Distance: {segmentDistances[index]} km</span>
                    )}
                  </li>
                );
              }
            })}
          </ul>
          <button onClick={() => setModalVisible(false)}>Close</button>
        </div>
      )}
    </div>
  );
}

export default App;
