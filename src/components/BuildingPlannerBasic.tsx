import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, FabricImage, Path } from 'fabric';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Hammer, Zap, ChevronDown, Undo, Trash2, Plus, X, Square, PenTool } from 'lucide-react';
import { toast } from 'sonner';

interface Material {
  id: string;
  name: string;
  pricePerM2: number;
  unit: 'm²' | 'm';
}

const materials: Material[] = [
  { id: 'gips', name: 'Gipsplate', pricePerM2: 150, unit: 'm²' },
  { id: 'osb', name: 'OSB plate', pricePerM2: 120, unit: 'm²' },
  { id: 'mdf', name: 'MDF plate', pricePerM2: 180, unit: 'm²' },
  { id: 'tre', name: 'Trevegg', pricePerM2: 250, unit: 'm²' },
];

interface FloorPlan {
  id: string;
  name: string;
  canvas: FabricCanvas | null;
  history: string[];
  historyIndex: number;
  isUndoing: boolean;
  drawingMode: 'select' | 'area' | 'wall';
  selectedObjects: any[];
  isEditingName: boolean;
}

interface MaterialSelection {
  objectId: string;
  material: Material;
  area: number;
  cost: number;
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
      drawingMode: 'select',
      selectedObjects: [],
      isEditingName: false,
    }
  ]);
  const [activeFloorPlan, setActiveFloorPlan] = useState('1');
  const [materialSelections, setMaterialSelections] = useState<MaterialSelection[]>([]);
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  const [pendingObject, setPendingObject] = useState<any>(null);
  const [selectedToolCategory, setSelectedToolCategory] = useState<'none' | 'carpenter' | 'electrician'>('none');
  const [pendingTool, setPendingTool] = useState<string | null>(null);
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

    // Handle area selection and wall drawing completion
    canvas.on('path:created', (e) => {
      const path = e.path;
      setPendingObject(path);
      setShowMaterialDialog(true);
    });

    canvas.on('mouse:down', (e) => {
      const currentFloor = floorPlans.find(fp => fp.id === floorPlanId);
      if (!currentFloor || !pendingTool || currentFloor.drawingMode === 'wall') return;

      const pointer = canvas.getPointer(e.e);
      console.log('Mouse click at:', pointer); // Debug log
      
      // Create object based on pending tool
      if (pendingTool === 'outlet') {
        const circle = new Circle({
          left: pointer.x,
          top: pointer.y,
          fill: 'yellow',
          stroke: 'orange',
          strokeWidth: 2,
          radius: 8,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(circle);
        canvas.renderAll();
        toast("Stikkontakt lagt til!");
        setPendingTool(null);
      } else if (pendingTool === 'lightSwitch') {
        const rect = new Rect({
          left: pointer.x,
          top: pointer.y,
          fill: 'lightgray',
          stroke: 'black',
          strokeWidth: 1,
          width: 15,
          height: 25,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(rect);
        canvas.renderAll();
        toast("Lysbryter lagt til!");
        setPendingTool(null);
      } else if (pendingTool === 'light') {
        const circle = new Circle({
          left: pointer.x,
          top: pointer.y,
          fill: 'lightyellow',
          stroke: 'gold',
          strokeWidth: 2,
          radius: 12,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(circle);
        canvas.renderAll();
        toast("Lysarmatur lagt til!");
        setPendingTool(null);
      } else if (pendingTool === 'area') {
        const rect = new Rect({
          left: pointer.x,
          top: pointer.y,
          fill: 'rgba(139, 69, 19, 0.3)',
          stroke: 'brown',
          strokeWidth: 2,
          width: 150,
          height: 100,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(rect);
        canvas.renderAll();
        
        // Show material dialog for area
        setPendingObject(rect);
        setShowMaterialDialog(true);
        setPendingTool(null);
        toast("Område markert - velg materiale");
      }
    });

    canvas.on('mouse:up', (e) => {
      const currentFloor = floorPlans.find(fp => fp.id === floorPlanId);
      if (currentFloor?.drawingMode === 'area' && e.e.type === 'mouseup') {
        // Handle area selection completion
        const pointer = canvas.getPointer(e.e);
        // This would need more complex implementation for actual area selection
      }
    });

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
      drawingMode: 'select',
      selectedObjects: [],
      isEditingName: false,
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

  // Drawing mode functions
  const setDrawingMode = (mode: 'select' | 'area' | 'wall') => {
    const floorPlan = getCurrentFloorPlan();
    if (!floorPlan?.canvas) {
      toast("Canvas ikke klar enda, prøv igjen");
      return;
    }

    updateFloorPlan(floorPlan.id, { drawingMode: mode });
    
    if (mode === 'wall') {
      floorPlan.canvas.isDrawingMode = true;
      if (floorPlan.canvas.freeDrawingBrush) {
        floorPlan.canvas.freeDrawingBrush.color = 'brown';
        floorPlan.canvas.freeDrawingBrush.width = 8;
      }
      toast("Tegn vegger med mus/finger");
    } else {
      floorPlan.canvas.isDrawingMode = false;
      if (mode === 'area') {
        toast("Klikk og dra for å velge areal");
      } else {
        toast("Valgmodus aktivert");
      }
    }
  };

  const selectArea = () => {
    setSelectedToolCategory('carpenter');
    setPendingTool('area');
    toast("Klikk på lerretet for å plassere område");
  };

  const drawWalls = () => {
    setSelectedToolCategory('carpenter');
    setDrawingMode('wall');
  };

  // Floor plan name editing
  const startEditingName = (id: string) => {
    updateFloorPlan(id, { isEditingName: true });
  };

  const saveFloorPlanName = (id: string, newName: string) => {
    updateFloorPlan(id, { name: newName, isEditingName: false });
    toast("Etasjenavn oppdatert!");
  };

  const addOutlet = () => {
    setSelectedToolCategory('electrician');
    setPendingTool('outlet');
    toast("Klikk på lerretet for å plassere stikkontakt");
  };

  const addLightSwitch = () => {
    setSelectedToolCategory('electrician');
    setPendingTool('lightSwitch');
    toast("Klikk på lerretet for å plassere lysbryter");
  };

  const addLight = () => {
    setSelectedToolCategory('electrician');
    setPendingTool('light');
    toast("Klikk på lerretet for å plassere lysarmatur");
  };

  // Material selection functions
  const handleMaterialSelection = (materialId: string) => {
    if (!pendingObject) return;

    const material = materials.find(m => m.id === materialId);
    if (!material) return;

    // Calculate area for the object
    let area = 0;
    if (pendingObject.type === 'rect') {
      area = (pendingObject.width * pendingObject.scaleX) * (pendingObject.height * pendingObject.scaleY) / 10000; // Convert to m²
    } else if (pendingObject.type === 'path') {
      // Estimate area for drawn paths (simplified calculation)
      area = pendingObject.path?.length * 0.01 || 1; // Rough estimate
    }

    const cost = area * material.pricePerM2;
    
    const selection: MaterialSelection = {
      objectId: pendingObject.id || Date.now().toString(),
      material,
      area,
      cost,
    };

    setMaterialSelections(prev => [...prev, selection]);
    setShowMaterialDialog(false);
    setPendingObject(null);
    
    toast(`${material.name} valgt - Areal: ${area.toFixed(2)}m², Kostnad: ${cost.toFixed(0)}kr`);
  };

  // Quick material selection for carpenter work
  const selectAreaWithMaterial = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;

    // Create a sample area
    const floorPlan = getCurrentFloorPlan();
    if (!floorPlan?.canvas) return;

    const rect = new Rect({
      left: 100,
      top: 100,
      fill: 'rgba(139, 69, 19, 0.3)',
      stroke: material.id === 'gips' ? 'blue' : 'orange',
      strokeWidth: 2,
      width: 200,
      height: 150,
    });

    floorPlan.canvas.add(rect);

    // Calculate area and cost
    const area = (200 * 150) / 10000; // Convert to m²
    const cost = area * material.pricePerM2;
    
    const selection: MaterialSelection = {
      objectId: Date.now().toString(),
      material,
      area,
      cost,
    };

    setMaterialSelections(prev => [...prev, selection]);
    toast(`${material.name} område lagt til - ${area.toFixed(2)}m², ${cost.toFixed(0)}kr`);
  };

  const getTotalCost = () => {
    return materialSelections.reduce((total, selection) => total + selection.cost, 0);
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
                    {floorPlan.isEditingName ? (
                      <Input
                        defaultValue={floorPlan.name}
                        className="h-6 text-xs p-1 w-20"
                        onBlur={(e) => saveFloorPlanName(floorPlan.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveFloorPlanName(floorPlan.id, e.currentTarget.value);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span 
                        onDoubleClick={() => startEditingName(floorPlan.id)}
                        className="cursor-text"
                      >
                        {floorPlan.name}
                      </span>
                    )}
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
                        <Button 
                          variant={selectedToolCategory === 'carpenter' ? 'default' : 'outline'} 
                          className="flex items-center gap-2"
                          onClick={() => setSelectedToolCategory(selectedToolCategory === 'carpenter' ? 'none' : 'carpenter')}
                        >
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
                        <DropdownMenuItem onClick={selectArea}>
                          <Square className="h-4 w-4 mr-2" />
                          Klikk for område
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={drawWalls}>
                          <PenTool className="h-4 w-4 mr-2" />
                          Tegn vegger
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant={selectedToolCategory === 'electrician' ? 'default' : 'outline'} 
                          className="flex items-center gap-2"
                          onClick={() => setSelectedToolCategory(selectedToolCategory === 'electrician' ? 'none' : 'electrician')}
                        >
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

                  {/* Additional tool options */}
                  {selectedToolCategory === 'carpenter' && (
                    <div className="flex gap-2 flex-wrap p-3 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium w-full mb-2">Velg materiale og område:</Label>
                      <Button
                        onClick={selectArea}
                        variant={pendingTool === 'area' ? 'default' : 'outline'}
                        className="flex items-center gap-2"
                      >
                        <Square className="h-4 w-4" />
                        {pendingTool === 'area' ? 'Klikk for å plassere område' : 'Område (Gips/OSB)'}
                      </Button>
                    </div>
                  )}

                  {selectedToolCategory === 'electrician' && (
                    <div className="flex gap-2 flex-wrap p-3 bg-blue-50 rounded-lg">
                      <Label className="text-sm font-medium w-full mb-2">Elektriske installasjoner:</Label>
                      <Button
                        onClick={addOutlet}
                        variant={pendingTool === 'outlet' ? 'default' : 'outline'}
                        className="flex items-center gap-2"
                      >
                        <Zap className="h-4 w-4" />
                        {pendingTool === 'outlet' ? 'Klikk for å plassere stikkontakt' : 'Stikkontakt (500kr/stk)'}
                      </Button>
                      <Button
                        onClick={addLightSwitch}
                        variant={pendingTool === 'lightSwitch' ? 'default' : 'outline'}
                        className="flex items-center gap-2"
                      >
                        {pendingTool === 'lightSwitch' ? 'Klikk for å plassere lysbryter' : 'Lysbryter (300kr/stk)'}
                      </Button>
                      <Button
                        onClick={addLight}
                        variant={pendingTool === 'light' ? 'default' : 'outline'}
                        className="flex items-center gap-2"
                      >
                        {pendingTool === 'light' ? 'Klikk for å plassere lysarmatur' : 'Lysarmatur (400kr/stk)'}
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  <canvas 
                    ref={(el) => (canvasRefs.current[floorPlan.id] = el)} 
                    className="max-w-full" 
                  />
                </div>

                {materialSelections.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Priskalkulator</h3>
                    <div className="space-y-2">
                      {materialSelections.map((selection, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{selection.material.name}</span>
                          <span>{selection.area.toFixed(2)}m² - {selection.cost.toFixed(0)}kr</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 font-semibold">
                        Total: {getTotalCost().toFixed(0)}kr
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>

          <Dialog open={showMaterialDialog} onOpenChange={setShowMaterialDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Velg materialtype</DialogTitle>
                <DialogDescription>
                  Velg hvilket materiale du ønsker å bruke for dette området
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Select onValueChange={handleMaterialSelection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg materiale" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.name} - {material.pricePerM2}kr/{material.unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}