import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Circle, Rect } from 'fabric';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function BuildingPlannerBasic() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    setFabricCanvas(canvas);
    toast("Canvas ready! Testing Fabric.js");

    return () => {
      canvas.dispose();
    };
  }, []);

  const addRectangle = () => {
    if (!fabricCanvas) return;
    
    const rect = new Rect({
      left: 100,
      top: 100,
      fill: 'blue',
      width: 100,
      height: 100,
    });
    fabricCanvas.add(rect);
    toast("Rectangle added!");
  };

  const addCircle = () => {
    if (!fabricCanvas) return;
    
    const circle = new Circle({
      left: 200,
      top: 200,
      fill: 'red',
      radius: 50,
    });
    fabricCanvas.add(circle);
    toast("Circle added!");
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    toast("Canvas cleared!");
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Byggeplanlegger - Fabric.js Test</CardTitle>
          <CardDescription>Testing Fabric.js canvas step by step</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={addRectangle} variant="outline">
              Add Rectangle
            </Button>
            <Button onClick={addCircle} variant="outline">
              Add Circle
            </Button>
            <Button onClick={clearCanvas} variant="destructive">
              Clear Canvas
            </Button>
          </div>
          <div className="border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <canvas ref={canvasRef} className="max-w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}