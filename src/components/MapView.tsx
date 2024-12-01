// src/components/MapView.tsx
import React, { useEffect, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const center = {
  lat: 37.7749,
  lng: -122.4194,
};

const MapView = () => {
  const [potholes, setPotholes] = useState([]);
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "YOUR_GOOGLE_MAPS_API_KEY", // Replace with your key
  });

  useEffect(() => {
    const fetchPotholes = async () => {
      const snapshot = await getDocs(collection(db, "potholes"));
      setPotholes(snapshot.docs.map((doc) => doc.data()));
    };
    fetchPotholes();
  }, []);

  return isLoaded ? (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
      {potholes.map((pothole, index) => (
        <Marker key={index} position={{ lat: pothole.lat, lng: pothole.lng }} />
      ))}
    </GoogleMap>
  ) : (
    <div>Loading map...</div>
  );
};

export default MapView;
