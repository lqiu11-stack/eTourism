import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import axios from "axios";
import "./MapPage.css";

export const MapPage = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5001/api/visitor/experiences")
      .then((res) => {
        console.log(res.data); // 
        setData(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="map-layout">

      {/* Sidebar */}
      <div className="sidebar">
        <h2>Filter by</h2>

        <div className="filter-section">
          <p>Budget</p>
          <input type="range" min="0" max="5000" />
        </div>

        <div className="filter-section">
          <p>Type</p>
          <label><input type="checkbox" /> Tour</label><br />
          <label><input type="checkbox" /> Museum</label>
        </div>
      </div>

      {/* map */}
      <div className="map-container">
        <MapContainer
          center={[53.3811, -1.4878]}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {data
            .filter((item) => item.latitude && item.longitude)
            .map((item) => (
              <Marker
                key={item.id}
                position={[
                  Number(item.latitude),
                  Number(item.longitude),
                ]}
              >
                <Popup>
                  <b>{item.title}</b><br />
                  {item.location_name}
                </Popup>
              </Marker>
          ))}
        </MapContainer>
      </div>

    </div>
  );
};