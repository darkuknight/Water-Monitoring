import { TestingKit } from '@shared/types/testing-kits';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface KitSelectorProps {
  kits: TestingKit[];
  selectedKit: TestingKit | null;
  onSelectKit: (kit: TestingKit) => void;
}

export default function KitSelector({ kits, selectedKit, onSelectKit }: KitSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Select a Water Testing Kit</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {kits.map((kit, index) => (
          <Card 
            key={index} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedKit?.kit === kit.kit ? 'ring-2 ring-blue-500 border-blue-500' : ''
            }`}
            onClick={() => onSelectKit(kit)}
          >
            <CardHeader>
              <CardTitle className="text-lg">{kit.kit}</CardTitle>
              <CardDescription>{kit.result_type}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Parameters:</span>
                  <Badge variant="secondary">{kit.parameters.length}</Badge>
                </div>
                <div className="text-xs text-gray-500">
                  {kit.parameters.slice(0, 3).map(p => p.name).join(', ')}
                  {kit.parameters.length > 3 && ` +${kit.parameters.length - 3} more`}
                </div>
              </div>
              {selectedKit?.kit === kit.kit && (
                <Button className="w-full mt-4" size="sm">
                  Selected ✓
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}