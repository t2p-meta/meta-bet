import { CircularProgress } from "@material-ui/core";
import React from "react";

export const Preloader = () => {
  return (
    <div
      style={{
        height: "70%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress style={{ color: "black" }} />
    </div>
  );
};

export default Preloader;
