import { useState } from 'react';
import { TestingKit, ParameterValue, KitTestResult } from '@shared/types/testing-kits';
import { testingKits } from '@shared/data/testing-kits';
import { analyzeTestResults } from '@shared/utils/testing-analysis';
import KitSelector from '@/components/testing/KitSelector';
import ParameterInput from '@/components/testing/ParameterInput';
import ResultsDisplay from '@/components/testing/ResultsDisplay';

type TestingStep = 'kit-selection' | 'parameter-input' | 'results';

export default function WaterKits() {
  const [currentStep, setCurrentStep] = useState<TestingStep>('kit-selection');
  const [selectedKit, setSelectedKit] = useState<TestingKit | null>(null);
  const [testResults, setTestResults] = useState<KitTestResult | null>(null);

  const handleKitSelection = (kit: TestingKit) => {
    setSelectedKit(kit);
    setCurrentStep('parameter-input');
  };

  const handleParameterSubmit = (parameterValues: ParameterValue[]) => {
    if (!selectedKit) return;
    
    const results = analyzeTestResults(selectedKit, parameterValues);
    setTestResults(results);
    setCurrentStep('results');
  };

  const handleBackToKitSelection = () => {
    setCurrentStep('kit-selection');
    setSelectedKit(null);
    setTestResults(null);
  };

  const handleBackToParameterInput = () => {
    setCurrentStep('parameter-input');
    setTestResults(null);
  };

  const handleRunNewTest = () => {
    setCurrentStep('parameter-input');
    setTestResults(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {currentStep === 'kit-selection' && (
        <KitSelector
          kits={testingKits}
          selectedKit={selectedKit}
          onSelectKit={handleKitSelection}
        />
      )}

      {currentStep === 'parameter-input' && selectedKit && (
        <ParameterInput
          kit={selectedKit}
          onSubmit={handleParameterSubmit}
          onBack={handleBackToKitSelection}
        />
      )}

      {currentStep === 'results' && testResults && (
        <ResultsDisplay
          results={testResults}
          onRunNewTest={handleRunNewTest}
          onBackToKitSelection={handleBackToKitSelection}
        />
      )}
    </div>
  );
}
