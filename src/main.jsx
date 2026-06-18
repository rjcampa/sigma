import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/inter"; // bundled, self-hosted UI font (CSP-safe)
import DevPreview from "./DevPreview";

// `?demo` renders a standalone preview with mock data (no Sigma host required).
//
// IMPORTANT: @sigmacomputing/plugin exports a pre-initialized `client` singleton
// that parses Sigma's init payload AT IMPORT TIME — outside a Sigma iframe that
// parse throws ("Unexpected end of JSON input") and blanks the page. So we only
// import the plugin package (and App) in the non-demo branch, via dynamic import.
const root = ReactDOM.createRoot(document.getElementById("root"));
const isDemo = new URLSearchParams(window.location.search).has("demo");

if (isDemo) {
  root.render(
    <React.StrictMode>
      <DevPreview />
    </React.StrictMode>
  );
} else {
  Promise.all([import("@sigmacomputing/plugin"), import("./App")]).then(
    ([{ client, SigmaClientProvider }, { default: App }]) => {
      root.render(
        <React.StrictMode>
          <SigmaClientProvider client={client}>
            <App />
          </SigmaClientProvider>
        </React.StrictMode>
      );
    }
  );
}
