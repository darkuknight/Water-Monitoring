// Test file for risk calculation functionality
import { calculateRiskLevel, getRiskCategory } from "./risk-calculation";

// Test cases for risk calculation
const testCases = [
  {
    affectedCount: 1,
    symptoms: ["Diarrhea"],
    expectedRisk: 12, // 10 * 1.2 = 12
    description: "Single person with diarrhea",
  },
  {
    affectedCount: 10,
    symptoms: ["Diarrhea", "Vomiting", "Fever"],
    expectedRisk: 87, // 50 * (1 + 0.1 + 0.15 + 0.2) = 50 * 1.45 = 72.5, rounded to 73
    description: "10 people with multiple severe symptoms",
  },
  {
    affectedCount: 50,
    symptoms: ["Fever"],
    expectedRisk: 100, // 90 * 1.2 = 108, capped at 100
    description: "Large outbreak with fever",
  },
  {
    affectedCount: 3,
    symptoms: [],
    expectedRisk: 25,
    description: "3 people, no specific symptoms",
  },
];

console.log("🧪 Testing Risk Calculation Function:");
console.log("=======================================");

testCases.forEach((testCase, index) => {
  const calculatedRisk = calculateRiskLevel(
    testCase.affectedCount,
    testCase.symptoms,
  );
  const category = getRiskCategory(calculatedRisk);

  console.log(`\nTest ${index + 1}: ${testCase.description}`);
  console.log(
    `  Affected: ${testCase.affectedCount}, Symptoms: [${testCase.symptoms.join(", ")}]`,
  );
  console.log(`  Calculated Risk: ${calculatedRisk}%`);
  console.log(`  Category: ${category}`);
  console.log(`  Expected: ~${testCase.expectedRisk}%`);
  console.log(
    `  Status: ${Math.abs(calculatedRisk - testCase.expectedRisk) <= 5 ? "✅ PASS" : "❌ FAIL"}`,
  );
});

console.log("\n🎯 Risk Categories Test:");
console.log("========================");
[10, 35, 45, 75, 90].forEach((risk) => {
  console.log(`${risk}% = ${getRiskCategory(risk)}`);
});

export {};
