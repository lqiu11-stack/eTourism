import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
import axios from "axios";
import "./MapPage.css";
import backIcon from "../icon/back.png";
import { useNavigate, Link } from "react-router-dom";


export const MapPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [price, setPrice] = useState(7000);
  const [filters, setFilters] = useState({
    parking: false,
    breakfast: false,
    hotel: false,
  });

  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const [data, setData] = useState([]);   
  const [selected, setSelected] = useState(null); 

  const center = { lat: 53.3811, lng: -1.4878 };

  const handleCheckbox = (key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleApply = () => {
    console.log({
      search,
      price,
      filters,
    });
  };

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
    <div className="map-page-root">
        <nav className="navbar">
            <button
                    type="button"
                    className="detail-back-btn"
                    onClick={() => navigate("/MainPage")}
                    aria-label="Back"
                  >
                    <img src={backIcon} alt="Back" className="detail-back-icon" />
                  </button>

          <div className="nav-links">
              <Link to="/help" className="nav-link">Helping centre</Link>
              <Link to="/Mybooking" className="nav-link">My booking</Link>
               {isLoggedIn ? (
                  <button className="nav-link nav-btn-link" onClick={handleLogout}>
                    Logout
                  </button>
                ) : (
                  <Link to="/login" className="nav-link">Login</Link>
                )}
            </div>
        </nav>
    <div className="map-layout">
      
      {/* sidebar */}
      <div className="sidebar">

    {/* scroll*/}
    <div className="sidebar-content">
        <div className="sidebar-inner">

        <h3>Search</h3>
        <input
          className="search-input"
          placeholder="Search location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <h3>Your budget</h3>
        <p>0£ - {price}£</p>

        <input
          type="range"
          min="0"
          max="7000"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="slider"
        />

        <h3>Popular filters</h3>

        <p>Language</p>
        <label>
          <input
            type="checkbox"
            checked={filters.english}
            onChange={() => handleCheckbox("English")}
          />
          English
        </label>
        <label>
          <input
            type="checkbox"
            checked={filters.Mandarin}
            onChange={() => handleCheckbox("Mandarin")}
          />
          Mandarin
        </label>
        <label>
          <input
            type="checkbox"
            checked={filters.German}
            onChange={() => handleCheckbox("German")}
          />
          German
        </label>
        <label>
          <input
            type="checkbox"
            checked={filters.Korean}
            onChange={() => handleCheckbox("Korean")}
          />
          Korean
        </label>

        <p>Tourism type</p>
        <label>
          <input
            type="checkbox"
            checked={filters.History}
            onChange={() => handleCheckbox("History")}
          />
          History
        </label>
        <label>
          <input
            type="checkbox"
            checked={filters.Art}
            onChange={() => handleCheckbox("Art")}
          />
          Art
        </label>
        <label>
          <input
            type="checkbox"
            checked={filters.Religious}
            onChange={() => handleCheckbox("Religious")}
          />
          Religious
        </label>
        <label>
          <input
            type="checkbox"
            checked={filters.City}
            onChange={() => handleCheckbox("City view")}
          />
          City View
        </label>
        <label>
          <input
            type="checkbox"
            checked={filters.Wild}
            onChange={() => handleCheckbox("Wild life")}
          />
          Wild life
        </label>
        </div>
    </div>
        <div className="sidebar-footer">
            <button className="apply-btn">
            Find the tourism
            </button>
        </div>
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

            {/* Landmarks */}
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

            {/* InfoWindow */}
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
    </div>
  );
};