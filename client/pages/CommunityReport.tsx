import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import LocationSelector from "@/components/LocationSelector";
import {
  calculateRiskLevel,
  getRiskCategory,
} from "@shared/utils/risk-calculation";

const symptomsOptions = [
  "Diarrhea",
  "Vomiting",
  "Fever",
  "Abdominal pain",
  "Skin rashes",
  "Other",
];

export default function CommunityReport() {
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [location, setLocation] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [affectedCount, setAffectedCount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Location validation and coordinates
  const [needsCoordinates, setNeedsCoordinates] = useState(false);
  const [locationValidation, setLocationValidation] = useState<{
    needsCoordinates: boolean;
    reason: string;
    suggestions?: Array<{ name: string; latitude: number; longitude: number }>;
  } | null>(null);
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [isValidatingLocation, setIsValidatingLocation] = useState(false);

  // Calculate real-time risk level
  const currentRiskLevel =
    affectedCount > 0 ? calculateRiskLevel(affectedCount, symptoms) : 0;
  const riskCategory = getRiskCategory(currentRiskLevel);

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

  const toggleSymptom = (symptom: string) => {
    setSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("Submitting report and calculating risk...");

    try {
      const submitData: any = {
        date,
        location,
        symptoms,
        affectedCount,
        notes,
      };

      // Include coordinates if they are provided
      if (needsCoordinates && latitude && longitude) {
        submitData.latitude = parseFloat(latitude);
        submitData.longitude = parseFloat(longitude);
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to submit");
      }

      setStatus(
        responseData.message ||
          "Report submitted successfully and added to risk analytics!",
      );

      // Reset form
      setLocation("");
      setSymptoms([]);
      setAffectedCount(0);
      setNotes("");
      setLatitude("");
      setLongitude("");
      setLocationValidation(null);
      setNeedsCoordinates(false);

      // Clear status after 5 seconds
      setTimeout(() => setStatus(""), 5000);
    } catch (err: any) {
      setStatus(err.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">
        Community Reporting
      </h1>
      <p className="text-foreground/70 mb-6">
        Help health officials by submitting observations. Data is stored
        securely.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-4 md:gap-6">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2"
            required
          />
        </div>
        <div className="grid gap-2">
          <LocationSelector
            location={location}
            setLocation={setLocation}
            latitude={latitude}
            setLatitude={setLatitude}
            longitude={longitude}
            setLongitude={setLongitude}
            needsCoordinates={needsCoordinates}
            setNeedsCoordinates={setNeedsCoordinates}
            locationValidation={locationValidation}
            isValidatingLocation={isValidatingLocation}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Symptoms</label>
          <div className="flex flex-wrap gap-2">
            {symptomsOptions.map((opt) => (
              <button
                type="button"
                key={opt}
                onClick={() => toggleSymptom(opt)}
                className={
                  "px-3 py-1.5 rounded-full border text-sm " +
                  (symptoms.includes(opt)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-secondary-foreground")
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">
            Number of Affected Individuals
          </label>
          <input
            type="number"
            min={0}
            value={affectedCount}
            onChange={(e) =>
              setAffectedCount(parseInt(e.target.value || "0", 10))
            }
            className="w-full rounded-md border bg-background px-3 py-2"
            required
          />

          {/* Real-time risk indicator */}
          {affectedCount > 0 && (
            <div className="mt-2 p-3 rounded-lg border-l-4 bg-gray-50 border-l-blue-500">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Calculated Risk Level:
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-bold text-white ${
                      currentRiskLevel >= 70
                        ? "bg-red-500"
                        : currentRiskLevel >= 40
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                  >
                    {currentRiskLevel}%
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      currentRiskLevel >= 70
                        ? "text-red-600"
                        : currentRiskLevel >= 40
                          ? "text-yellow-600"
                          : "text-green-600"
                    }`}
                  >
                    {riskCategory}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                This data will be automatically added to the risk analytics map
              </p>
            </div>
          )}
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Notes</label>
          <textarea
            placeholder="Additional details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 min-h-28"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isSubmitting} className="px-6">
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
          <span
            className={`text-sm ${
              status.includes("successfully")
                ? "text-green-600"
                : status.includes("failed") || status.includes("error")
                  ? "text-red-600"
                  : "text-foreground/60"
            }`}
          >
            {status}
          </span>
        </div>
      </form>
    </section>
  );
}
