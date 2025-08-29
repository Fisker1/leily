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
import { Upload, Hammer, Zap, ChevronDown, Undo, Trash2, Plus, X, Square, PenTool, Droplet } from 'lucide-react';
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
      drawingMode: 'select',
      selectedObjects: [],
      isEditingName: false,
    }
  ]);
  const [activeFloorPlan, setActiveFloorPlan] = useState('1');
  const [materialSelections, setMaterialSelections] = useState<MaterialSelection[]>([]);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);
  const [pendingObject, setPendingObject] = useState<any>(null);
  const [selectedToolCategory, setSelectedToolCategory] = useState<'none' | 'carpenter' | 'electrician' | 'plumber'>('none');
  const [pendingTool, setPendingTool] = useState<string | null>(null);
  const pendingToolRef = useRef<string | null>(null);
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Keep ref in sync with state
  useEffect(() => {
    pendingToolRef.current = pendingTool;
  }, [pendingTool]);

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
      const currentTool = pendingToolRef.current; // Use ref to get current value
      if (!currentFloor || !currentTool || currentFloor.drawingMode === 'wall') return;

      const pointer = canvas.getPointer(e.e);
      console.log('Mouse click at:', pointer, 'with tool:', currentTool);
      
      // Create object based on pending tool
      if (currentTool === 'outlet') {
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
        saveCanvasState(floorPlanId); // Save state for undo functionality
        
        // Add to placed items for pricing
        const newItem: PlacedItem = {
          id: Date.now().toString(),
          category: 'electrician',
          type: 'outlet',
          name: itemPrices.outlet.name,
          price: itemPrices.outlet.price,
          floorPlanId: floorPlanId,
        };
        setPlacedItems(prev => [...prev, newItem]);
        
        toast("Stikkontakt lagt til! Klikk igjen for flere stikkontakter.");
        // Don't reset pendingTool - allow continuous placement
      } else if (currentTool === 'lightSwitch') {
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
        saveCanvasState(floorPlanId); // Save state for undo functionality
        
        // Add to placed items for pricing
        const newItem: PlacedItem = {
          id: Date.now().toString(),
          category: 'electrician',
          type: 'lightSwitch',
          name: itemPrices.lightSwitch.name,
          price: itemPrices.lightSwitch.price,
          floorPlanId: floorPlanId,
        };
        setPlacedItems(prev => [...prev, newItem]);
        
        toast("Lysbryter lagt til! Klikk igjen for flere lysbrytere.");
        // Don't reset pendingTool
      } else if (currentTool === 'light') {
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
        saveCanvasState(floorPlanId); // Save state for undo functionality
        
        // Add to placed items for pricing
        const newItem: PlacedItem = {
          id: Date.now().toString(),
          category: 'electrician',
          type: 'light',
          name: itemPrices.light.name,
          price: itemPrices.light.price,
          floorPlanId: floorPlanId,
        };
        setPlacedItems(prev => [...prev, newItem]);
        
        toast("Lysarmatur lagt til! Klikk igjen for flere lysarmaturer.");
        // Don't reset pendingTool
      } else if (currentTool === 'area') {
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
      } else if (pendingTool === 'sink') {
        const rect = new Rect({
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
        canvas.add(rect);
        canvas.renderAll();
        saveCanvasState(floorPlanId); // Save state for undo functionality
        
        // Add to placed items for pricing
        const newItem: PlacedItem = {
          id: Date.now().toString(),
          category: 'plumber',
          type: 'sink',
          name: itemPrices.sink.name,
          price: itemPrices.sink.price,
          floorPlanId: floorPlanId,
        };
        setPlacedItems(prev => [...prev, newItem]);
        
        toast("Vask lagt til! Klikk igjen for flere vasker.");
        // Don't reset pendingTool
      } else if (currentTool === 'dishwasher') {
        const rect = new Rect({
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
        canvas.add(rect);
        canvas.renderAll();
        saveCanvasState(floorPlanId); // Save state for undo functionality
        
        // Add to placed items for pricing
        const newItem: PlacedItem = {
          id: Date.now().toString(),
          category: 'plumber',
          type: 'dishwasher',
          name: itemPrices.dishwasher.name,
          price: itemPrices.dishwasher.price,
          floorPlanId: floorPlanId,
        };
        setPlacedItems(prev => [...prev, newItem]);
        
        toast("Oppvaskmaskin lagt til! Klikk igjen for flere.");
        // Don't reset pendingTool
      } else if (currentTool === 'washingMachine') {
        const circle = new Circle({
          left: pointer.x,
          top: pointer.y,
          fill: 'lightcyan',
          stroke: 'cyan',
          strokeWidth: 2,
          radius: 25,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(circle);
        canvas.renderAll();
        saveCanvasState(floorPlanId); // Save state for undo functionality
        
        // Add to placed items for pricing
        const newItem: PlacedItem = {
          id: Date.now().toString(),
          category: 'plumber',
          type: 'washingMachine',
          name: itemPrices.washingMachine.name,
          price: itemPrices.washingMachine.price,
          floorPlanId: floorPlanId,
        };
        setPlacedItems(prev => [...prev, newItem]);
        
        toast("Vaskemaskin lagt til! Klikk igjen for flere.");
        // Don't reset pendingTool
      } else if (currentTool === 'shower') {
        const rect = new Rect({
          left: pointer.x,
          top: pointer.y,
          fill: 'aqua',
          stroke: 'darkturquoise',
          strokeWidth: 2,
          width: 90,
          height: 90,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(rect);
        canvas.renderAll();
        saveCanvasState(floorPlanId); // Save state for undo functionality
        
        // Add to placed items for pricing
        const newItem: PlacedItem = {
          id: Date.now().toString(),
          category: 'plumber',
          type: 'shower',
          name: itemPrices.shower.name,
          price: itemPrices.shower.price,
          floorPlanId: floorPlanId,
        };
        setPlacedItems(prev => [...prev, newItem]);
        
        toast("Dusj lagt til! Klikk igjen for flere.");
        // Don't reset pendingTool
      } else if (currentTool === 'toilet') {
        const circle = new Circle({
          left: pointer.x,
          top: pointer.y,
          fill: 'white',
          stroke: 'gray',
          strokeWidth: 2,
          radius: 20,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(circle);
        canvas.renderAll();
        saveCanvasState(floorPlanId); // Save state for undo functionality
        
        // Add to placed items for pricing
        const newItem: PlacedItem = {
          id: Date.now().toString(),
          category: 'plumber',
          type: 'toilet',
          name: itemPrices.toilet.name,
          price: itemPrices.toilet.price,
          floorPlanId: floorPlanId,
        };
        setPlacedItems(prev => [...prev, newItem]);
        
        toast("Toalett lagt til! Klikk igjen for flere.");
        // Don't reset pendingTool
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
    // Only initialize canvases that don't already exist
    floorPlans.forEach(floorPlan => {
      if (!floorPlan.canvas && canvasRefs.current[floorPlan.id]) {
        console.log('UseEffect: Initializing canvas for floor plan:', floorPlan.id);
        initializeCanvas(floorPlan.id);
      }
    });
  }, [floorPlans.length]); // Only depend on length, not full floorPlans array

  // Initialize canvas on component mount - run once
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const currentFloor = getCurrentFloorPlan();
      if (currentFloor && !currentFloor.canvas && canvasRefs.current[currentFloor.id]) {
        console.log('Mount effect: Force initializing current floor canvas:', currentFloor.id);
        initializeCanvas(currentFloor.id);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array - run only on mount

  // Reset cursor when switching tools
  useEffect(() => {
    const floorPlan = getCurrentFloorPlan();
    if (floorPlan?.canvas) {
      if (pendingTool) {
        floorPlan.canvas.defaultCursor = 'crosshair';
        floorPlan.canvas.hoverCursor = 'crosshair';
        console.log('Set cursor to crosshair for tool:', pendingTool);
      } else {
        floorPlan.canvas.defaultCursor = 'default';
        floorPlan.canvas.hoverCursor = 'move';
        console.log('Reset cursor to default');
      }
    }
  }, [pendingTool, activeFloorPlan]);

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
    if (!floorPlan?.canvas) {
      toast("Canvas ikke klar enda, prøv igjen");
      return;
    }
    
    const rect = new Rect({
      left: 100,
      top: 100,
      fill: 'rgba(139, 69, 19, 0.7)',
      width: 150,
      height: 20,
    });
    floorPlan.canvas.add(rect);
    saveCanvasState(activeFloorPlan); // Save state for undo functionality
    toast("Vegg lagt til!");
  };

  const addRoom = () => {
    const floorPlan = getCurrentFloorPlan();
    if (!floorPlan?.canvas) {
      toast("Canvas ikke klar enda, prøv igjen");
      return;
    }
    
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
    saveCanvasState(activeFloorPlan); // Save state for undo functionality
    toast("Rom markert!");
  };

  const addWindow = () => {
    const floorPlan = getCurrentFloorPlan();
    if (!floorPlan?.canvas) {
      toast("Canvas ikke klar enda, prøv igjen");
      return;
    }
    
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
    saveCanvasState(activeFloorPlan); // Save state for undo functionality
    toast("Vindu lagt til!");
  };

  // Drawing mode functions
  const setDrawingMode = (mode: 'select' | 'area' | 'wall') => {
    const floorPlan = getCurrentFloorPlan();
    if (!floorPlan?.canvas) {
      toast("Canvas ikke klar enda, prøv igjen om litt");
      return;
    }

    updateFloorPlan(floorPlan.id, { drawingMode: mode });
    
    if (mode === 'wall') {
      floorPlan.canvas.isDrawingMode = true;
      floorPlan.canvas.defaultCursor = 'crosshair';
      if (floorPlan.canvas.freeDrawingBrush) {
        floorPlan.canvas.freeDrawingBrush.color = 'brown';
        floorPlan.canvas.freeDrawingBrush.width = 8;
      }
      toast("Tegn vegger med mus/finger");
    } else {
      floorPlan.canvas.isDrawingMode = false;
      floorPlan.canvas.defaultCursor = 'default';
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
    setDrawingMode('select'); // Reset drawing mode to allow click placement
    toast("Klikk på lerretet for å plassere stikkontakt");
  };

  const addLightSwitch = () => {
    console.log('Adding light switch tool');
    setSelectedToolCategory('electrician');
    setPendingTool('lightSwitch');
    setDrawingMode('select'); // Reset drawing mode to allow click placement
    toast("Klikk på lerretet for å plassere lysbryter");
  };

  const addLight = () => {
    console.log('Adding light tool');
    setSelectedToolCategory('electrician');
    setPendingTool('light');
    setDrawingMode('select'); // Reset drawing mode to allow click placement
    toast("Klikk på lerretet for å plassere lysarmatur");
  };

  // Plumber functions
  const addSink = () => {
    setSelectedToolCategory('plumber');
    setPendingTool('sink');
    setDrawingMode('select'); // Reset drawing mode to allow click placement
    toast("Klikk på lerretet for å plassere vask");
  };

  const addDishwasher = () => {
    setSelectedToolCategory('plumber');
    setPendingTool('dishwasher');
    setDrawingMode('select'); // Reset drawing mode to allow click placement
    toast("Klikk på lerretet for å plassere oppvaskmaskin");
  };

  const addWashingMachine = () => {
    setSelectedToolCategory('plumber');
    setPendingTool('washingMachine');
    setDrawingMode('select'); // Reset drawing mode to allow click placement
    toast("Klikk på lerretet for å plassere vaskemaskin");
  };

  const addShower = () => {
    setSelectedToolCategory('plumber');
    setPendingTool('shower');
    setDrawingMode('select'); // Reset drawing mode to allow click placement
    toast("Klikk på lerretet for å plassere dusj");
  };

  const addToilet = () => {
    setSelectedToolCategory('plumber');
    setPendingTool('toilet');
    setDrawingMode('select'); // Reset drawing mode to allow click placement
    toast("Klikk på lerretet for å plassere toalett");
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

  // Helper function to save canvas state to history
  const saveCanvasState = (floorPlanId: string) => {
    const floorPlan = floorPlans.find(fp => fp.id === floorPlanId);
    if (!floorPlan?.canvas || floorPlan.isUndoing) return;

    const currentState = JSON.stringify(floorPlan.canvas.toJSON());
    const newHistory = floorPlan.history.slice(0, floorPlan.historyIndex + 1);
    newHistory.push(currentState);
    
    if (newHistory.length > 20) {
      newHistory.shift();
    }
    
    updateFloorPlan(floorPlanId, {
      history: newHistory,
      historyIndex: Math.min(floorPlan.historyIndex + 1, 19),
    });
  };

  const undoLastAction = () => {
    const floorPlan = getCurrentFloorPlan();
    if (!floorPlan?.canvas || floorPlan.historyIndex <= 0) {
      toast("Ingen handlinger å angre");
      return;
    }

    console.log('Undoing action. Current history index:', floorPlan.historyIndex);
    updateFloorPlan(floorPlan.id, { isUndoing: true });
    const previousState = floorPlan.history[floorPlan.historyIndex - 1];
    
    floorPlan.canvas.loadFromJSON(previousState, () => {
      floorPlan.canvas!.renderAll();
      updateFloorPlan(floorPlan.id, {
        historyIndex: floorPlan.historyIndex - 1,
        isUndoing: false,
      });
      console.log('Undo completed. New history index:', floorPlan.historyIndex - 1);
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
            <div className="flex items-center justify-center mb-6">
              <TabsList className="flex justify-center items-center gap-2 bg-gray-100 p-1 rounded-lg">
                {floorPlans.map((floorPlan) => (
                  <TabsTrigger 
                    key={floorPlan.id} 
                    value={floorPlan.id} 
                    className="relative group px-4 py-2 rounded-md transition-all"
                  >
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
                        className="absolute -top-1 -right-1 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 rounded-full"
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
                  className="flex items-center gap-1 ml-2 px-3 py-2 rounded-md"
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
                          onClick={() => {
                            const newCategory = selectedToolCategory === 'carpenter' ? 'none' : 'carpenter';
                            setSelectedToolCategory(newCategory);
                            setPendingTool(null); // Clear any active tool when switching categories
                          }}
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
                          onClick={() => {
                            const newCategory = selectedToolCategory === 'electrician' ? 'none' : 'electrician';
                            setSelectedToolCategory(newCategory);
                            setPendingTool(null); // Clear any active tool when switching categories
                          }}
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

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant={selectedToolCategory === 'plumber' ? 'default' : 'outline'} 
                          className="flex items-center gap-2"
                          onClick={() => {
                            const newCategory = selectedToolCategory === 'plumber' ? 'none' : 'plumber';
                            setSelectedToolCategory(newCategory);
                            setPendingTool(null); // Clear any active tool when switching categories
                          }}
                        >
                          <Droplet className="h-4 w-4" />
                          Rørlegger
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={addSink}>
                          Vask
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={addDishwasher}>
                          Oppvaskmaskin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={addWashingMachine}>
                          Vaskemaskin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={addShower}>
                          Dusj
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={addToilet}>
                          Toalett
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Separator for action buttons */}
                    <div className="border-l border-gray-300 h-8 mx-2"></div>
                    
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
                        {pendingTool === 'light' ? 'Klikk for å plassere lysarmatur' : 'Lysarmatur (800kr/stk)'}
                      </Button>
                      {pendingTool && (
                        <Button
                          onClick={() => setPendingTool(null)}
                          variant="secondary"
                          size="sm"
                          className="ml-2"
                        >
                          Stopp plassering
                        </Button>
                      )}
                    </div>
                  )}

                  {selectedToolCategory === 'plumber' && (
                    <div className="flex gap-2 flex-wrap p-3 bg-cyan-50 rounded-lg">
                      <Label className="text-sm font-medium w-full mb-2">Sanitærutstyr:</Label>
                      <Button
                        onClick={addSink}
                        variant={pendingTool === 'sink' ? 'default' : 'outline'}
                        className="flex items-center gap-2"
                      >
                        <Droplet className="h-4 w-4" />
                        {pendingTool === 'sink' ? 'Klikk for å plassere vask' : 'Vask (3000kr/stk)'}
                      </Button>
                      <Button
                        onClick={addDishwasher}
                        variant={pendingTool === 'dishwasher' ? 'default' : 'outline'}
                        className="flex items-center gap-2"
                      >
                        {pendingTool === 'dishwasher' ? 'Klikk for å plassere oppvaskmaskin' : 'Oppvaskmaskin (2500kr/stk)'}
                      </Button>
                      <Button
                        onClick={addWashingMachine}
                        variant={pendingTool === 'washingMachine' ? 'default' : 'outline'}
                        className="flex items-center gap-2"
                      >
                        {pendingTool === 'washingMachine' ? 'Klikk for å plassere vaskemaskin' : 'Vaskemaskin (2000kr/stk)'}
                      </Button>
                      <Button
                        onClick={addShower}
                        variant={pendingTool === 'shower' ? 'default' : 'outline'}
                        className="flex items-center gap-2"
                      >
                        {pendingTool === 'shower' ? 'Klikk for å plassere dusj' : 'Dusj (8000kr/stk)'}
                      </Button>
                      <Button
                        onClick={addToilet}
                        variant={pendingTool === 'toilet' ? 'default' : 'outline'}
                        className="flex items-center gap-2"
                      >
                        {pendingTool === 'toilet' ? 'Klikk for å plassere toalett' : 'Toalett (4000kr/stk)'}
                      </Button>
                      {pendingTool && (
                        <Button
                          onClick={() => setPendingTool(null)}
                          variant="secondary"
                          size="sm"
                          className="ml-2"
                        >
                          Stopp plassering
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                  <canvas 
                    ref={(el) => {
                      canvasRefs.current[floorPlan.id] = el;
                      // Only initialize if canvas doesn't exist and element is ready
                      if (el && !floorPlan.canvas) {
                        const timeoutId = setTimeout(() => {
                          if (!floorPlan.canvas) {
                            console.log('Ref callback: Initializing canvas for floor plan:', floorPlan.id);
                            initializeCanvas(floorPlan.id);
                          }
                        }, 100);
                        // Store timeout to clean up if needed
                        el.dataset.timeoutId = timeoutId.toString();
                      }
                    }}
                    className="max-w-full" 
                  />
                </div>

                {/* Complete Cost Breakdown */}
                {(materialSelections.length > 0 || placedItems.length > 0) && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-4 text-lg">Kostnadsovesikt</h3>
                    
                    {/* Carpenter Materials */}
                    {materialSelections.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2 text-amber-800">Tømrerutgifter - Materialer</h4>
                        <div className="space-y-1 ml-2">
                          {materialSelections.map((selection, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{selection.material.name} ({selection.area.toFixed(2)}m²)</span>
                              <span className="font-medium">{selection.cost.toFixed(0)} kr</span>
                            </div>
                          ))}
                        </div>
                        <div className="border-t mt-2 pt-1 ml-2">
                          <div className="flex justify-between text-sm font-semibold text-amber-800">
                            <span>Subtotal tømrer:</span>
                            <span>{materialSelections.reduce((sum, sel) => sum + sel.cost, 0).toFixed(0)} kr</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Electrical Items */}
                    {placedItems.filter(item => item.category === 'electrician').length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2 text-blue-800">Elektrikerutgifter</h4>
                        <div className="space-y-1 ml-2">
                          {Object.entries(
                            placedItems
                              .filter(item => item.category === 'electrician')
                              .reduce((acc, item) => {
                                acc[item.type] = (acc[item.type] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)
                          ).map(([type, count]) => {
                            const itemInfo = itemPrices[type as keyof typeof itemPrices];
                            return (
                              <div key={type} className="flex justify-between text-sm">
                                <span>{itemInfo.name} ({count} stk)</span>
                                <span className="font-medium">{(itemInfo.price * count).toFixed(0)} kr</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="border-t mt-2 pt-1 ml-2">
                          <div className="flex justify-between text-sm font-semibold text-blue-800">
                            <span>Subtotal elektriker:</span>
                            <span>
                              {placedItems
                                .filter(item => item.category === 'electrician')
                                .reduce((sum, item) => sum + item.price, 0)
                                .toFixed(0)} kr
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Plumber Items */}
                    {placedItems.filter(item => item.category === 'plumber').length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2 text-cyan-800">Rørleggerutgifter</h4>
                        <div className="space-y-1 ml-2">
                          {Object.entries(
                            placedItems
                              .filter(item => item.category === 'plumber')
                              .reduce((acc, item) => {
                                acc[item.type] = (acc[item.type] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)
                          ).map(([type, count]) => {
                            const itemInfo = itemPrices[type as keyof typeof itemPrices];
                            return (
                              <div key={type} className="flex justify-between text-sm">
                                <span>{itemInfo.name} ({count} stk)</span>
                                <span className="font-medium">{(itemInfo.price * count).toFixed(0)} kr</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="border-t mt-2 pt-1 ml-2">
                          <div className="flex justify-between text-sm font-semibold text-cyan-800">
                            <span>Subtotal rørlegger:</span>
                            <span>
                              {placedItems
                                .filter(item => item.category === 'plumber')
                                .reduce((sum, item) => sum + item.price, 0)
                                .toFixed(0)} kr
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Grand Total */}
                    <div className="border-t-2 pt-3 mt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Totalkostnad:</span>
                        <span className="text-green-700">
                          {(
                            materialSelections.reduce((sum, sel) => sum + sel.cost, 0) +
                            placedItems.reduce((sum, item) => sum + item.price, 0)
                          ).toFixed(0)} kr
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Legacy material selector - keep for backward compatibility */}
                {materialSelections.length > 0 && (materialSelections.length > 0 && placedItems.length === 0) && (
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