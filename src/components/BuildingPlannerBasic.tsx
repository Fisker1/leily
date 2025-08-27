import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, FabricImage } from 'fabric';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Hammer, Zap, ChevronDown, Undo, Trash2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface FloorPlan {
  id: string;
  name: string;
  canvas: FabricCanvas | null;
  history: string[];
  historyIndex: number;
  isUndoing: boolean;
}

export default function BuildingPlannerBasic() {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([
    {
      id: '1',
      name: 'Etasje 1',
      canvas: null,
      history: [],
      historyIndex: -1,
      isUndoing: false,
    }
  ]);
  const [activeFloorPlan, setActiveFloorPlan] = useState('1');
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const getCurrentFloorPlan = () =>
    floorPlans.find(fp => fp.id === activeFloorPlan);

  const updateFloorPlan = (id: string, updates: Partial<FloorPlan>) => {
    setFloorPlans(prev => prev.map(fp =>
      fp.id === id ? { ...fp, ...updates } : fp
    ));
  };

  // Initialize canvas for a floor plan
  const initializeCanvas = (floorPlanId: string) => {
    const canvasElement = canvasRefs.current[floorPlanId];
    if (!canvasElement) return;

    const canvas = new FabricCanvas(canvasElement, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    const initialState = JSON.stringify(canvas.toJSON());
    
    updateFloorPlan(floorPlanId, {
      canvas,
      history: [initialState],
      historyIndex: 0,
    });

    // Add event listeners
    const handleCanvasChange = () => {
      const currentFloor = floorPlans.find(fp => fp.id === floorPlanId);
      if (!currentFloor || currentFloor.isUndoing) return;

      const currentState = JSON.stringify(canvas.toJSON());
      const newHistory = currentFloor.history.slice(0, currentFloor.historyIndex + 1);
      newHistory.push(currentState);
      
      if (newHistory.length > 20) {
        newHistory.shift();
      }
      
      updateFloorPlan(floorPlanId, {
        history: newHistory,
        historyIndex: Math.min(currentFloor.historyIndex + 1, 19),
      });
    };

    canvas.on('object:added', handleCanvasChange);
    canvas.on('object:removed', handleCanvasChange);
    canvas.on('object:modified', handleCanvasChange);

    return canvas;
  };

  useEffect(() => {
    floorPlans.forEach(floorPlan => {
      if (!floorPlan.canvas && canvasRefs.current[floorPlan.id]) {
        initializeCanvas(floorPlan.id);
      }
    });
  }, [floorPlans]);

  const addNewFloorPlan = () => {
    const newId = (floorPlans.length + 1).toString();
    const newFloorPlan: FloorPlan = {
      id: newId,
      name: `Etasje ${newId}`,
      canvas: null,
      history: [],
      historyIndex: -1,
      isUndoing: false,
    };
    
    setFloorPlans(prev => [...prev, newFloorPlan]);
    setActiveFloorPlan(newId);
    toast("Ny etasje lagt til!");
  };

  const removeFloorPlan = (id: string) => {
    if (floorPlans.length <= 1) {
      toast("Du må ha minst én etasje");
      return;
    }

    const floorPlan = floorPlans.find(fp => fp.id === id);
    if (floorPlan?.canvas) {
      floorPlan.canvas.dispose();
    }

    setFloorPlans(prev => prev.filter(fp => fp.id !== id));
    
    if (activeFloorPlan === id) {
      setActiveFloorPlan(floorPlans[0].id === id ? floorPlans[1].id : floorPlans[0].id);
    }
    
    toast("Etasje fjernet!");
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, floorPlanId: string) => {
    const file = event.target.files?.[0];
    const floorPlan = getCurrentFloorPlan();
    if (!file || !floorPlan?.canvas) return;

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
        floorPlan.canvas!.clear();
        floorPlan.canvas!.add(fabricImg);
        floorPlan.canvas!.renderAll();
        toast("Plantegning lastet opp!");
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Tool functions for current floor plan
  const addWall = () => {
    const floorPlan = getCurrentFloorPlan();
    if (!floorPlan?.canvas) return;
    
    const rect = new Rect({
      left: 100,
      top: 100,
      fill: 'rgba(139, 69, 19, 0.7)',
      width: 150,
      height: 20,
    });
    floorPlan.canvas.add(rect);
    toast("Vegg lagt til!");
  };

  const addRoom = () => {
    const floorPlan = getCurrentFloorPlan();
    if (!floorPlan?.canvas) return;
    
    const rect = new Rect({
      left: 150,
      top: 150,
      fill: 'transparent',
      stroke: 'brown',
      strokeWidth: 3,
      width: 120,
      height: 100,
    });
    floorPlan.canvas.add(rect);
    toast("Rom markert!");
  };

  const addWindow = () => {
    const floorPlan = getCurrentFloorPlan();
    if (!floorPlan?.canvas) return;
    
    const rect = new Rect({
      left: 200,
      top: 200,
      fill: 'lightblue',
      stroke: 'blue',
      strokeWidth: 2,
      width: 60,
      height: 10,
    });
    floorPlan.canvas.add(rect);
    toast("Vindu lagt til!");
  };

  const addOutlet = () => {
    const floorPlan = getCurrentFloorPlan();
    if (!floorPlan?.canvas) return;
    
    const circle = new Circle({
      left: 250,
      top: 250,
      fill: 'yellow',
      stroke: 'orange',
      strokeWidth: 2,
      radius: 8,
    });
    floorPlan.canvas.add(circle);
    toast("Stikkontakt lagt til!");
  };

  const addLightSwitch = () => {
    const floorPlan = getCurrentFloorPlan();
    if (!floorPlan?.canvas) return;
    
    const rect = new Rect({
      left: 300,
      top: 300,
      fill: 'lightgray',
      stroke: 'black',
      strokeWidth: 1,
      width: 15,
      height: 25,
    });
    floorPlan.canvas.add(rect);
    toast("Lysbryter lagt til!");
  };

  const addLight = () => {
    const floorPlan = getCurrentFloorPlan();
    if (!floorPlan?.canvas) return;
    
    const circle = new Circle({
      left: 350,
      top: 350,
      fill: 'lightyellow',
      stroke: 'gold',
      strokeWidth: 2,
      radius: 12,
    });
    floorPlan.canvas.add(circle);
    toast("Lysarmatur lagt til!");
  };

  const undoLastAction = () => {
    const floorPlan = getCurrentFloorPlan();
    if (!floorPlan?.canvas || floorPlan.historyIndex <= 0) {
      toast("Ingen handlinger å angre");
      return;
    }

    updateFloorPlan(floorPlan.id, { isUndoing: true });
    const previousState = floorPlan.history[floorPlan.historyIndex - 1];
    
    floorPlan.canvas.loadFromJSON(previousState, () => {
      floorPlan.canvas!.renderAll();
      updateFloorPlan(floorPlan.id, {
        historyIndex: floorPlan.historyIndex - 1,
        isUndoing: false,
      });
      toast("Handling angret!");
    });
  };

  const deleteSelected = () => {
    const floorPlan = getCurrentFloorPlan();
    if (!floorPlan?.canvas) return;

    const activeObjects = floorPlan.canvas.getActiveObjects();
    if (activeObjects.length === 0) {
      toast("Velg objekter for å slette dem");
      return;
    }

    activeObjects.forEach(obj => {
      floorPlan.canvas!.remove(obj);
    });
    
    floorPlan.canvas.discardActiveObject();
    floorPlan.canvas.renderAll();
    toast(`${activeObjects.length} objekt(er) slettet!`);
  };

  const clearCanvas = () => {
    const floorPlan = getCurrentFloorPlan();
    if (!floorPlan?.canvas) return;
    
    floorPlan.canvas.clear();
    floorPlan.canvas.backgroundColor = "#ffffff";
    floorPlan.canvas.renderAll();
    toast("Canvas tømt!");
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Byggeplanlegger</CardTitle>
          <CardDescription>Last opp plantegning og planlegg renovering</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeFloorPlan} onValueChange={setActiveFloorPlan} className="w-full">
            <div className="flex items-center justify-between">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
                {floorPlans.map((floorPlan) => (
                  <TabsTrigger key={floorPlan.id} value={floorPlan.id} className="relative group">
                    {floorPlan.name}
                    {floorPlans.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute -top-2 -right-2 h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFloorPlan(floorPlan.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </TabsTrigger>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addNewFloorPlan}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Ny etasje
                </Button>
              </TabsList>
            </div>

            {floorPlans.map((floorPlan) => (
              <TabsContent key={floorPlan.id} value={floorPlan.id} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`blueprint-${floorPlan.id}`} className="text-sm font-medium">
                      Last opp plantegning for {floorPlan.name}
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id={`blueprint-${floorPlan.id}`}
                        ref={(el) => (fileInputRefs.current[floorPlan.id] = el)}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, floorPlan.id)}
                        className="hidden"
                      />
                      <Button 
                        onClick={() => fileInputRefs.current[floorPlan.id]?.click()}
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
                      disabled={!getCurrentFloorPlan() || getCurrentFloorPlan()!.historyIndex <= 0}
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
                  <canvas 
                    ref={(el) => (canvasRefs.current[floorPlan.id] = el)} 
                    className="max-w-full" 
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}