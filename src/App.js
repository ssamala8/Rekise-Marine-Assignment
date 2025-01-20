import React, { useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer } from 'ol/layer';
import { OSM } from 'ol/source';
import { Draw } from 'ol/interaction';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { fromLonLat } from 'ol/proj';

function App() {
  const [map, setMap] = useState(null);
  const [coordinates, setCoordinates] = useState([]);
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


  const startDrawing = (type) => {
    if (!map) return;

    const source = map.getLayers().getArray()[1].getSource();

    const draw = new Draw({
      source,
      type,
    });

    draw.on('drawend', (event) => {
      const feature = event.feature;
      const coords = feature.getGeometry().getCoordinates();
      setCoordinates((prev) => [...prev, ...coords]);
      setModalVisible(true);
      map.removeInteraction(draw);
    });

    map.addInteraction(draw);
  };

  return (
    <div>
      <div id="map" style={{ width: '100%', height: '500px' }}></div>

      <button onClick={() => startDrawing('LineString')}>Draw LineString</button>
      <button onClick={() => startDrawing('Polygon')}>Draw Polygon</button>

      {modalVisible && (
        <div className="modal">
          <h2>Coordinates</h2>
          <ul>
            {coordinates.map((coord, index) => {

              const isNestedArray = Array.isArray(coord[0]);
              if (isNestedArray) {
                return (
                  <li key={index}>
                    {coord.map(
                      (nestedCoord, nestedIndex) =>
                        `WP(${String(nestedIndex).padStart(2, '0')}): [${nestedCoord[0].toFixed(6)}, ${nestedCoord[1].toFixed(6)}]`
                    ).join(' | ')}
                  </li>
                );
              } else {

                return (
                  <li key={index}>
                    WP({String(index).padStart(2, '0')}): [{coord[0].toFixed(6)}, {coord[1].toFixed(6)}]
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
