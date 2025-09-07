import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Circle, Rect } from 'fabric';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Hammer, Zap, Undo, Trash2, Plus, X, Droplet } from 'lucide-react';
import { toast } from 'sonner';

interface FloorPlan {
  id: string;
  name: string;
  canvas: FabricCanvas | null;
  history: string[];
  historyIndex: number;
  isUndoing: boolean;
  isEditingName: boolean;
}

interface PlacedItem {
  id: string;
  category: 'carpenter' | 'electrician' | 'plumber';
  type: string;
  name: string;
  price: number;
  floorPlanId: string;
}

const itemPrices = {
  // Elektriker
  outlet: { name: 'Stikkontakt', price: 500 },
  lightSwitch: { name: 'Lysbryter', price: 300 },
  light: { name: 'Lysarmatur', price: 800 },
  
  // Rørlegger
  sink: { name: 'Vask', price: 3000 },
  dishwasher: { name: 'Oppvaskmaskin', price: 2500 },
  washingMachine: { name: 'Vaskemaskin', price: 2000 },
  shower: { name: 'Dusj', price: 8000 },
  toilet: { name: 'Toalett', price: 4000 },
};

export default function BuildingPlannerBasic() {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([
    {
      id: '1',
      name: 'Etasje 1',
      canvas: null,
      history: [],
      historyIndex: -1,
      isUndoing: false,
      isEditingName: false,
    }
  ]);
  const [activeFloorPlan, setActiveFloorPlan] = useState('1');
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [selectedTool, setSelectedTool] = useState<'none' | 'carpenter' | 'electrician' | 'plumber'>('none');
  const [electricianTool, setElectricianTool] = useState<string | null>(null);
  const [plumberTool, setPlumberTool] = useState<string | null>(null);
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Handle window resize to update canvas dimensions on mobile
  useEffect(() => {
    const handleResize = () => {
      floorPlans.forEach(fp => {
        if (fp.canvas) {
          const isMobile = window.innerWidth < 768;
          let newWidth, newHeight;
          
          if (isMobile) {
            newWidth = Math.min(window.innerWidth - 32, 400);
            newHeight = Math.round(newWidth * 0.75);
          } else {
            newWidth = 800;
            newHeight = 600;
          }
          
          if (fp.canvas.width !== newWidth || fp.canvas.height !== newHeight) {
            fp.canvas.setDimensions({width: newWidth, height: newHeight});
            fp.canvas.renderAll();
          }
        }
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [floorPlans]);

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
    if (!canvasElement) {
      console.log('No canvas element found for floor plan:', floorPlanId);
      return;
    }

    // Check if canvas is already initialized
    const existingFloorPlan = floorPlans.find(fp => fp.id === floorPlanId);
    if (existingFloorPlan?.canvas) {
      console.log('Canvas already initialized for floor plan:', floorPlanId);
      return;
    }

    console.log('Initializing new canvas for floor plan:', floorPlanId);

    // Calculate responsive canvas dimensions
    const isMobile = window.innerWidth < 768;
    
    let canvasWidth, canvasHeight;
    
    if (isMobile) {
      // Mobile: Use most of the screen width but maintain aspect ratio
      canvasWidth = Math.min(window.innerWidth - 32, 400); // Max 400px width on mobile
      canvasHeight = Math.round(canvasWidth * 0.75); // 4:3 aspect ratio
    } else {
      // Desktop: Use larger dimensions
      canvasWidth = 800;
      canvasHeight = 600;
    }

    const canvas = new FabricCanvas(canvasElement, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: "#ffffff",
    });

    // Configure drawing settings
    canvas.freeDrawingBrush.color = '#333333';
    canvas.freeDrawingBrush.width = 3;

    const initialState = JSON.stringify(canvas.toJSON());
    
    updateFloorPlan(floorPlanId, {
      canvas,
      history: [initialState],
      historyIndex: 0,
    });

    // Add event listeners for object placement (NOT for carpenter - carpenter only draws)
    canvas.on('mouse:down', (e) => {
      if (selectedTool === 'electrician' && electricianTool) {
        const pointer = canvas.getPointer(e.e);
        handleElectricianTool(canvas, pointer, electricianTool, floorPlanId);
      } else if (selectedTool === 'plumber' && plumberTool) {
        const pointer = canvas.getPointer(e.e);
        handlePlumberTool(canvas, pointer, plumberTool, floorPlanId);
      }
    });

    // Handle canvas changes for history
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
    canvas.on('path:created', handleCanvasChange);

    // Enable touch support for mobile
    canvas.enableRetinaScaling = true;
    
    // Handle touch events properly
    const touchCanvasElement = canvas.getElement();
    touchCanvasElement.addEventListener('touchstart', (e) => {
      e.preventDefault();
    }, { passive: false });
    
    touchCanvasElement.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });
    
    touchCanvasElement.addEventListener('touchend', (e) => {
      e.preventDefault();
    }, { passive: false });
  };

  // Update canvas drawing mode when tool changes
  useEffect(() => {
    floorPlans.forEach(fp => {
      if (fp.canvas) {
        // Only enable drawing mode for carpenter
        if (selectedTool === 'carpenter') {
          fp.canvas.isDrawingMode = true;
          fp.canvas.freeDrawingBrush.color = '#333333';
          fp.canvas.freeDrawingBrush.width = 3;
        } else {
          fp.canvas.isDrawingMode = false;
        }
        fp.canvas.renderAll();
      }
    });
  }, [selectedTool, floorPlans]);

  const handleElectricianTool = (canvas: FabricCanvas, pointer: any, tool: string, floorPlanId: string) => {
    let shape;
    let itemData;

    switch (tool) {
      case 'outlet':
        shape = new Circle({
          left: pointer.x,
          top: pointer.y,
          fill: 'yellow',
          stroke: 'orange',
          strokeWidth: 2,
          radius: 8,
          originX: 'center',
          originY: 'center',
        });
        itemData = itemPrices.outlet;
        break;
      case 'lightSwitch':
        shape = new Rect({
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
        itemData = itemPrices.lightSwitch;
        break;
      case 'light':
        shape = new Circle({
          left: pointer.x,
          top: pointer.y,
          fill: 'lightyellow',
          stroke: 'gold',
          strokeWidth: 2,
          radius: 12,
          originX: 'center',
          originY: 'center',
        });
        itemData = itemPrices.light;
        break;
    }

    if (shape && itemData) {
      canvas.add(shape);
      canvas.renderAll();
      
      // Add to placed items for pricing
      const newItem: PlacedItem = {
        id: Date.now().toString(),
        category: 'electrician',
        type: tool,
        name: itemData.name,
        price: itemData.price,
        floorPlanId: floorPlanId,
      };
      setPlacedItems(prev => [...prev, newItem]);
      
      toast(`${itemData.name} lagt til! Klikk igjen for flere.`);
    }
  };

  const handlePlumberTool = (canvas: FabricCanvas, pointer: any, tool: string, floorPlanId: string) => {
    let shape;
    let itemData;

    switch (tool) {
      case 'sink':
        shape = new Rect({
          left: pointer.x,
          top: pointer.y,
          fill: 'lightblue',
          stroke: 'blue',
          strokeWidth: 2,
          width: 60,
          height: 40,
          originX: 'center',
          originY: 'center',
        });
        itemData = itemPrices.sink;
        break;
      case 'dishwasher':
        shape = new Rect({
          left: pointer.x,
          top: pointer.y,
          fill: 'lightsteelblue',
          stroke: 'steelblue',
          strokeWidth: 2,
          width: 60,
          height: 60,
          originX: 'center',
          originY: 'center',
        });
        itemData = itemPrices.dishwasher;
        break;
      case 'washingMachine':
        shape = new Circle({
          left: pointer.x,
          top: pointer.y,
          fill: 'lightcyan',
          stroke: 'cyan',
          strokeWidth: 2,
          radius: 25,
          originX: 'center',
          originY: 'center',
        });
        itemData = itemPrices.washingMachine;
        break;
      case 'shower':
        shape = new Rect({
          left: pointer.x,
          top: pointer.y,
          fill: 'lightgreen',
          stroke: 'green',
          strokeWidth: 2,
          width: 80,
          height: 80,
          originX: 'center',
          originY: 'center',
        });
        itemData = itemPrices.shower;
        break;
      case 'toilet':
        shape = new Circle({
          left: pointer.x,
          top: pointer.y,
          fill: 'lightpink',
          stroke: 'pink',
          strokeWidth: 2,
          radius: 20,
          originX: 'center',
          originY: 'center',
        });
        itemData = itemPrices.toilet;
        break;
    }

    if (shape && itemData) {
      canvas.add(shape);
      canvas.renderAll();
      
      // Add to placed items for pricing
      const newItem: PlacedItem = {
        id: Date.now().toString(),
        category: 'plumber',
        type: tool,
        name: itemData.name,
        price: itemData.price,
        floorPlanId: floorPlanId,
      };
      setPlacedItems(prev => [...prev, newItem]);
      
      toast(`${itemData.name} lagt til! Klikk igjen for flere.`);
    }
  };

  const addNewFloorPlan = () => {
    const newId = (floorPlans.length + 1).toString();
    const newFloorPlan: FloorPlan = {
      id: newId,
      name: `Etasje ${floorPlans.length + 1}`,
      canvas: null,
      history: [],
      historyIndex: -1,
      isUndoing: false,
      isEditingName: false,
    };
    setFloorPlans(prev => [...prev, newFloorPlan]);
    setActiveFloorPlan(newId);
    
    // Initialize canvas for the new floor plan after state update
    setTimeout(() => initializeCanvas(newId), 100);
  };

  const removeFloorPlan = (id: string) => {
    if (floorPlans.length <= 1) {
      toast("Kan ikke fjerne siste etasjeplan");
      return;
    }

    const floorPlan = floorPlans.find(fp => fp.id === id);
    if (floorPlan?.canvas) {
      floorPlan.canvas.dispose();
    }

    setFloorPlans(prev => prev.filter(fp => fp.id !== id));
    setPlacedItems(prev => prev.filter(item => item.floorPlanId !== id));
    
    if (activeFloorPlan === id) {
      const remainingPlans = floorPlans.filter(fp => fp.id !== id);
      if (remainingPlans.length > 0) {
        setActiveFloorPlan(remainingPlans[0].id);
      }
    }
  };

  const undo = () => {
    const currentFloor = getCurrentFloorPlan();
    if (!currentFloor?.canvas || currentFloor.historyIndex <= 0) return;

    updateFloorPlan(currentFloor.id, { isUndoing: true });
    
    const newIndex = currentFloor.historyIndex - 1;
    const previousState = currentFloor.history[newIndex];
    
    currentFloor.canvas.loadFromJSON(previousState, () => {
      updateFloorPlan(currentFloor.id, {
        historyIndex: newIndex,
        isUndoing: false,
      });
      currentFloor.canvas?.renderAll();
    });
  };

  const clearCanvas = () => {
    const currentFloor = getCurrentFloorPlan();
    if (!currentFloor?.canvas) return;

    currentFloor.canvas.clear();
    currentFloor.canvas.backgroundColor = "#ffffff";
    currentFloor.canvas.renderAll();
    
    const newState = JSON.stringify(currentFloor.canvas.toJSON());
    updateFloorPlan(currentFloor.id, {
      history: [newState],
      historyIndex: 0,
    });
    
    // Clear placed items for this floor plan
    setPlacedItems(prev => prev.filter(item => item.floorPlanId !== currentFloor.id));
    
    toast("Lerret tømt!");
  };

  // Calculate total cost
  const totalCost = placedItems
    .filter(item => item.floorPlanId === activeFloorPlan)
    .reduce((sum, item) => sum + item.price, 0);

  const isMobile = window.innerWidth < 768;

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
          {/* Floor Plan Tabs */}
          <Tabs value={activeFloorPlan} onValueChange={setActiveFloorPlan} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                {floorPlans.map((plan) => (
                  <TabsTrigger key={plan.id} value={plan.id} className="relative group">
                    {plan.isEditingName ? (
                      <Input
                        defaultValue={plan.name}
                        className="w-20 h-6 text-xs"
                        autoFocus
                        onBlur={(e) => {
                          updateFloorPlan(plan.id, { 
                            name: e.target.value || plan.name,
                            isEditingName: false 
                          });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateFloorPlan(plan.id, { 
                              name: (e.target as HTMLInputElement).value || plan.name,
                              isEditingName: false 
                            });
                          }
                        }}
                      />
                    ) : (
                      <span 
                        onDoubleClick={() => updateFloorPlan(plan.id, { isEditingName: true })}
                        className="cursor-pointer"
                      >
                        {plan.name}
                      </span>
                    )}
                    {floorPlans.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground hover:bg-destructive/80"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFloorPlan(plan.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Button onClick={addNewFloorPlan} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Ny etasje
              </Button>
            </div>

            {floorPlans.map((plan) => (
              <TabsContent key={plan.id} value={plan.id} className="space-y-6">
                {/* Tool Selection */}
                <div className="space-y-4">
                  <div className="flex flex-col space-y-4">
                    <div className="text-sm font-medium">Velg verktøy:</div>
                    <div className="flex justify-center gap-4">
                      <Button
                        variant={selectedTool === 'carpenter' ? 'default' : 'outline'}
                        onClick={() => {
                          setSelectedTool(selectedTool === 'carpenter' ? 'none' : 'carpenter');
                          setElectricianTool(null);
                          setPlumberTool(null);
                        }}
                        className="flex flex-col items-center p-4 h-auto"
                      >
                        <Hammer className={`${isMobile ? 'h-8 w-8' : 'h-6 w-6'} mb-2`} />
                        {!isMobile && <span className="text-xs">Tømrer</span>}
                      </Button>
                      <Button
                        variant={selectedTool === 'electrician' ? 'default' : 'outline'}
                        onClick={() => {
                          setSelectedTool(selectedTool === 'electrician' ? 'none' : 'electrician');
                          setPlumberTool(null);
                        }}
                        className="flex flex-col items-center p-4 h-auto"
                      >
                        <Zap className={`${isMobile ? 'h-8 w-8' : 'h-6 w-6'} mb-2`} />
                        {!isMobile && <span className="text-xs">Elektriker</span>}
                      </Button>
                      <Button
                        variant={selectedTool === 'plumber' ? 'default' : 'outline'}
                        onClick={() => {
                          setSelectedTool(selectedTool === 'plumber' ? 'none' : 'plumber');
                          setElectricianTool(null);
                        }}
                        className="flex flex-col items-center p-4 h-auto"
                      >
                        <Droplet className={`${isMobile ? 'h-8 w-8' : 'h-6 w-6'} mb-2`} />
                        {!isMobile && <span className="text-xs">Rørlegger</span>}
                      </Button>
                    </div>
                  </div>

                  {/* Electrician Tools */}
                  {selectedTool === 'electrician' && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Velg elektrisk utstyr:</div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant={electricianTool === 'outlet' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setElectricianTool(electricianTool === 'outlet' ? null : 'outlet')}
                        >
                          Stikkontakt
                        </Button>
                        <Button
                          variant={electricianTool === 'lightSwitch' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setElectricianTool(electricianTool === 'lightSwitch' ? null : 'lightSwitch')}
                        >
                          Lysbryter
                        </Button>
                        <Button
                          variant={electricianTool === 'light' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setElectricianTool(electricianTool === 'light' ? null : 'light')}
                        >
                          Lysarmatur
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Plumber Tools */}
                  {selectedTool === 'plumber' && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Velg rørleggerutstyr:</div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant={plumberTool === 'sink' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPlumberTool(plumberTool === 'sink' ? null : 'sink')}
                        >
                          Vask
                        </Button>
                        <Button
                          variant={plumberTool === 'dishwasher' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPlumberTool(plumberTool === 'dishwasher' ? null : 'dishwasher')}
                        >
                          Oppvaskmaskin
                        </Button>
                        <Button
                          variant={plumberTool === 'washingMachine' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPlumberTool(plumberTool === 'washingMachine' ? null : 'washingMachine')}
                        >
                          Vaskemaskin
                        </Button>
                        <Button
                          variant={plumberTool === 'shower' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPlumberTool(plumberTool === 'shower' ? null : 'shower')}
                        >
                          Dusj
                        </Button>
                        <Button
                          variant={plumberTool === 'toilet' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPlumberTool(plumberTool === 'toilet' ? null : 'toilet')}
                        >
                          Toalett
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Drawing Instructions */}
                  {selectedTool === 'carpenter' && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Tegningsmodus aktiv - tegn direkte på lerretet med finger eller mus
                      </p>
                    </div>
                  )}
                </div>

                {/* Canvas and Controls */}
                <div className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    <Button onClick={undo} variant="outline" size="sm">
                      <Undo className="h-4 w-4 mr-2" />
                      Angre
                    </Button>
                    <Button onClick={clearCanvas} variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Tøm
                    </Button>
                  </div>

                  {/* Canvas */}
                  <div className="border border-gray-200 rounded-lg shadow-lg overflow-hidden bg-white">
                    <canvas
                      ref={(el) => {
                        canvasRefs.current[plan.id] = el;
                        if (el && !plan.canvas) {
                          // Delay initialization to ensure DOM is ready
                          setTimeout(() => initializeCanvas(plan.id), 100);
                        }
                      }}
                      className="max-w-full touch-none"
                      style={{ 
                        display: 'block',
                        width: '100%',
                        height: 'auto',
                        touchAction: 'none'
                      }}
                    />
                  </div>

                  {/* Cost Summary */}
                  {placedItems.filter(item => item.floorPlanId === plan.id).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Kostnadsoversikt - {plan.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {placedItems
                            .filter(item => item.floorPlanId === plan.id)
                            .reduce((acc, item) => {
                              const existing = acc.find(i => i.type === item.type);
                              if (existing) {
                                existing.count++;
                                existing.totalPrice += item.price;
                              } else {
                                acc.push({
                                  type: item.type,
                                  name: item.name,
                                  count: 1,
                                  unitPrice: item.price,
                                  totalPrice: item.price,
                                });
                              }
                              return acc;
                            }, [] as Array<{type: string, name: string, count: number, unitPrice: number, totalPrice: number}>)
                            .map((item) => (
                              <div key={item.type} className="flex justify-between items-center py-1">
                                <span className="text-sm">
                                  {item.name} x {item.count}
                                </span>
                                <span className="text-sm font-medium">
                                  {item.totalPrice.toLocaleString()} kr
                                </span>
                              </div>
                            ))}
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between items-center font-semibold">
                              <span>Total:</span>
                              <span>{totalCost.toLocaleString()} kr</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}