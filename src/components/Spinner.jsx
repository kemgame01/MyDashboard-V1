import React from "react";
import "../styles/Spinner.css";

const Spinner = ({ text = "Loading..." }) => (
  <div className="spinner-container">
    <div className="spinner" />
    <span className="spinner-text">{text}</span>
  </div>
);

export default Spinner;
