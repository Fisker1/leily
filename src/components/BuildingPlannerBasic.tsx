import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, Group, Line, Ellipse, FabricImage } from 'fabric';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Hammer, Zap, Undo, Trash2, Plus, X, Droplet, ImageIcon, FileImage } from 'lucide-react';
import { toast } from 'sonner';

interface FloorPlan {
  id: string;
  name: string;
  canvas: FabricCanvas | null;
  history: string[];
  historyIndex: number;
  isUndoing: boolean;
  isEditingName: boolean;
  backgroundImage?: string;
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
  electricalPanel: { name: 'Sikringsskap', price: 3500 },
  
  // Snekker/Tømrer
  window: { name: 'Vindu', price: 4500 },
  door: { name: 'Dør', price: 2800 },
  
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
  const [carpenterTool, setCarpenterTool] = useState<string | null>(null);
  const [electricianTool, setElectricianTool] = useState<string | null>(null);
  const [plumberTool, setPlumberTool] = useState<string | null>(null);
  const [overlayFlashing, setOverlayFlashing] = useState(false);
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset overlay flash when tools change
  useEffect(() => {
    setOverlayFlashing(false);
  }, [selectedTool, carpenterTool, electricianTool, plumberTool]);

  // Store current tool state in window for mobile access
  useEffect(() => {
    (window as any).currentToolState = { selectedTool, carpenterTool, electricianTool, plumberTool };
  }, [selectedTool, carpenterTool, electricianTool, plumberTool]);

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
    if (!canvasElement) return;

    // Check if canvas is already initialized
    const existingFloorPlan = floorPlans.find(fp => fp.id === floorPlanId);
    if (existingFloorPlan?.canvas) return;

    // Calculate responsive canvas dimensions
    const isMobile = window.innerWidth < 768;
    let canvasWidth, canvasHeight;
    
    if (isMobile) {
      canvasWidth = Math.min(window.innerWidth - 32, 400);
      canvasHeight = Math.round(canvasWidth * 0.75);
    } else {
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
  };

