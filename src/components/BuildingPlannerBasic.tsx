import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, FabricImage } from 'fabric';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Upload, Hammer, Zap, ChevronDown, Undo, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BuildingPlannerBasic() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoing, setIsUndoing] = useState(false);

  // Save canvas state for undo functionality
  const saveCanvasState = (canvas: FabricCanvas) => {
    // Avoid saving state during undo operation
    if (isUndoing) return;
    
    const currentState = JSON.stringify(canvas.toJSON());
    const newHistory = canvasHistory.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    
    // Limit history to 20 states
    if (newHistory.length > 20) {
      newHistory.shift();
    } else {
      setHistoryIndex(prev => prev + 1);
    }
    
    setCanvasHistory(newHistory);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    // Save initial state
    const initialState = JSON.stringify(canvas.toJSON());
    setCanvasHistory([initialState]);
    setHistoryIndex(0);

    // Add event listener for object modifications
    const handleCanvasChange = () => {
      if (!isUndoing) {
        const currentState = JSON.stringify(canvas.toJSON());
        setCanvasHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push(currentState);
          
          // Limit history to 20 states
          if (newHistory.length > 20) {
            newHistory.shift();
            return newHistory;
          }
          
          setHistoryIndex((prevIndex) => prevIndex + 1);
          return newHistory;
        });
      }
    };

    canvas.on('object:added', handleCanvasChange);
    canvas.on('object:removed', handleCanvasChange);
    canvas.on('object:modified', handleCanvasChange);

    setFabricCanvas(canvas);
    toast("Canvas klar! Last opp plantegning for å starte");

    return () => {
      canvas.dispose();
    };
  }, [isUndoing, historyIndex]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fabricCanvas) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const fabricImg = new FabricImage(img, {
          left: 0,
          top: 0,
          scaleX: Math.min(800 / img.width, 600 / img.height),
          scaleY: Math.min(800 / img.width, 600 / img.height),
          selectable: false,
          evented: false,
        });
        
        // Clear canvas and add image as background
        fabricCanvas.clear();
        fabricCanvas.add(fabricImg);
        fabricCanvas.renderAll();
        toast("Plantegning lastet opp!");
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Tømrer verktøy
  const addWall = () => {
    if (!fabricCanvas) return;
    const rect = new Rect({
      left: 100,
      top: 100,
      fill: 'rgba(139, 69, 19, 0.7)',
      width: 150,
      height: 20,
    });
    fabricCanvas.add(rect);
    toast("Vegg lagt til!");
  };

  const addRoom = () => {
    if (!fabricCanvas) return;
    const rect = new Rect({
      left: 150,
      top: 150,
      fill: 'transparent',
      stroke: 'brown',
      strokeWidth: 3,
      width: 120,
      height: 100,
    });
    fabricCanvas.add(rect);
    toast("Rom markert!");
  };

  const addWindow = () => {
    if (!fabricCanvas) return;
    const rect = new Rect({
      left: 200,
      top: 200,
      fill: 'lightblue',
      stroke: 'blue',
      strokeWidth: 2,
      width: 60,
      height: 10,
    });
    fabricCanvas.add(rect);
    toast("Vindu lagt til!");
  };

  // Elektriker verktøy
  const addOutlet = () => {
    if (!fabricCanvas) return;
    const circle = new Circle({
      left: 250,
      top: 250,
      fill: 'yellow',
      stroke: 'orange',
      strokeWidth: 2,
      radius: 8,
    });
    fabricCanvas.add(circle);
    toast("Stikkontakt lagt til!");
  };

  const addLightSwitch = () => {
    if (!fabricCanvas) return;
    const rect = new Rect({
      left: 300,
      top: 300,
      fill: 'lightgray',
      stroke: 'black',
      strokeWidth: 1,
      width: 15,
      height: 25,
    });
    fabricCanvas.add(rect);
    toast("Lysbryter lagt til!");
  };

  const addLight = () => {
    if (!fabricCanvas) return;
    const circle = new Circle({
      left: 350,
      top: 350,
      fill: 'lightyellow',
      stroke: 'gold',
      strokeWidth: 2,
      radius: 12,
    });
    fabricCanvas.add(circle);
    toast("Lysarmatur lagt til!");
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    toast("Canvas tømt!");
  };

  // Undo functionality
  const undoLastAction = () => {
    if (!fabricCanvas || historyIndex <= 0) {
      toast("Ingen handlinger å angre");
      return;
    }

    setIsUndoing(true);
    const previousState = canvasHistory[historyIndex - 1];
    
    fabricCanvas.loadFromJSON(previousState, () => {
      fabricCanvas.renderAll();
      setHistoryIndex(prev => prev - 1);
      setIsUndoing(false);
      toast("Handling angret!");
    });
  };

  // Delete selected objects
  const deleteSelected = () => {
    if (!fabricCanvas) return;

    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length === 0) {
      toast("Velg objekter for å slette dem");
      return;
    }

    activeObjects.forEach(obj => {
      fabricCanvas.remove(obj);
    });
    
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
    toast(`${activeObjects.length} objekt(er) slettet!`);
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Byggeplanlegger</CardTitle>
          <CardDescription>Last opp plantegning og planlegg renovering</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="blueprint" className="text-sm font-medium">
                Last opp plantegning
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="blueprint"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Last opp plantegning
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Hammer className="h-4 w-4" />
                    Tømrer
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={addWall}>
                    Legg til vegg
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={addRoom}>
                    Marker rom
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={addWindow}>
                    Legg til vindu
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Elektriker
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={addOutlet}>
                    Stikkontakt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={addLightSwitch}>
                    Lysbryter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={addLight}>
                    Lysarmatur
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={clearCanvas} variant="destructive">
                Tøm canvas
              </Button>
              
              <Button 
                onClick={undoLastAction} 
                variant="outline"
                disabled={historyIndex <= 0}
                className="flex items-center gap-2"
              >
                <Undo className="h-4 w-4" />
                Angre
              </Button>
              
              <Button 
                onClick={deleteSelected} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Slett valgte
              </Button>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <canvas ref={canvasRef} className="max-w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}