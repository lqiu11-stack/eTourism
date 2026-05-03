import {
  GoogleMap,
  Marker,
  InfoWindow,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
// import { Link } from "react-router-dom";
import axios from "axios";
import "./MapPage.css";
import backIcon from "../icon/back.png";
import { useNavigate, Link } from "react-router-dom";
import { AccountMenu } from "../../components/AccountMenu";

const API_BASE = import.meta.env.VITE_API_URL;
const DEFAULT_CENTER = { lat: 51.5101, lng: -0.1340 };
const MAP_LIBRARIES = ["places"];

export const MapPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [price, setPrice] = useState(7000);
  const [filters, setFilters] = useState({});
  const [genderFilter, setGenderFilter] = useState("");

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: MAP_LIBRARIES,
  });

  const [data, setData] = useState([]);

  const availableLanguages = useMemo(() => [...new Set(data.map(i => i.language).filter(Boolean))].sort(), [data]);
  const availableCategories = useMemo(() => [...new Set(data.map(i => i.category).filter(Boolean))].sort(), [data]);
  const availableContinents = useMemo(() => [...new Set(data.map(i => i.continent).filter(Boolean))].sort(), [data]);
  const [filteredData, setFilteredData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchError, setSearchError] = useState("");

  const mapRef = useRef(null);
  const initialFitDone = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  const fitToMarkers = useCallback((items) => {
    if (!mapRef.current || !window.google) return;
    const valid = items.filter(i => i.latitude && i.longitude);
    if (valid.length === 0) return;
    if (valid.length === 1) {
      mapRef.current.panTo({ lat: Number(valid[0].latitude), lng: Number(valid[0].longitude) });
      mapRef.current.setZoom(14);
      return;
    }
    const bounds = new window.google.maps.LatLngBounds();
    valid.forEach(i => bounds.extend({ lat: Number(i.latitude), lng: Number(i.longitude) }));
    mapRef.current.fitBounds(bounds);
  }, []);

  const handleCheckbox = (key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleApply = () => {
    const activeLanguages = availableLanguages.filter(k => filters[k]);
    const activeCategories = availableCategories.filter(k => filters[k]);
    const activeContinents = availableContinents.filter(k => filters[k]);

    const result = data.filter(item => {
      if (search) {
        const q = search.toLowerCase();
        const matches = item.title?.toLowerCase().includes(q) ||
                        item.country?.toLowerCase().includes(q) ||
                        item.location_name?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (Number(item.price) > Number(price)) return false;
      if (activeLanguages.length > 0 && !activeLanguages.includes(item.language)) return false;
      if (activeCategories.length > 0 && !activeCategories.includes(item.category)) return false;
      if (activeContinents.length > 0 && !activeContinents.includes(item.continent)) return false;
      if (genderFilter && item.gender_preference !== genderFilter) return false;
      return true;
    });

    if (result.length === 0) {
      setSearchError("No experiences found matching your search.");
      setFilteredData([]);
      return;
    }
    setSearchError("");
    setFilteredData(result);
    fitToMarkers(result);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${API_BASE}/visitor/experiences`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => {
        setData(res.data);
        setFilteredData(res.data);
      })
      .catch((err) => console.error(err));
  }, []);

  // Fit map to all markers once both map and data are ready
  useEffect(() => {
    if (mapRef.current && filteredData.length > 0 && !initialFitDone.current) {
      fitToMarkers(filteredData);
      initialFitDone.current = true;
    }
  }, [mapReady, filteredData, fitToMarkers]);

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
            <AccountMenu />
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
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
        />

        <h3>Your budget</h3>
        <p>£0 - £{price}</p>

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
        {availableLanguages.map(lang => (
          <label key={lang}>
            <input
              type="checkbox"
              checked={filters[lang] || false}
              onChange={() => handleCheckbox(lang)}
            />
            {lang}
          </label>
        ))}

        <p>Tourism type</p>
        {availableCategories.map(cat => (
          <label key={cat}>
            <input
              type="checkbox"
              checked={filters[cat] || false}
              onChange={() => handleCheckbox(cat)}
            />
            {cat}
          </label>
        ))}

        <p>Continent</p>
        {availableContinents.map(cont => (
          <label key={cont}>
            <input
              type="checkbox"
              checked={filters[cont] || false}
              onChange={() => handleCheckbox(cont)}
            />
            {cont}
          </label>
        ))}

        <p>Gender preference</p>
        {(() => {
          const all = [
            { value: "", label: "All" },
            { value: "any", label: "Any" },
            { value: "mixed", label: "Mixed only" },
            { value: "female_only", label: "Female-only" },
            { value: "male_only", label: "Male-only" },
          ];
          const viewer = (() => {
            try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
          })();
          const opts =
            viewer.gender === "male"   ? all.filter(o => o.value !== "female_only") :
            viewer.gender === "female" ? all.filter(o => o.value !== "male_only")   :
            all;
          return opts.map(({ value, label }) => (
            <label key={value || "all"}>
              <input
                type="radio"
                name="map-gender"
                checked={genderFilter === value}
                onChange={() => setGenderFilter(value)}
              />
              {label}
            </label>
          ));
        })()}
        </div>
    </div>
        <div className="sidebar-footer">
            {searchError && <p className="search-error">{searchError}</p>}
            <button className="apply-btn" onClick={handleApply}>
            Find the tourism
            </button>
        </div>
      </div>

      {/* map */}
      <div className="map-container">
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            defaultCenter={DEFAULT_CENTER}
            defaultZoom={13}
            onLoad={(map) => { mapRef.current = map; setMapReady(true); }}
          >

            {/* Experiences */}
            {filteredData
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
                <div className="map-info-card">
                <img
                    src={selected?.cover_image}
                    alt="tour"
                    className="map-info-img"
                />

                <h4>{selected.title || selected.name}</h4>

                <p className="map-info-price">
                    £{selected.price || 50}
                </p>

                <button
                    className="map-book-btn"
                    onClick={() => navigate(`/DetailPage?id=${selected.id}`, {
                    state: { from: "map" }
                    })}
                >
                    Book it
                </button>
                </div>
              </InfoWindow>
            )}

          </GoogleMap>
        )}
      </div>
    </div>
    </div>
  );
};