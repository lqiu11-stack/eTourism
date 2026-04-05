import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { useEffect, useState } from "react";
import axios from "axios";
import "./MapPage.css";

export const MapPage = () => {
  const [data, setData] = useState([]);
  const [selected, setSelected] = useState(null);

  const center = { lat: 53.3811, lng: -1.4878 }; // Sheffield

  // 📍 Sheffield landmarks（地標）
  const landmarks = [
    {
      id: 101,
      name: "University of Sheffield",
      lat: 53.3810,
      lng: -1.4880,
    },
    {
      id: 102,
      name: "Sheffield Cathedral",
      lat: 53.3838,
      lng: -1.4677,
    },
    {
      id: 103,
      name: "Weston Park Museum",
      lat: 53.3804,
      lng: -1.4904,
    },
  ];

  useEffect(() => {
    axios
      .get("http://localhost:5001/api/visitor/experiences")
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="map-layout">
      
      {/* left bar */}
      <div className="sidebar">
        <h2>Explore Sheffield</h2>
        <p>Select a location on the map</p>
      </div>

      {/* map */}
      <div className="map-container">
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={center}
            zoom={13}
          >

            {/* Experiences */}
            {data
              .filter((item) => item.latitude && item.longitude)
              .map((item) => (
                <Marker
                  key={item.id}
                  position={{
                    lat: Number(item.latitude),
                    lng: Number(item.longitude),
                  }}
                  onClick={() => setSelected(item)}
                />
              ))}

            {/*  Landmarks */}
            {landmarks.map((place) => (
              <Marker
                key={place.id}
                position={{ lat: place.lat, lng: place.lng }}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                }}
                onClick={() => setSelected(place)}
              />
            ))}

            {/* Info window */}
            {selected && (
              <InfoWindow
                position={{
                  lat: selected.latitude
                    ? Number(selected.latitude)
                    : selected.lat,
                  lng: selected.longitude
                    ? Number(selected.longitude)
                    : selected.lng,
                }}
                onCloseClick={() => setSelected(null)}
              >
                <div>
                  <h4>{selected.title || selected.name}</h4>
                  <p>{selected.location_name || "Landmark"}</p>
                </div>
              </InfoWindow>
            )}

          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  );
};