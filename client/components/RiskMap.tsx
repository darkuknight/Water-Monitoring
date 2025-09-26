import { useEffect, useState, useRef } from "react";

interface LocationRisk {
  id: string;
  location: string;
  latitude?: number;
  longitude?: number;
  riskPercentage: number;
  timestamp: number;
}

interface RiskMapProps {
  locationRisks: LocationRisk[];
  onRefresh?: () => void;
}

export default function RiskMap({ locationRisks, onRefresh }: RiskMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string>("");
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());

  // Filter locations with valid coordinates
  const validLocations = locationRisks.filter(
    (loc) => loc.latitude !== undefined && loc.longitude !== undefined,
  );

  // Locations without coordinates (for display in a list)
  const invalidLocations = locationRisks.filter(
    (loc) => loc.latitude === undefined || loc.longitude === undefined,
  );

  // Generate unique key based on coordinates
  const getLocationKey = (location: LocationRisk) => {
    return `${location.latitude?.toFixed(6)}_${location.longitude?.toFixed(6)}`;
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 70) return "text-red-600";
    if (risk >= 40) return "text-yellow-600";
    return "text-green-600";
  };

  const getRiskBgColor = (risk: number) => {
    if (risk >= 70) return "#ef4444";
    if (risk >= 40) return "#f59e0b";
    return "#22c55e";
  };

  const getRiskLabel = (risk: number) => {
    if (risk >= 70) return "High Risk";
    if (risk >= 40) return "Medium Risk";
    return "Low Risk";
  };

  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      try {
        // Import Leaflet modules
        const L = await import("leaflet");

        // Import CSS
        await import("leaflet/dist/leaflet.css");

        if (!isMounted) return;

        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });

        // Create map
        const map = L.map(mapRef.current, {
          zoomControl: true,
          attributionControl: true,
        }).setView([20.5937, 78.9629], 5);

        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        mapInstanceRef.current = map;
        setIsMapLoaded(true);
        setMapError("");
      } catch (error: any) {
        console.error("Failed to load map:", error);
        setMapError("Failed to load map. Please refresh the page.");
        setIsMapLoaded(false);
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Only run once to initialize the map

  // Separate useEffect for managing markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded) return;

    const updateMarkers = async () => {
      try {
        const L = await import("leaflet");
        const map = mapInstanceRef.current;

        // Get current location keys
        const currentLocationKeys = new Set(validLocations.map(getLocationKey));

        // Remove markers that no longer exist
        markersRef.current.forEach((marker, key) => {
          if (!currentLocationKeys.has(key)) {
            map.removeLayer(marker);
            markersRef.current.delete(key);
          }
        });

        // Add or update markers for current locations
        validLocations.forEach((location) => {
          if (location.latitude && location.longitude) {
            const locationKey = getLocationKey(location);

            // Remove existing marker if it exists (to update it)
            if (markersRef.current.has(locationKey)) {
              map.removeLayer(markersRef.current.get(locationKey));
            }

            // Create custom icon
            const customIcon = L.divIcon({
              className: "custom-risk-marker",
              html: `
                <div style="
                  background-color: ${getRiskBgColor(location.riskPercentage)};
                  width: 30px;
                  height: 30px;
                  border-radius: 50%;
                  border: 3px solid white;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  font-size: 11px;
                  font-weight: bold;
                  cursor: pointer;
                ">
                  ${Math.round(location.riskPercentage)}%
                </div>
              `,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            });

            const marker = L.marker([location.latitude, location.longitude], {
              icon: customIcon,
            }).addTo(map);

            // Add popup with location details including coordinates for differentiation
            marker.bindPopup(`
              <div style="min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px;">${location.location}</h3>
                <p style="margin: 4px 0; color: ${getRiskBgColor(location.riskPercentage)}; font-weight: bold;">
                  Risk Level: ${location.riskPercentage}% (${getRiskLabel(location.riskPercentage)})
                </p>
                <p style="margin: 4px 0; font-size: 12px; color: #555;">
                  Coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
                </p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">
                  Last updated: ${new Date(location.timestamp).toLocaleString()}
                </p>
              </div>
            `);

            markersRef.current.set(locationKey, marker);
          }
        });

        // Fit map to show all markers if there are any
        if (markersRef.current.size > 0) {
          const markers = Array.from(markersRef.current.values());
          const group = L.featureGroup(markers);
          map.fitBounds(group.getBounds().pad(0.1));
        }
      } catch (error: any) {
        console.error("Failed to update markers:", error);
      }
    };

    updateMarkers();
  }, [validLocations, isMapLoaded]); // Update markers when locations change

  return (
    <div className="space-y-4 relative z-0 isolate">
      {/* Map Container */}
      <div className="relative z-0 overflow-hidden">
        <div
          ref={mapRef}
          className="h-96 w-full rounded-lg border overflow-hidden relative z-0"
          style={{ minHeight: "384px", zIndex: 0, isolation: "isolate" }}
        />

        {!isMapLoaded && !mapError && (
          <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p>Loading map...</p>
            </div>
          </div>
        )}

        {mapError && (
          <div className="absolute inset-0 bg-red-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-red-600">
              <p className="font-semibold">Failed to load map</p>
              <p className="text-sm">{mapError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map Statistics */}
      {isMapLoaded && validLocations.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-800">
            📍 Showing {validLocations.length} location
            {validLocations.length !== 1 ? "s" : ""} on map
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span>Low Risk (0-39%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
          <span>Medium Risk (40-69%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span>High Risk (70-100%)</span>
        </div>
      </div>

      {/* Locations without coordinates */}
      {invalidLocations.length > 0 && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="font-semibold mb-2 text-yellow-800">
            ⚠️ Locations without coordinates:
          </h3>
          <div className="space-y-2">
            {invalidLocations.map((location) => (
              <div
                key={location.id}
                className="flex justify-between items-center"
              >
                <span className="font-medium">{location.location}</span>
                <span
                  className={`font-medium ${getRiskColor(location.riskPercentage)}`}
                >
                  {location.riskPercentage}% (
                  {getRiskLabel(location.riskPercentage)})
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-yellow-700 mt-2">
            Add latitude/longitude coordinates to show these locations on the
            map.
          </p>
        </div>
      )}

      {/* No data message */}
      {locationRisks.length === 0 && (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-600 mb-4">No location data available</p>
          <p className="text-sm text-gray-500">
            Add some location risk data using the form above to see them on the
            map.
          </p>
        </div>
      )}

      {/* Refresh button */}
      {onRefresh && (
        <div className="flex justify-center">
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      )}
    </div>
  );
}
