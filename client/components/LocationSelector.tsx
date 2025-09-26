import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, Navigation } from "lucide-react";

interface LocationSelectorProps {
  location: string;
  setLocation: (location: string) => void;
  latitude: string;
  setLatitude: (lat: string) => void;
  longitude: string;
  setLongitude: (lng: string) => void;
  needsCoordinates: boolean;
  setNeedsCoordinates: (needs: boolean) => void;
  locationValidation: {
    needsCoordinates: boolean;
    reason: string;
    suggestions?: Array<{ name: string; latitude: number; longitude: number }>;
  } | null;
  isValidatingLocation: boolean;
}

export default function LocationSelector({
  location,
  setLocation,
  latitude,
  setLatitude,
  longitude,
  setLongitude,
  needsCoordinates,
  setNeedsCoordinates,
  locationValidation,
  isValidatingLocation,
}: LocationSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [showMap, setShowMap] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string>("");
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Initialize map
  useEffect(() => {
    if (!showMap || !mapRef.current || isMapLoaded) return;

    const initializeMap = async () => {
      try {
        // Dynamically import Leaflet to avoid SSR issues
        const L = await import("leaflet");
        await import("leaflet/dist/leaflet.css");

        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        // Create map centered on India
        const map = L.map(mapRef.current).setView([20.5937, 78.9629], 5);

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map);

        // Add click handler
        map.on("click", (e: any) => {
          const { lat, lng } = e.latlng;

          // Update coordinates
          setLatitude(lat.toFixed(6));
          setLongitude(lng.toFixed(6));
          setNeedsCoordinates(true);

          // Remove existing marker
          if (markerRef.current) {
            map.removeLayer(markerRef.current);
          }

          // Add new marker
          markerRef.current = L.marker([lat, lng]).addTo(map);

          // Reverse geocode to get location name
          reverseGeocode(lat, lng);
        });

        // If coordinates already exist, add marker
        if (latitude && longitude) {
          const lat = parseFloat(latitude);
          const lng = parseFloat(longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            markerRef.current = L.marker([lat, lng]).addTo(map);
            map.setView([lat, lng], 10);
          }
        }

        mapInstanceRef.current = map;
        setIsMapLoaded(true);
        setMapError("");
      } catch (error) {
        console.error("Map initialization failed:", error);
        setMapError("Failed to load map. Please use manual coordinate entry.");
      }
    };

    initializeMap();

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setIsMapLoaded(false);
      }
    };
  }, [
    showMap,
    latitude,
    longitude,
    setLatitude,
    setLongitude,
    setNeedsCoordinates,
  ]);

  // Reverse geocoding function
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
        {
          headers: {
            "User-Agent": "Water-Monitoring-App/1.0",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.display_name) {
          // Extract a more readable location name
          const parts = data.display_name.split(",");
          const locationName = parts.slice(0, 3).join(", ").trim();
          setLocation(locationName);
        }
      }
    } catch (error) {
      console.warn("Reverse geocoding failed:", error);
    }
  };

  // Get current location using browser geolocation
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        setNeedsCoordinates(true);

        // Update map if loaded
        if (mapInstanceRef.current) {
          // Dynamically import Leaflet again if needed
          import("leaflet").then((L) => {
            if (markerRef.current) {
              mapInstanceRef.current.removeLayer(markerRef.current);
            }
            markerRef.current = L.marker([lat, lng]).addTo(
              mapInstanceRef.current,
            );
            mapInstanceRef.current.setView([lat, lng], 12);
          });
        }

        // Reverse geocode to get location name
        reverseGeocode(lat, lng);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(
          "Unable to get your current location. Please select manually on the map or enter coordinates.",
        );
      },
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Location</label>
        <input
          type="text"
          placeholder="Village / Ward / City / Coordinates"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
          required
        />

        {/* Location validation status */}
        {isValidatingLocation && (
          <div className="text-xs text-blue-600 mt-1">
            Validating location...
          </div>
        )}

        {locationValidation && (
          <div
            className={`text-xs p-2 mt-2 rounded border-l-4 ${
              locationValidation.needsCoordinates
                ? "bg-yellow-50 border-l-yellow-400 text-yellow-700"
                : "bg-green-50 border-l-green-400 text-green-700"
            }`}
          >
            {locationValidation.reason}
            {locationValidation.suggestions && (
              <div className="mt-1">
                <p className="font-medium">Did you mean:</p>
                <ul className="mt-1 space-y-1">
                  {locationValidation.suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="text-xs cursor-pointer hover:underline"
                      onClick={() => {
                        setLatitude(suggestion.latitude.toString());
                        setLongitude(suggestion.longitude.toString());
                        setLocation(suggestion.name);
                      }}
                    >
                      {suggestion.name} ({suggestion.latitude.toFixed(4)},{" "}
                      {suggestion.longitude.toFixed(4)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map toggle and location tools */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowMap(!showMap)}
          className="flex items-center gap-2"
        >
          <MapPin className="h-4 w-4" />
          {showMap ? "Hide Map" : "Select on Map"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocation}
          className="flex items-center gap-2"
        >
          <Navigation className="h-4 w-4" />
          Use Current Location
        </Button>
      </div>

      {/* Map container */}
      {showMap && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Location on Map</CardTitle>
            <CardDescription>
              Click anywhere on the map to select your location. The coordinates
              will be automatically filled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mapError ? (
              <div className="text-red-600 text-sm p-4 bg-red-50 rounded-md">
                {mapError}
              </div>
            ) : (
              <div
                ref={mapRef}
                className="h-96 w-full rounded-md border"
                style={{ minHeight: "384px" }}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Coordinate inputs - shown when needed */}
      {needsCoordinates && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-gray-600">
              Latitude *
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g., 40.7128"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              required={needsCoordinates}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">
              Longitude *
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g., -74.0060"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              required={needsCoordinates}
            />
          </div>
        </div>
      )}
    </div>
  );
}
