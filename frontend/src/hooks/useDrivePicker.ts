import { useEffect, useState } from "react";

// Types for Google API global objects
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface PickerConfig {
  clientId: string;
  developerKey: string;
  viewId?: string; // e.g., "DOCS_VIDEOS"
  callbackFunction: (data: any) => void;
}

export default function useDrivePicker() {
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  useEffect(() => {
    // Load the Google API scripts dynamically
    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve(true);
          return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    Promise.all([
      loadScript("https://apis.google.com/js/api.js"),
      loadScript("https://accounts.google.com/gsi/client"),
    ])
      .then(() => {
        // Initialize the Picker API
        if (window.gapi) {
          window.gapi.load("picker", () => setIsApiLoaded(true));
        }
      })
      .catch((err) => console.error("Failed to load Google scripts:", err));
  }, []);

  const openPicker = ({ clientId, developerKey, callbackFunction }: PickerConfig) => {
    if (!isApiLoaded) {
      console.warn("Google API not loaded yet");
      return;
    }

    // 1. Request an Access Token using the modern GIS (Google Identity Services)
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/drive.file", // Only access files user selects
      callback: (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          createPicker(tokenResponse.access_token);
        }
      },
    });

    // 2. Trigger the auth popup
    client.requestAccessToken();

    // 3. Once authenticated, build and show the Picker
    const createPicker = (accessToken: string) => {
      const picker = new window.google.picker.PickerBuilder()
        .addView(window.google.picker.ViewId.DOCS_VIDEOS) // Filter for Videos
        .setOAuthToken(accessToken)
        .setDeveloperKey(developerKey)
        .setCallback(callbackFunction)
        .setOrigin(window.location.protocol + "//" + window.location.host)
        .build();
      picker.setVisible(true);
    };
  };

  return { openPicker, isApiLoaded };
}