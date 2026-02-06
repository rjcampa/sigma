import React from "react";
import ReactDOM from "react-dom/client";
import { initialize, SigmaClientProvider } from "@sigmacomputing/plugin";
import App from "./App";

// Initialize the Sigma plugin client — this sets up the
// postMessage bridge between Sigma's iframe and our app
const client = initialize();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SigmaClientProvider client={client}>
      <App />
    </SigmaClientProvider>
  </React.StrictMode>
);
