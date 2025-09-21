import { useState, useEffect } from "react";
import RiskMap from "@/components/RiskMapFixed";

interface LocationRisk {
  id: string;
  location: string;
  latitude?: number;
  longitude?: number;
  riskPercentage: number;
  timestamp: number;
}

export default function Analytics() {
  const [locationRisks, setLocationRisks] = useState<LocationRisk[]>([]);
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
          automatically calculated from community reports.
        </p>
      </div>

      {/* Community Reports Integration Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">i</span>
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">
              Automatic Risk Calculation
            </h3>
            <p className="text-blue-800 text-sm">
              When community reports are submitted, risk levels are
              automatically calculated based on the number of affected
              individuals and symptoms reported. The system also attempts to
              find coordinates for the reported location to display it on the
              map.
            </p>
          </div>
        </div>
      </div>

      {/* Map Display */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Risk Map</h2>
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p>Loading map data...</p>
            </div>
          </div>
        ) : (
          <RiskMap
            locationRisks={locationRisks}
            onRefresh={fetchLocationRisks}
          />
        )}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border text-center">
          <h3 className="text-lg font-semibold text-green-600">Low Risk</h3>
          <p className="text-2xl font-bold">
            {locationRisks.filter((loc) => loc.riskPercentage < 40).length}
          </p>
          <p className="text-sm text-gray-600">Locations (0-39%)</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border text-center">
          <h3 className="text-lg font-semibold text-yellow-600">Medium Risk</h3>
          <p className="text-2xl font-bold">
            {
              locationRisks.filter(
                (loc) => loc.riskPercentage >= 40 && loc.riskPercentage < 70,
              ).length
            }
          </p>
          <p className="text-sm text-gray-600">Locations (40-69%)</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border text-center">
          <h3 className="text-lg font-semibold text-red-600">High Risk</h3>
          <p className="text-2xl font-bold">
            {locationRisks.filter((loc) => loc.riskPercentage >= 70).length}
          </p>
          <p className="text-sm text-gray-600">Locations (70-100%)</p>
        </div>
      </div>
    </section>
  );
}
