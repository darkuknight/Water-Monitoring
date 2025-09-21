import { useState } from 'react';
import { TestingKit, ParameterValue } from '@shared/types/testing-kits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ParameterInputProps {
  kit: TestingKit;
  onSubmit: (values: ParameterValue[]) => void;
  onBack: () => void;
}

export default function ParameterInput({ kit, onSubmit, onBack }: ParameterInputProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleValueChange = (parameterName: string, value: string) => {
    setValues(prev => ({ ...prev, [parameterName]: value }));
    // Clear error when user starts typing
    if (errors[parameterName]) {
      setErrors(prev => ({ ...prev, [parameterName]: '' }));
    }
  };

  const validateAndSubmit = () => {
    const newErrors: Record<string, string> = {};
    const parameterValues: ParameterValue[] = [];

    kit.parameters.forEach(parameter => {
      const value = values[parameter.name];
      if (!value || value.trim() === '') {
        newErrors[parameter.name] = 'This field is required';
        return;
      }

      // For numeric parameters, validate the input
      if (!parameter.critical_range.toLowerCase().includes('presence')) {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          newErrors[parameter.name] = 'Please enter a valid number';
          return;
        }
        parameterValues.push({
          name: parameter.name,
          value: numValue,
        });
      } else {
        // For presence/absence parameters
        parameterValues.push({
          name: parameter.name,
          value: value,
        });
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(parameterValues);
  };

  const getInputType = (parameter: any) => {
    if (parameter.critical_range.toLowerCase().includes('presence')) {
      return 'select';
    }
    return 'number';
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{kit.kit}</h2>
          <p className="text-gray-600">{kit.result_type}</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          ← Back to Kit Selection
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Enter the test values for each parameter. The system will analyze the results and provide risk assessments.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {kit.parameters.map((parameter, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{parameter.name}</CardTitle>
                  <CardDescription className="mt-1">
                    Critical range: <span className="font-medium text-red-600">{parameter.critical_range}</span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    Confidence: {Math.round(parameter.confidence_score * 100)}%
                  </Badge>
                  <div 
                    className={`w-3 h-3 rounded-full ${getConfidenceColor(parameter.confidence_score)}`}
                    title={`Confidence: ${Math.round(parameter.confidence_score * 100)}%`}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={parameter.name}>Test Result</Label>
                {getInputType(parameter) === 'select' ? (
                  <Select 
                    value={values[parameter.name] || ''} 
                    onValueChange={(value) => handleValueChange(parameter.name, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select result" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="absent">Absent/Negative</SelectItem>
                      <SelectItem value="present">Present/Positive</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={parameter.name}
                    type="number"
                    step="0.01"
                    placeholder="Enter value"
                    value={values[parameter.name] || ''}
                    onChange={(e) => handleValueChange(parameter.name, e.target.value)}
                    className={errors[parameter.name] ? 'border-red-500' : ''}
                  />
                )}
                {errors[parameter.name] && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors[parameter.name]}
                  </p>
                )}
              </div>
              
              <div className="text-sm space-y-1">
                <p><strong>Risk:</strong> {parameter.pathogen_risk}</p>
                <p><strong>Associated diseases:</strong> {parameter.associated_diseases.join(', ')}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={validateAndSubmit} size="lg" className="px-8">
          Analyze Results →
        </Button>
      </div>
    </div>
  );
}