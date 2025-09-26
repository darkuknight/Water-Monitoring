import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Plus, AlertCircle } from "lucide-react";
import LocationSelector from "./LocationSelector";

interface UserMarkerFormProps {
  onAddMarker: (markerData: {
    location: string;
    latitude?: number;
    longitude?: number;
    title: string;
    description: string;
    category: string;
    riskPercentage: number;
  }) => Promise<void>;
  onSuccess?: () => void;
}

const MARKER_CATEGORIES = [
  { value: "infrastructure", label: "Infrastructure Issue" },
  { value: "environmental", label: "Environmental Concern" },
  { value: "health", label: "Health Related" },
  { value: "water-source", label: "Water Source" },
  { value: "pollution", label: "Pollution Report" },
  { value: "maintenance", label: "Maintenance Needed" },
  { value: "other", label: "Other" },
];

const RISK_LEVELS = [
  { value: 10, label: "Very Low (10%)", color: "text-green-600" },
  { value: 25, label: "Low (25%)", color: "text-green-500" },
  { value: 40, label: "Medium (40%)", color: "text-yellow-600" },
  { value: 55, label: "Medium-High (55%)", color: "text-orange-500" },
  { value: 70, label: "High (70%)", color: "text-red-500" },
  { value: 85, label: "Very High (85%)", color: "text-red-600" },
];

export default function UserMarkerForm({
  onAddMarker,
  onSuccess,
}: UserMarkerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [riskPercentage, setRiskPercentage] = useState<number>(25);

  // Location fields (using same pattern as LocationSelector)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !location.trim() || !category) {
      setStatus("Please fill in all required fields");
      return;
    }

    if (needsCoordinates && (!latitude || !longitude)) {
      setStatus("Please provide coordinates for this location");
      return;
    }

    setIsSubmitting(true);
    setStatus("Adding marker...");

    try {
      const markerData = {
        location,
        title,
        description,
        category,
        riskPercentage,
        ...(needsCoordinates && latitude && longitude
          ? {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
            }
          : {}),
      };

      await onAddMarker(markerData);

      // Reset form
      setTitle("");
      setDescription("");
      setCategory("");
      setRiskPercentage(25);
      setLocation("");
      setLatitude("");
      setLongitude("");
      setNeedsCoordinates(false);
      setLocationValidation(null);
      setShowForm(false);

      setStatus("✓ Marker added successfully!");
      onSuccess?.();

      // Clear status after 3 seconds
      setTimeout(() => setStatus(""), 3000);
    } catch (error: any) {
      setStatus("Failed to add marker: " + (error.message || "Unknown error"));
      setTimeout(() => setStatus(""), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRiskLevel = RISK_LEVELS.find((r) => r.value === riskPercentage);

  if (!showForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Custom Marker
          </CardTitle>
          <CardDescription>
            Add your own markers to track water quality issues, infrastructure
            problems, or other concerns in your area.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowForm(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add New Marker
          </Button>

          {status && (
            <Alert
              className={`mt-4 ${status.includes("✓") ? "border-green-200 bg-green-50" : status.includes("Failed") ? "border-red-200 bg-red-50" : ""}`}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Add Custom Marker
        </CardTitle>
        <CardDescription>
          Provide details about the issue or location you want to mark
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Location Input */}
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
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

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Brief title for this marker"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {MARKER_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Risk Level */}
          <div className="space-y-2">
            <Label htmlFor="risk">Risk Level</Label>
            <Select
              value={riskPercentage.toString()}
              onValueChange={(value) => setRiskPercentage(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RISK_LEVELS.map((risk) => (
                  <SelectItem key={risk.value} value={risk.value.toString()}>
                    <span className={risk.color}>{risk.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRiskLevel && (
              <p className={`text-sm ${selectedRiskLevel.color}`}>
                Selected: {selectedRiskLevel.label}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of the issue or observation"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Status */}
          {status && (
            <Alert
              className={
                status.includes("✓")
                  ? "border-green-200 bg-green-50"
                  : status.includes("Failed")
                    ? "border-red-200 bg-red-50"
                    : ""
              }
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{status}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Adding..." : "Add Marker"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setStatus("");
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
