// Risk calculation utility functions

/**
 * Calculate risk percentage based on number of affected individuals
 * @param affectedCount Number of affected individuals
 * @param symptoms Array of symptoms reported
 * @returns Risk percentage (0-100)
 */
export function calculateRiskLevel(
  affectedCount: number,
  symptoms: string[],
): number {
  let baseRisk = 0;

  // Base risk calculation based on affected count
  // Adjusted for city populations where large numbers are more common
  if (affectedCount <= 1) {
    baseRisk = 10; // Low risk for single individual
  } else if (affectedCount <= 5) {
    baseRisk = 25; // Medium-low risk for small groups
  } else if (affectedCount <= 15) {
    baseRisk = 40; // Medium risk for moderate groups
  } else if (affectedCount <= 30) {
    baseRisk = 55; // Medium-high risk for large groups
  } else if (affectedCount <= 50) {
    baseRisk = 65; // High risk for very large groups
  } else if (affectedCount <= 100) {
    baseRisk = 75; // Very high risk for extremely large groups
  } else {
    baseRisk = 83; // Capped at 83% for 100+ people to account for city populations
  }

  // Risk multipliers based on symptoms severity
  const severityMultipliers: Record<string, number> = {
    Diarrhea: 1.2,
    Vomiting: 1.3,
    Fever: 1.4,
    "Abdominal pain": 1.1,
    "Skin rashes": 1.15,
    Other: 1.1,
  };

  // Calculate symptom multiplier
  let symptomMultiplier = 1.0;
  symptoms.forEach((symptom) => {
    if (severityMultipliers[symptom]) {
      symptomMultiplier += (severityMultipliers[symptom] - 1) * 0.5; // Apply 50% of the multiplier
    }
  });

  // Apply symptom multiplier but cap at 100%
  const finalRisk = Math.min(100, Math.round(baseRisk * symptomMultiplier));

  return finalRisk;
}

/**
 * Get coordinates for a location using geocoding
 * @param location Location name or address
 * @returns Promise with coordinates {latitude, longitude} or null if not found
 */
export async function getLocationCoordinates(
  location: string,
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    // Clean the location name by removing numbers and extra whitespace
    const cleanedLocation = location
      .replace(/\d+/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // If the cleaned location is empty, use original location
    const searchLocation = cleanedLocation || location;

    // Using OpenStreetMap Nominatim API for geocoding (free, no API key required)
    const encodedLocation = encodeURIComponent(searchLocation);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}&limit=1`,
      {
        headers: {
          "User-Agent": "Water-Monitoring-App/1.0",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Geocoding request failed");
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.warn("Geocoding failed for location:", location, error);
    return null;
  }
}

/**
 * Determine risk level category
 * @param riskPercentage Risk percentage (0-100)
 * @returns Risk category string
 */
export function getRiskCategory(riskPercentage: number): string {
  if (riskPercentage >= 70) return "High Risk";
  if (riskPercentage >= 40) return "Medium Risk";
  return "Low Risk";
}

/**
 * Validate if a location needs manual coordinates input
 * @param location Location name to check
 * @returns Promise with validation result indicating if coordinates are needed
 */
export async function validateLocationNeedsCoordinates(
  location: string,
): Promise<{
  needsCoordinates: boolean;
  reason: string;
  suggestions?: Array<{ name: string; latitude: number; longitude: number }>;
}> {
  try {
    // Clean the location name by removing numbers and extra whitespace
    const cleanedLocation = location
      .replace(/\d+/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // If the cleaned location is empty, use original location
    const searchLocation = cleanedLocation || location;

    // Using OpenStreetMap Nominatim API to check for multiple results
    const encodedLocation = encodeURIComponent(searchLocation);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}&limit=5`,
      {
        headers: {
          "User-Agent": "Water-Monitoring-App/1.0",
        },
      },
    );

    if (!response.ok) {
      return {
        needsCoordinates: true,
        reason: "Unable to validate location - please provide coordinates",
      };
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return {
        needsCoordinates: true,
        reason: "Location not found - please provide coordinates",
      };
    }

    if (data.length > 1) {
      // Multiple locations found - user needs to specify coordinates
      const suggestions = data.slice(0, 3).map((item: any) => ({
        name: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      }));

      return {
        needsCoordinates: true,
        reason: "Multiple locations found with this name",
        suggestions,
      };
    }

    // Single location found - no coordinates needed
    return {
      needsCoordinates: false,
      reason: "Location found successfully",
    };
  } catch (error) {
    console.warn("Location validation failed:", location, error);
    return {
      needsCoordinates: true,
      reason: "Unable to validate location - please provide coordinates",
    };
  }
}

/**
 * Calculate risk percentage based on water test results
 * @param testResults Kit test results object
 * @returns Risk percentage (0-100) based on critical parameters and overall risk
 */
export function calculateWaterTestRisk(testResults: any): number {
  if (!testResults || !testResults.results) {
    return 0;
  }

  const { results, overallRisk, confidence } = testResults;

  // Count critical parameters
  const criticalCount = results.filter((r: any) => r.isInCriticalRange).length;
  const totalParameters = results.length;

  // Base risk calculation based on overall risk level
  let baseRisk = 0;
  switch (overallRisk) {
    case "high":
      baseRisk = 75; // High baseline for dangerous water
      break;
    case "medium":
      baseRisk = 45; // Medium baseline for questionable water
      break;
    case "low":
      baseRisk = 15; // Low baseline for generally safe water
      break;
    default:
      baseRisk = 30; // Default moderate risk
  }

  // Adjust based on percentage of critical parameters
  const criticalRatio =
    totalParameters > 0 ? criticalCount / totalParameters : 0;
  const criticalMultiplier = 1 + criticalRatio * 0.5; // Up to 50% increase for all critical parameters

  // Factor in confidence level (lower confidence = higher risk)
  const confidenceAdjustment = 1 + (1 - confidence) * 0.2; // Up to 20% increase for low confidence

  // Calculate final risk with multipliers, capped at 100%
  const finalRisk = Math.min(
    100,
    Math.round(baseRisk * criticalMultiplier * confidenceAdjustment),
  );

  return finalRisk;
}
