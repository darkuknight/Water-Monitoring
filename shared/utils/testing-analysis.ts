import { TestParameter, TestResult, KitTestResult, TestingKit, ParameterValue } from '../types/testing-kits';

export function parseNumericValue(value: string | number): number | null {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

export function isInCriticalRange(parameter: TestParameter, value: string | number): boolean {
  const { name, critical_range } = parameter;
  
  // Handle presence/absence tests
  if (critical_range.toLowerCase().includes('presence')) {
    const val = value.toString().toLowerCase();
    return val === 'present' || val === 'positive' || val === 'yes' || val === '1' || val === 'true';
  }
  
  // Handle numeric ranges
  const numValue = parseNumericValue(value);
  if (numValue === null) return false;
  
  // Parse critical range patterns
  if (critical_range.includes('<') && critical_range.includes('>')) {
    // Handle ranges like "<6.5 or >8.5"
    const matches = critical_range.match(/<([0-9.]+)|>([0-9.]+)/g);
    if (matches) {
      return matches.some(match => {
        if (match.startsWith('<')) {
          const threshold = parseFloat(match.substring(1));
          return numValue < threshold;
        } else if (match.startsWith('>')) {
          const threshold = parseFloat(match.substring(1));
          return numValue > threshold;
        }
        return false;
      });
    }
  } else if (critical_range.startsWith('>')) {
    const threshold = parseFloat(critical_range.substring(1).split(' ')[0]);
    return numValue > threshold;
  } else if (critical_range.startsWith('<')) {
    const threshold = parseFloat(critical_range.substring(1).split(' ')[0]);
    return numValue < threshold;
  }
  
  return false;
}

export function getRiskLevel(parameter: TestParameter, value: string | number): 'low' | 'medium' | 'high' {
  const isInCritical = isInCriticalRange(parameter, value);
  const confidence = parameter.confidence_score;
  
  if (!isInCritical) return 'low';
  
  // High confidence and in critical range = high risk
  if (confidence >= 0.8) return 'high';
  // Medium confidence and in critical range = medium risk
  if (confidence >= 0.5) return 'medium';
  // Low confidence but in critical range = medium risk
  return 'medium';
}

export function analyzeTestResults(kit: TestingKit, parameterValues: ParameterValue[]): KitTestResult {
  const results: TestResult[] = [];
  let totalConfidence = 0;
  let highRiskCount = 0;
  let mediumRiskCount = 0;
  
  kit.parameters.forEach(parameter => {
    const paramValue = parameterValues.find(pv => pv.name === parameter.name);
    if (paramValue) {
      const isInCritical = isInCriticalRange(parameter, paramValue.value);
      const riskLevel = getRiskLevel(parameter, paramValue.value);
      
      results.push({
        parameter,
        value: paramValue.value,
        isInCriticalRange: isInCritical,
        riskLevel,
      });
      
      totalConfidence += parameter.confidence_score;
      if (riskLevel === 'high') highRiskCount++;
      else if (riskLevel === 'medium') mediumRiskCount++;
    }
  });
  
  // Calculate overall risk
  let overallRisk: 'low' | 'medium' | 'high' = 'low';
  if (highRiskCount > 0) {
    overallRisk = 'high';
  } else if (mediumRiskCount > 0) {
    overallRisk = 'medium';
  }
  
  const averageConfidence = results.length > 0 ? totalConfidence / results.length : 0;
  
  return {
    kit,
    results,
    overallRisk,
    confidence: averageConfidence,
  };
}