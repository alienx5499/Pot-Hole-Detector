// src/components/ReportForm.tsx
import React, { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

const ReportForm = () => {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "potholes"), {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        description,
        timestamp: new Date(),
      });
      alert("Pothole reported successfully!");
      setLat("");
      setLng("");
      setDescription("");
    } catch (error) {
      alert("Error reporting pothole: " + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <input
        type="number"
        placeholder="Latitude"
        value={lat}
        onChange={(e) => setLat(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Longitude"
        value={lng}
        onChange={(e) => setLng(e.target.value)}
        required
      />
      <textarea
        placeholder="Description (Optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button type="submit">Report Pothole</button>
    </form>
  );
};

export default ReportForm;