  // Update canvas drawing mode when tool changes
  useEffect(() => {
    floorPlans.forEach(fp => {
      if (fp.canvas) {
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

  const handleCarpenterTool = (canvas: FabricCanvas, pointer: any, tool: string, floorPlanId: string) => {
    let shape;
    let itemData;

    switch (tool) {
      case 'window':
        // Window icon - rectangle with cross lines
        const windowGroup = new Group([
          new Rect({
            width: 40,
            height: 30,
            fill: 'white',
            stroke: 'brown',
            strokeWidth: 3,
          }),
          new Line([0, 15, 40, 15], {
            stroke: 'brown',
            strokeWidth: 2,
          }),
          new Line([20, 0, 20, 30], {
            stroke: 'brown',
            strokeWidth: 2,
          })
        ], {
          left: pointer.x,
          top: pointer.y,
          originX: 'center',
          originY: 'center',
        });
        shape = windowGroup;
        itemData = itemPrices.window;
        break;
      case 'door':
        // Door icon - rectangle with handle
        const doorGroup = new Group([
          new Rect({
            width: 30,
            height: 60,
            fill: 'burlywood',
            stroke: 'brown',
            strokeWidth: 2,
          }),
          new Circle({ radius: 2, left: 8, top: 0, fill: 'gold' }) // Handle
        ], {
          left: pointer.x,
          top: pointer.y,
          originX: 'center',
          originY: 'center',
        });
        shape = doorGroup;
        itemData = itemPrices.door;
        break;
      case 'wall':
        // Enable drawing mode for walls
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = '#8B4513';
        canvas.freeDrawingBrush.width = 8;
        toast("Tegningsmodus aktivert - tegn vegger!");
        return;
    }

    if (shape && itemData) {
      canvas.add(shape);
      canvas.renderAll();
      
      const newItem: PlacedItem = {
        id: Date.now().toString(),
        category: 'carpenter',
        type: tool,
        name: itemData.name,
        price: itemData.price,
        floorPlanId: floorPlanId,
      };
      setPlacedItems(prev => [...prev, newItem]);
      
      toast(`${itemData.name} lagt til!`);
    }
  };

  const handleElectricianTool = (canvas: FabricCanvas, pointer: any, tool: string, floorPlanId: string) => {
    let shape;
    let itemData;

    switch (tool) {
      case 'outlet':
        // Outlet icon - circle with two lines
        const outletGroup = new Group([
          new Circle({
            radius: 12,
            fill: 'white',
            stroke: 'black',
            strokeWidth: 2,
          }),
          new Line([-4, -6, -4, 6], {
            stroke: 'black',
            strokeWidth: 3,
          }),
          new Line([4, -6, 4, 6], {
            stroke: 'black',
            strokeWidth: 3,
          })
        ], {
          left: pointer.x,
          top: pointer.y,
          originX: 'center',
          originY: 'center',
        });
        shape = outletGroup;
        itemData = itemPrices.outlet;
        break;
      case 'lightSwitch':
        // Light switch icon - rectangle with line
        const switchGroup = new Group([
          new Rect({
            width: 16,
            height: 24,
            fill: 'white',
            stroke: 'black',
            strokeWidth: 2,
          }),
          new Line([0, -8, 0, 8], {
            stroke: 'black',
            strokeWidth: 2,
          })
        ], {
          left: pointer.x,
          top: pointer.y,
          originX: 'center',
          originY: 'center',
        });
        shape = switchGroup;
        itemData = itemPrices.lightSwitch;
        break;
      case 'light':
        // Light icon - circle with rays
        const lightGroup = new Group([
          new Circle({
            radius: 10,
            fill: 'lightyellow',
            stroke: 'orange',
            strokeWidth: 2,
          }),
          // Light rays
          new Line([0, -15, 0, -20], { stroke: 'orange', strokeWidth: 2 }),
          new Line([0, 15, 0, 20], { stroke: 'orange', strokeWidth: 2 }),
          new Line([-15, 0, -20, 0], { stroke: 'orange', strokeWidth: 2 }),
          new Line([15, 0, 20, 0], { stroke: 'orange', strokeWidth: 2 }),
        ], {
          left: pointer.x,
          top: pointer.y,
          originX: 'center',
          originY: 'center',
        });
        shape = lightGroup;
        itemData = itemPrices.light;
        break;
      case 'electricalPanel':
        // Electrical panel - large rectangle with electrical symbol
        const panelGroup = new Group([
          new Rect({
            width: 60,
            height: 80,
            fill: 'lightgray',
            stroke: 'black',
            strokeWidth: 3,
          }),
          new Rect({
            width: 50,
            height: 70,
            fill: 'white',
            stroke: 'black',
            strokeWidth: 1,
          }),
          // Electrical symbol
          new Circle({ radius: 3, left: -10, top: -20, fill: 'red' }),
          new Circle({ radius: 3, left: 0, top: -20, fill: 'black' }),
          new Circle({ radius: 3, left: 10, top: -20, fill: 'blue' }),
          new Line([-15, -10, 15, -10], { stroke: 'black', strokeWidth: 2 }),
          new Line([-15, 0, 15, 0], { stroke: 'black', strokeWidth: 2 }),
          new Line([-15, 10, 15, 10], { stroke: 'black', strokeWidth: 2 })
        ], {
          left: pointer.x,
          top: pointer.y,
          originX: 'center',
          originY: 'center',
        });
        shape = panelGroup;
        itemData = itemPrices.electricalPanel;
        break;
    }

    if (shape && itemData) {
      canvas.add(shape);
      canvas.renderAll();
      
      const newItem: PlacedItem = {
        id: Date.now().toString(),
        category: 'electrician',
        type: tool,
        name: itemData.name,
        price: itemData.price,
        floorPlanId: floorPlanId,
      };
      setPlacedItems(prev => [...prev, newItem]);
      
      toast(`${itemData.name} lagt til!`);
    }
  };

  const handlePlumberTool = (canvas: FabricCanvas, pointer: any, tool: string, floorPlanId: string) => {
    console.log('handlePlumberTool called with tool:', tool);
    let shape;
    let itemData;

    switch (tool) {
      case 'sink':
        // Sink icon - rectangle with faucet
        const sinkGroup = new Group([
          new Rect({
            width: 50,
            height: 30,
            fill: 'white',
            stroke: 'blue',
            strokeWidth: 2,
          }),
          // Faucet
          new Line([0, -15, 0, -25], { stroke: 'silver', strokeWidth: 4 }),
          new Circle({ radius: 3, top: -25, fill: 'silver' })
        ], {
          left: pointer.x,
          top: pointer.y,
          originX: 'center',
          originY: 'center',
        });
        shape = sinkGroup;
        itemData = itemPrices.sink;
        break;
      case 'dishwasher':
        // Dishwasher icon - rectangle with door
        const dishwasherGroup = new Group([
          new Rect({
            width: 50,
            height: 50,
            fill: 'white',
            stroke: 'gray',
            strokeWidth: 2,
          }),
          new Line([-20, 20, 20, 20], { stroke: 'gray', strokeWidth: 2 }),
          new Circle({ radius: 2, left: 15, top: 15, fill: 'gray' })
        ], {
          left: pointer.x,
          top: pointer.y,
          originX: 'center',
          originY: 'center',
        });
        shape = dishwasherGroup;
        itemData = itemPrices.dishwasher;
        break;
      case 'washingMachine':
        // Washing machine icon - circle with door
        const washingMachineGroup = new Group([
          new Circle({
            radius: 20,
            fill: 'white',
            stroke: 'gray',
            strokeWidth: 3,
          }),
          new Circle({
            radius: 12,
            fill: 'lightblue',
            stroke: 'blue',
            strokeWidth: 2,
          }),
          new Circle({ radius: 2, left: -10, top: -10, fill: 'gray' }),
          new Circle({ radius: 2, left: 0, top: -10, fill: 'gray' })
        ], {
          left: pointer.x,
          top: pointer.y,
          originX: 'center',
          originY: 'center',
        });
        shape = washingMachineGroup;
        itemData = itemPrices.washingMachine;
        break;
      case 'shower':
        // Shower icon - rectangle with shower head
        const showerGroup = new Group([
          new Rect({
            width: 60,
            height: 60,
            fill: 'lightblue',
            stroke: 'blue',
            strokeWidth: 2,
          }),
          // Shower head
          new Line([-20, -30, -20, -20], { stroke: 'silver', strokeWidth: 4 }),
          new Rect({ width: 15, height: 5, left: -20, top: -20, fill: 'silver' }),
          // Water drops
          new Circle({ radius: 1, left: -25, top: -10, fill: 'blue' }),
          new Circle({ radius: 1, left: -20, top: -8, fill: 'blue' }),
          new Circle({ radius: 1, left: -15, top: -12, fill: 'blue' })
        ], {
          left: pointer.x,
          top: pointer.y,
          originX: 'center',
          originY: 'center',
        });
        shape = showerGroup;
        itemData = itemPrices.shower;
        break;
      case 'toilet':
        // Toilet icon - oval with tank
        const toiletGroup = new Group([
          new Ellipse({
            rx: 15,
            ry: 20,
            fill: 'white',
            stroke: 'gray',
            strokeWidth: 2,
          }),
          new Rect({
            width: 20,
            height: 15,
            top: -15,
            fill: 'white',
            stroke: 'gray',
            strokeWidth: 2,
          })
        ], {
          left: pointer.x,
          top: pointer.y,
          originX: 'center',
          originY: 'center',
        });
        shape = toiletGroup;
        itemData = itemPrices.toilet;
        break;
    }

    if (shape && itemData) {
      canvas.add(shape);
      canvas.renderAll();
      
      const newItem: PlacedItem = {
        id: Date.now().toString(),
        category: 'plumber',
        type: tool,
        name: itemData.name,
        price: itemData.price,
        floorPlanId: floorPlanId,
      };
      setPlacedItems(prev => [...prev, newItem]);
      
      toast(`${itemData.name} lagt til!`);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent | React.TouchEvent, floorPlanId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    let clientX, clientY;
    
    if ('touches' in e.nativeEvent && e.nativeEvent.changedTouches.length > 0) {
      const touch = e.nativeEvent.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else if ('clientX' in e.nativeEvent) {
      clientX = e.nativeEvent.clientX;
      clientY = e.nativeEvent.clientY;
    } else {
      return; // Invalid event
    }
    
    const canvas = getCurrentFloorPlan()?.canvas;
    if (!canvas) {
      toast("Lerret ikke klart. Prøv å velg verktøy på nytt.");
      return;
    }
    
    // Get canvas element to calculate coordinates
    const canvasElement = canvasRefs.current[floorPlanId];
    if (!canvasElement) return;
    
    const rect = canvasElement.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    
    // Flash green briefly to show click registered
    setOverlayFlashing(true);
    setTimeout(() => setOverlayFlashing(false), 150);
    
    // Handle tool placement
    try {
      if (selectedTool === 'carpenter' && carpenterTool) {
        handleCarpenterTool(canvas, {x, y}, carpenterTool, floorPlanId);
      } else if (selectedTool === 'electrician' && electricianTool) {
        handleElectricianTool(canvas, {x, y}, electricianTool, floorPlanId);
      } else if (selectedTool === 'plumber' && plumberTool) {
        handlePlumberTool(canvas, {x, y}, plumberTool, floorPlanId);
      }
    } catch (error) {
      console.error('Error placing item:', error);
      toast("Feil ved plassering av objekt");
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
    
    setPlacedItems(prev => prev.filter(item => item.floorPlanId !== currentFloor.id));
    
    toast("Lerret tømt!");
  };

  // Handle background image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast("Vennligst velg en bildefil (PNG, JPG, etc.)");
      return;
    }

    const currentFloor = getCurrentFloorPlan();
    if (!currentFloor?.canvas) {
      toast("Lerret ikke initialisert. Prøv igjen.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      
      // Create a new HTML image element to ensure proper loading
      const img = new Image();
      img.onload = () => {
        try {
          // Create Fabric image from loaded HTML image
          FabricImage.fromElement(img).then((fabricImg) => {
            const canvas = currentFloor.canvas!;
            
            // Scale image to fit canvas while maintaining aspect ratio
            const canvasAspect = canvas.width / canvas.height;
            const imageAspect = fabricImg.width / fabricImg.height;
            
            if (imageAspect > canvasAspect) {
              // Image is wider - fit to canvas width
              fabricImg.scaleToWidth(canvas.width);
            } else {
              // Image is taller - fit to canvas height  
              fabricImg.scaleToHeight(canvas.height);
            }
            
            // Center the image
            fabricImg.set({
              left: canvas.width / 2,
              top: canvas.height / 2,
              originX: 'center',
              originY: 'center',
              opacity: 0.7,
              selectable: false,
              evented: false
            });
            
            // Clear any existing background and set new one
            canvas.backgroundImage = fabricImg;
            canvas.renderAll();
            
            // Update floor plan with background image URL
            updateFloorPlan(currentFloor.id, { 
              backgroundImage: imageUrl 
            });
            
            toast("Bakgrunnsbilde lastet opp!");
          }).catch((error) => {
            console.error('Error creating Fabric image:', error);
            toast("Feil ved behandling av bilde");
          });
        } catch (error) {
          console.error('Error processing image:', error);
          toast("Feil ved behandling av bilde");
        }
      };
      
      img.onerror = () => {
        toast("Kunne ikke laste bildet. Prøv et annet format.");
      };
      
      img.src = imageUrl;
    };
    
    reader.onerror = () => {
      toast("Feil ved lesing av fil");
    };
    
    reader.readAsDataURL(file);
    
    // Clear the input so the same file can be uploaded again
    event.target.value = '';
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

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
                <div className="space-y-4">
                  <div className="flex flex-col space-y-4">
                    <div className="text-sm font-medium">Velg verktøy:</div>
                    <div className="flex justify-center gap-4">
                      <Button
                        variant={selectedTool === 'carpenter' ? 'default' : 'outline'}
                        onClick={() => {
                          setSelectedTool(selectedTool === 'carpenter' ? 'none' : 'carpenter');
                          setCarpenterTool(null);
                          setElectricianTool(null);
                          setPlumberTool(null);
                        }}
                        className="flex flex-col items-center justify-center aspect-square p-4"
                      >
                        <Hammer className={`${isMobile ? 'h-8 w-8' : 'h-6 w-6'} mb-2`} />
                        {!isMobile && <span className="text-xs">Tømrer</span>}
                      </Button>
                      <Button
                        variant={selectedTool === 'electrician' ? 'default' : 'outline'}
                        onClick={() => {
                          setSelectedTool('electrician');
                          setCarpenterTool(null);
                          setPlumberTool(null);
                        }}
                        className="flex flex-col items-center justify-center aspect-square p-4"
                      >
                        <Zap className={`${isMobile ? 'h-8 w-8' : 'h-6 w-6'} mb-2`} />
                        {!isMobile && <span className="text-xs">Elektriker</span>}
                      </Button>
                      <Button
                        variant={selectedTool === 'plumber' ? 'default' : 'outline'}
                        onClick={() => {
                          setSelectedTool('plumber');
                          setCarpenterTool(null);
                          setElectricianTool(null);
                        }}
                        className="flex flex-col items-center justify-center aspect-square p-4"
                      >
                        <Droplet className={`${isMobile ? 'h-8 w-8' : 'h-6 w-6'} mb-2`} />
                        {!isMobile && <span className="text-xs">Rørlegger</span>}
                      </Button>
                    </div>
                  </div>

                   {selectedTool === 'carpenter' && (
                     <div className="space-y-2">
                       <div className="text-sm font-medium">Velg snekkerarbeid:</div>
                       <div className="grid grid-cols-2 gap-2">
                         <Button
                           variant={carpenterTool === 'window' ? 'default' : 'outline'}
                           size="sm"
                           onClick={() => setCarpenterTool('window')}
                           className="h-auto py-2 px-3"
                         >
                           <div className="flex flex-col items-center gap-1">
                             <div className="w-4 h-3 border border-current" />
                             <span className="text-xs">Vindu</span>
                           </div>
                         </Button>
                         <Button
                           variant={carpenterTool === 'door' ? 'default' : 'outline'}
                           size="sm"
                           onClick={() => setCarpenterTool('door')}
                           className="h-auto py-2 px-3"
                         >
                           <div className="flex flex-col items-center gap-1">
                             <div className="w-3 h-4 border border-current rounded-r" />
                             <span className="text-xs">Dør</span>
                           </div>
                         </Button>
                         <Button
                           variant={carpenterTool === 'wall' ? 'default' : 'outline'}
                           size="sm"
                           onClick={() => setCarpenterTool('wall')}
                           className="h-auto py-2 px-3 col-span-2"
                         >
                           <div className="flex flex-col items-center gap-1">
                             <div className="w-6 h-1 bg-current" />
                             <span className="text-xs">Tegn vegg</span>
                           </div>
                         </Button>
                       </div>
                     </div>
                   )}

                   {selectedTool === 'electrician' && (
                     <div className="space-y-2">
                       <div className="text-sm font-medium">Velg elektrisk utstyr:</div>
                       <div className="grid grid-cols-2 gap-2">
                         <Button
                           variant={electricianTool === 'outlet' ? 'default' : 'outline'}
                           size="sm"
                           onClick={() => setElectricianTool('outlet')}
                           className="h-auto py-2 px-3"
                         >
                           <div className="flex flex-col items-center gap-1">
                             <Zap className="h-4 w-4" />
                             <span className="text-xs">Stikkontakt</span>
                           </div>
                         </Button>
                         <Button
                           variant={electricianTool === 'lightSwitch' ? 'default' : 'outline'}
                           size="sm"
                           onClick={() => setElectricianTool('lightSwitch')}
                           className="h-auto py-2 px-3"
                         >
                           <div className="flex flex-col items-center gap-1">
                             <div className="w-4 h-4 border border-current rounded-sm" />
                             <span className="text-xs">Lysbryter</span>
                           </div>
                         </Button>
                         <Button
                           variant={electricianTool === 'light' ? 'default' : 'outline'}
                           size="sm"
                           onClick={() => setElectricianTool('light')}
                           className="h-auto py-2 px-3"
                         >
                           <div className="flex flex-col items-center gap-1">
                             <div className="w-4 h-4 border border-current rounded-full" />
                             <span className="text-xs">Lysarmatur</span>
                           </div>
                         </Button>
                         <Button
                           variant={electricianTool === 'electricalPanel' ? 'default' : 'outline'}
                           size="sm"
                           onClick={() => setElectricianTool('electricalPanel')}
                           className="h-auto py-2 px-3"
                         >
                           <div className="flex flex-col items-center gap-1">
                             <div className="w-4 h-5 border-2 border-current rounded-sm" />
                             <span className="text-xs">Sikringsskap</span>
                           </div>
                         </Button>
                       </div>
                     </div>
                   )}

                   {selectedTool === 'plumber' && (
                     <div className="space-y-2">
                       <div className="text-sm font-medium">Velg rørleggerutstyr:</div>
                       <div className="grid grid-cols-3 gap-2">
                         <Button
                           variant={plumberTool === 'sink' ? 'default' : 'outline'}
                           size="sm"
                           onClick={() => setPlumberTool('sink')}
                           className="h-auto py-2 px-2"
                         >
                           <div className="flex flex-col items-center gap-1">
                             <div className="w-4 h-3 border border-current rounded-t" />
                             <span className="text-xs">Vask</span>
                           </div>
                         </Button>
                         <Button
                           variant={plumberTool === 'shower' ? 'default' : 'outline'}
                           size="sm"
                           onClick={() => setPlumberTool('shower')}
                           className="h-auto py-2 px-2"
                         >
                           <div className="flex flex-col items-center gap-1">
                             <div className="w-4 h-4 border border-current rounded" />
                             <span className="text-xs">Dusj</span>
                           </div>
                         </Button>
                         <Button
                           variant={plumberTool === 'toilet' ? 'default' : 'outline'}
                           size="sm"
                           onClick={() => setPlumberTool('toilet')}
                           className="h-auto py-2 px-2"
                         >
                           <div className="flex flex-col items-center gap-1">
                             <div className="w-3 h-4 border border-current rounded-full" />
                             <span className="text-xs">Toalett</span>
                           </div>
                         </Button>
                         <Button
                           variant={plumberTool === 'dishwasher' ? 'default' : 'outline'}
                           size="sm"
                           onClick={() => setPlumberTool('dishwasher')}
                           className="h-auto py-2 px-2"
                         >
                           <div className="flex flex-col items-center gap-1">
                             <div className="w-4 h-4 border border-current rounded" />
                             <span className="text-xs">Oppvask</span>
                           </div>
                         </Button>
                         <Button
                           variant={plumberTool === 'washingMachine' ? 'default' : 'outline'}
                           size="sm"
                           onClick={() => setPlumberTool('washingMachine')}
                           className="h-auto py-2 px-2"
                         >
                           <div className="flex flex-col items-center gap-1">
                             <div className="w-4 h-4 border border-current rounded-full" />
                             <span className="text-xs">Vask.maskin</span>
                           </div>
                         </Button>
                       </div>
                     </div>
                   )}

                </div>

                <div className="space-y-4">
                   <div className="flex gap-2 mb-4 flex-wrap">
                     <Button onClick={undo} variant="outline" size="sm">
                       <Undo className="h-4 w-4 mr-2" />
                       Angre
                     </Button>
                     <Button onClick={clearCanvas} variant="outline" size="sm">
                       <Trash2 className="h-4 w-4 mr-2" />
                       Tøm
                     </Button>
                     <Button onClick={triggerImageUpload} variant="outline" size="sm">
                       <Upload className="h-4 w-4 mr-2" />
                       Last opp plantegning
                     </Button>
                   </div>
                   
                   <input
                     ref={fileInputRef}
                     type="file"
                     accept="image/*"
                     onChange={handleImageUpload}
                     className="hidden"
                   />

                  {/* Canvas with touch overlay */}
                  <div className="border border-gray-200 rounded-lg shadow-lg overflow-hidden bg-white relative">
                    <canvas
                      ref={(el) => {
                        canvasRefs.current[plan.id] = el;
                        if (el && !plan.canvas) {
                          setTimeout(() => initializeCanvas(plan.id), 100);
                        }
                      }}
                      className="max-w-full block"
                      style={{ 
                        display: 'block',
                        width: '100%',
                        height: 'auto'
                      }}
                    />
                    {/* Touch overlay for mobile placement */}
                    {((selectedTool === 'carpenter' && carpenterTool) || (selectedTool === 'electrician' && electricianTool) || (selectedTool === 'plumber' && plumberTool)) && (
                       <div className="absolute inset-0 z-10 cursor-crosshair transition-all duration-150"
                         style={{ 
                           backgroundColor: overlayFlashing ? 'rgba(0, 255, 0, 0.4)' : 'rgba(0, 255, 0, 0.1)',
                           touchAction: 'none'
                         }}
                         onClick={(e) => handleOverlayClick(e, plan.id)}
                         onTouchEnd={(e) => {
                           e.preventDefault();
                           handleOverlayClick(e, plan.id);
                         }}
                       />
                    )}
                  </div>

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