import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BuildingPlannerBasic() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Byggeplanlegger</CardTitle>
          <CardDescription>
            Tegn og planlegg din byggeprosjekt med interaktiv tegning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>BuildingPlannerBasic is loading...</p>
        </CardContent>
      </Card>
    </div>
  );
}