import { useState, useEffect } from "react";
import EnhancedRiskMap from "@/components/EnhancedRiskMap";
import UserMarkerForm from "@/components/UserMarkerForm";

interface EnhancedLocationRisk {
  _id?: string;
  id: string;
  location: string;
  latitude?: number;
  longitude?: number;
  riskPercentage: number;
  timestamp: number;
  type: "report" | "water-test" | "user-added";
  source?: string;
  metadata?: {
    // For reports
    symptoms?: string[];
    affectedCount?: number;
    notes?: string;
    // For water tests
    kit?: string;
    overallRisk?: string;
    confidence?: number;
    criticalParameters?: number;
    totalParameters?: number;
    testDate?: string;
    // For user-added
    title?: string;
    description?: string;
    category?: string;
  };
}

export default function Analytics() {
  const [locationRisks, setLocationRisks] = useState<EnhancedLocationRisk[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Fetch location risks from API
  const fetchLocationRisks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/analytics");
      if (!response.ok) {
        throw new Error("Failed to fetch location risks");
      }
      const result = await response.json();
      setLocationRisks(result.data || []);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchLocationRisks();
  }, []);

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Analytics & Risk Visualization
        </h1>
        <p className="text-foreground/70 mb-6">
          View location-based risk data on an interactive map. Risk data is
          automatically calculated from community reports and water tests. You
          can also add custom markers.
        </p>
      </div>

      {/* Enhanced Features Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">i</span>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">
              Enhanced Map Features
            </h3>
            <p className="text-blue-800 text-sm">
              The map displays three types of markers: Community Reports (red),
              Water Test Results (blue), and User-Added Markers (green). You can
              filter by marker type, view clustered hotspots, and manage
              markers. Risk levels are automatically calculated based on reports
              and test results.
            </p>
          </div>
        </div>
      </div>

      {/* Map Display */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Enhanced Risk Map</h2>
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p>Loading map data...</p>
            </div>
          </div>
        ) : (
          <EnhancedRiskMap
            locationRisks={locationRisks}
            onRefresh={fetchLocationRisks}
          />
        )}
      </div>

      {/* User Marker Creation */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Add Custom Marker</h2>
        <p className="text-sm text-gray-600 mb-4">
          Add your own markers to track specific locations or observations.
        </p>
        <UserMarkerForm
          onAddMarker={async (markerData) => {
            const response = await fetch("/api/user-data", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(markerData),
            });

            if (!response.ok) {
              throw new Error("Failed to add marker");
            }
          }}
          onSuccess={fetchLocationRisks}
        />
      </div>

      {/* Enhanced Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border text-center">
          <h3 className="text-lg font-semibold text-red-600">Reports</h3>
          <p className="text-2xl font-bold">
            {locationRisks.filter((loc) => loc.type === "report").length}
          </p>
          <p className="text-sm text-gray-600">Community Reports</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border text-center">
          <h3 className="text-lg font-semibold text-blue-600">Water Tests</h3>
          <p className="text-2xl font-bold">
            {locationRisks.filter((loc) => loc.type === "water-test").length}
          </p>
          <p className="text-sm text-gray-600">Test Results</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border text-center">
          <h3 className="text-lg font-semibold text-green-600">User Markers</h3>
          <p className="text-2xl font-bold">
            {locationRisks.filter((loc) => loc.type === "user-added").length}
          </p>
          <p className="text-sm text-gray-600">Custom Markers</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border text-center">
          <h3 className="text-lg font-semibold text-orange-600">High Risk</h3>
          <p className="text-2xl font-bold">
            {locationRisks.filter((loc) => loc.riskPercentage >= 70).length}
          </p>
          <p className="text-sm text-gray-600">Locations (≥70%)</p>
        </div>
      </div>
    </section>
  );
}
