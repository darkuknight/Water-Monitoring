import { useState, useEffect, useCallback } from "react";
import {
  TestingKit,
  ParameterValue,
  KitTestResult,
} from "@shared/types/testing-kits";
import { testingKits } from "@shared/data/testing-kits";
import { analyzeTestResults } from "@shared/utils/testing-analysis";
import KitSelector from "@/components/testing/KitSelector";
import ParameterInput from "@/components/testing/ParameterInput";
import ResultsDisplay from "@/components/testing/ResultsDisplay";

type TestingStep =
  | "location-input"
  | "kit-selection"
  | "parameter-input"
  | "results";

export default function WaterKits() {
  const [currentStep, setCurrentStep] = useState<TestingStep>("location-input");
  const [selectedKit, setSelectedKit] = useState<TestingKit | null>(null);
  const [testResults, setTestResults] = useState<KitTestResult | null>(null);

  // Location state management
  const [location, setLocation] = useState("");
  const [needsCoordinates, setNeedsCoordinates] = useState(false);
  const [locationValidation, setLocationValidation] = useState<{
    needsCoordinates: boolean;
    reason: string;
    suggestions?: Array<{ name: string; latitude: number; longitude: number }>;
  } | null>(null);
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [isValidatingLocation, setIsValidatingLocation] = useState(false);

  // Debounced location validation
  const validateLocation = useCallback(async (locationValue: string) => {
    if (!locationValue.trim()) {
      setLocationValidation(null);
      setNeedsCoordinates(false);
      return;
    }

    setIsValidatingLocation(true);
    try {
      const response = await fetch(
        `/api/reports/validate-location?location=${encodeURIComponent(locationValue)}`,
      );
      const validation = await response.json();

      setLocationValidation(validation);
      setNeedsCoordinates(validation.needsCoordinates);

      // Clear coordinates if location is valid and doesn't need coordinates
      if (!validation.needsCoordinates) {
        setLatitude("");
        setLongitude("");
      }
    } catch (error) {
      console.error("Location validation failed:", error);
      setLocationValidation({
        needsCoordinates: true,
        reason: "Unable to validate location - please provide coordinates",
      });
      setNeedsCoordinates(true);
    } finally {
      setIsValidatingLocation(false);
    }
  }, []);

  // Debounce location validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateLocation(location);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [location, validateLocation]);

  const handleLocationSubmit = () => {
    if (!location.trim()) return;

    // Check if coordinates are required but not provided
    if (needsCoordinates && (!latitude || !longitude)) {
      alert("Please provide coordinates for this location");
      return;
    }

    setCurrentStep("kit-selection");
  };

  const handleKitSelection = (kit: TestingKit) => {
    setSelectedKit(kit);
    setCurrentStep("parameter-input");
  };

  const handleParameterSubmit = (parameterValues: ParameterValue[]) => {
    if (!selectedKit) return;

    const results = analyzeTestResults(selectedKit, parameterValues);
    setTestResults(results);
    setCurrentStep("results");
  };

  const handleBackToKitSelection = () => {
    setCurrentStep("kit-selection");
    setSelectedKit(null);
    setTestResults(null);
  };

  const handleBackToParameterInput = () => {
    setCurrentStep("parameter-input");
    setTestResults(null);
  };

  const handleRunNewTest = () => {
    setCurrentStep("parameter-input");
    setTestResults(null);
  };

  const handleBackToLocation = () => {
    setCurrentStep("location-input");
    setSelectedKit(null);
    setTestResults(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {currentStep === "location-input" && (
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Water Quality Testing</h1>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Step 1: Location Information
            </h2>
            <p className="text-gray-600 mb-6">
              Enter the location where you're testing the water. This
              information will be used for analytics and mapping.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Location
                </label>
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
                          {locationValidation.suggestions.map(
                            (suggestion, index) => (
                              <li
                                key={index}
                                className="text-xs cursor-pointer hover:underline"
                                onClick={() => {
                                  setLatitude(suggestion.latitude.toString());
                                  setLongitude(suggestion.longitude.toString());
                                }}
                              >
                                {suggestion.name} (
                                {suggestion.latitude.toFixed(4)},{" "}
                                {suggestion.longitude.toFixed(4)})
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Coordinate inputs - shown when needed */}
                {needsCoordinates && (
                  <div className="grid grid-cols-2 gap-2 mt-3">
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

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleLocationSubmit}
                  disabled={
                    !location.trim() ||
                    (needsCoordinates && (!latitude || !longitude))
                  }
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Continue to Kit Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === "kit-selection" && (
        <KitSelector
          kits={testingKits}
          selectedKit={selectedKit}
          onSelectKit={handleKitSelection}
          onBack={handleBackToLocation}
        />
      )}

      {currentStep === "parameter-input" && selectedKit && (
        <ParameterInput
          kit={selectedKit}
          onSubmit={handleParameterSubmit}
          onBack={handleBackToKitSelection}
        />
      )}

      {currentStep === "results" && testResults && (
        <ResultsDisplay
          results={testResults}
          onRunNewTest={handleRunNewTest}
          onBackToKitSelection={handleBackToKitSelection}
          location={location}
          latitude={
            needsCoordinates && latitude ? parseFloat(latitude) : undefined
          }
          longitude={
            needsCoordinates && longitude ? parseFloat(longitude) : undefined
          }
        />
      )}
    </div>
  );
}
