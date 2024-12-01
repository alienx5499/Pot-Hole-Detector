// src/App.tsx
import React from "react";
import "./App.css";
import MapView from "./components/MapView";
import ReportForm from "./components/ReportForm";

const App = () => {
  return (
    <div className="App">
      <h1>Pothole Detector</h1>
      <MapView />
      <h2>Report a Pothole</h2>
      <ReportForm />
    </div>
  );
};

export default App;
