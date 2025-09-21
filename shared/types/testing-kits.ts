export interface TestParameter {
  name: string;
  critical_range: string;
  pathogen_risk: string;
  associated_diseases: string[];
  confidence_score: number;
}

export interface TestingKit {
  kit: string;
  result_type: string;
  parameters: TestParameter[];
}

export interface ParameterValue {
  name: string;
  value: string | number;
  unit?: string;
}

export interface TestResult {
  parameter: TestParameter;
  value: string | number;
  isInCriticalRange: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface KitTestResult {
  kit: TestingKit;
  results: TestResult[];
  overallRisk: 'low' | 'medium' | 'high';
  confidence: number;
}