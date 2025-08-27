import React from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BuildingPlannerBasic() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Byggeplanlegger - Basic Test</CardTitle>
          <CardDescription>Testing minimal Konva setup</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Stage width={400} height={300}>
              <Layer>
                <Rect
                  x={50}
                  y={50}
                  width={100}
                  height={100}
                  fill="blue"
                />
              </Layer>
            </Stage>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}