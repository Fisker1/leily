import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, FabricImage, Path, Line } from 'fabric';
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
  // Tømrer
  gipsplate: { name: 'Gipsplate', price: 150 },
  osbplate: { name: 'OSB plate', price: 120 },
  mdfplate: { name: 'MDF plate', price: 180 },
  trevegg: { name: 'Trevegg', price: 250 },
  
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
  const [selectedMaterial, setSelectedMaterial] = useState<Material>(materials[0]); // Default to first material
  const [showMaterialSelector, setShowMaterialSelector] = useState(false);
  const [selectedToolCategory, setSelectedToolCategory] = useState<'none' | 'carpenter' | 'electrician' | 'plumber'>('none');
  const [pendingTool, setPendingTool] = useState<string | null>(null);
  const pendingToolRef = useRef<string | null>(null);
  const [carpenterMode, setCarpenterMode] = useState<'none' | 'window' | 'wall'>('none');
  const [wallPoints, setWallPoints] = useState<{x: number, y: number}[]>([]);
  const wallPointsRef = useRef<{x: number, y: number}[]>([]);
  const [isDrawingWall, setIsDrawingWall] = useState(false);
  const isDrawingWallRef = useRef(false);
  const [showWallHeightDialog, setShowWallHeightDialog] = useState(false);
  const [currentWallLength, setCurrentWallLength] = useState(0);
  const [tempWallObjects, setTempWallObjects] = useState<any[]>([]);
  const tempWallObjectsRef = useRef<any[]>([]);
  const [wallStartPoint, setWallStartPoint] = useState<{x: number, y: number} | null>(null);
  const [isHoldingForWall, setIsHoldingForWall] = useState(false);
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Keep refs in sync with state
  useEffect(() => {
    pendingToolRef.current = pendingTool;
  }, [pendingTool]);

  useEffect(() => {
    wallPointsRef.current = wallPoints;
  }, [wallPoints]);

  useEffect(() => {
    isDrawingWallRef.current = isDrawingWall;
  }, [isDrawingWall]);

  useEffect(() => {
    tempWallObjectsRef.current = tempWallObjects;
  }, [tempWallObjects]);

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
    const container = canvasElement.parentElement;
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
      // Automatically apply selected material instead of showing dialog
      applyMaterialToObject(path, selectedMaterial);
    });

    canvas.on('mouse:down', (e) => {
      const currentFloor = floorPlans.find(fp => fp.id === floorPlanId);
      const currentTool = pendingToolRef.current;
      
      // Handle simple wall drawing mode with hold-to-draw
      if (currentFloor?.drawingMode === 'wall' && isDrawingWallRef.current) {
        const pointer = canvas.getPointer(e.e);
        
        // Start holding for wall drawing
        setIsHoldingForWall(true);
        setWallStartPoint(pointer);
        
        // Add visual feedback for start point
        const startCircle = new Circle({
          left: pointer.x,
          top: pointer.y,
          radius: 6,
          fill: 'red',
          selectable: false,
          evented: false,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(startCircle);
        setTempWallObjects(prev => [...prev, startCircle]);
        canvas.renderAll();
        return;
      }
      
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
        
        // Apply selected material automatically
        applyMaterialToObject(rect, selectedMaterial);
        setPendingTool(null);
      } else if (currentTool === 'gipsplate' || currentTool === 'osbplate' || 
                 currentTool === 'mdfplate' || currentTool === 'trevegg') {
        // Place material area directly
        const rect = new Rect({
          left: pointer.x,
          top: pointer.y,
          fill: 'rgba(139, 69, 19, 0.3)',
          stroke: currentTool === 'gipsplate' ? 'lightblue' : 
                  currentTool === 'osbplate' ? 'orange' :
                  currentTool === 'mdfplate' ? 'purple' : 'brown',
          strokeWidth: 2,
          width: 100,
          height: 100,
          originX: 'center',
          originY: 'center',
        });
        canvas.add(rect);
        canvas.renderAll();
        saveCanvasState(floorPlanId);
        
        // Calculate area and add as material selection
        const area = (100 * 100) / 10000; // Convert to m²
        const material = materials.find(m => m.id === currentTool.replace('plate', ''));
        if (material) {
          const cost = area * material.pricePerM2;
          const selection: MaterialSelection = {
            objectId: Date.now().toString(),
            material,
            area,
            cost,
          };
          setMaterialSelections(prev => [...prev, selection]);
          toast(`${material.name} område lagt til - ${area.toFixed(2)}m², ${cost.toFixed(0)}kr`);
        }
        // Don't reset pendingTool - allow continuous placement
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
      
      // Handle simple wall drawing completion
      if (currentFloor?.drawingMode === 'wall' && isHoldingForWall && wallStartPoint) {
        const pointer = canvas.getPointer(e.e);
        
        // Clear temporary objects
        tempWallObjectsRef.current.forEach(obj => canvas.remove(obj));
        setTempWallObjects([]);
        
        // Calculate wall length
        const length = Math.sqrt(
          Math.pow(pointer.x - wallStartPoint.x, 2) + Math.pow(pointer.y - wallStartPoint.y, 2)
        ) / 100; // Convert pixels to meters (approximate)
        
        // Draw the final wall
        const wall = new Line([wallStartPoint.x, wallStartPoint.y, pointer.x, pointer.y], {
          stroke: selectedMaterial.id === 'gips' ? 'lightblue' : 
                  selectedMaterial.id === 'osb' ? 'orange' :
                  selectedMaterial.id === 'mdf' ? 'purple' : 'brown',
          strokeWidth: 8,
          selectable: true,
          evented: true,
        });
        canvas.add(wall);
        canvas.renderAll();
        
        // Set current wall length and show height dialog
        setCurrentWallLength(length);
        setIsHoldingForWall(false);
        setWallStartPoint(null);
        setShowWallHeightDialog(true);
        return;
      }
      
      if (currentFloor?.drawingMode === 'area' && e.e.type === 'mouseup') {
        // Handle area selection completion
        const pointer = canvas.getPointer(e.e);
        // This would need more complex implementation for actual area selection
      }
    });

    // Handle double click for finishing walls
    canvas.on('mouse:dblclick', (e) => {
      const currentFloor = floorPlans.find(fp => fp.id === floorPlanId);
      if (currentFloor?.drawingMode === 'wall' && isDrawingWall) {
        finishWall(floorPlanId);
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
      // Wall drawing mode is handled by point-to-point clicking, not free drawing
      floorPlan.canvas.isDrawingMode = false;
      floorPlan.canvas.defaultCursor = 'crosshair';
      // Don't set up free drawing brush for wall mode
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
    setShowMaterialSelector(true); // Show material selector when starting area selection
    toast("Velg material for området først");
  };

  // Start area selection after material is selected
  const startAreaSelection = () => {
    setShowMaterialSelector(false);
    toast(`Klikk på lerretet for å plassere område med ${selectedMaterial.name}`);
  };

  const drawWalls = () => {
    setSelectedToolCategory('carpenter');
    setShowMaterialSelector(true); // Show material selector when starting wall drawing
    toast("Velg material for veggene først");
  };

  // Start wall drawing after material is selected
  const startWallDrawing = () => {
    setDrawingMode('wall');
    setIsDrawingWall(true);
    setWallPoints([]);
    setTempWallObjects([]);
    setShowMaterialSelector(false);
    toast("Klikk for waypoints i kartet. Høyreklikk eller dobbeltklikk for å fullføre veggen.");
  };

  // Helper function to calculate total wall length
  const calculateWallLength = (points: {x: number, y: number}[]) => {
    let totalLength = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i-1].x;
      const dy = points[i].y - points[i-1].y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }
    // Convert pixels to meters (assuming 100 pixels = 1 meter for example)
    return totalLength / 100;
  };

  // Function to finish wall drawing
  const finishWall = (floorPlanId: string) => {
    if (wallPoints.length < 2) {
      toast("Du må ha minst 2 punkter for å lage en vegg");
      return;
    }

    const wallLength = calculateWallLength(wallPoints);
    setCurrentWallLength(wallLength);
    setShowWallHeightDialog(true);
  };

  // Function to complete wall with height
  const completeWallWithHeight = (height: number) => {
    const floorPlan = getCurrentFloorPlan();
    if (!floorPlan?.canvas) return;

    // Convert temp objects to permanent
    tempWallObjects.forEach(obj => {
      obj.selectable = true;
      obj.evented = true;
    });

    // Calculate area (length * height)
    const area = currentWallLength * height;
    const cost = area * selectedMaterial.pricePerM2;

    // Add to material selections using the selected material
    const wallSelection = {
      objectId: Date.now().toString(),
      material: { 
        ...selectedMaterial,
        name: `${selectedMaterial.name} vegg (${currentWallLength.toFixed(1)}m × ${height}m)`,
      },
      area: area,
      cost: cost,
    };

    setMaterialSelections(prev => [...prev, wallSelection]);
    
    // Save canvas state
    saveCanvasState(floorPlan.id);
    
    // Reset wall drawing state
    setIsDrawingWall(false);
    setWallPoints([]);
    setTempWallObjects([]);
    setCurrentWallLength(0);
    setShowWallHeightDialog(false);
    setCarpenterMode('none'); // Reset carpenter mode
    setSelectedToolCategory('none'); // Reset tool category
    setIsHoldingForWall(false);
    setWallStartPoint(null);
    
    // Reset canvas drawing mode
    updateFloorPlan(floorPlan.id, { drawingMode: 'select' });
    floorPlan.canvas.isDrawingMode = false;
    floorPlan.canvas.defaultCursor = 'default';
    floorPlan.canvas.hoverCursor = 'move';
    
    toast(`${selectedMaterial.name} vegg lagt til! ${area.toFixed(2)}m² for ${cost.toFixed(0)} kr`);
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

  // Add carpenter material functions
  const addGipsplate = () => {
    setSelectedToolCategory('carpenter');
    setPendingTool('gipsplate');
    setDrawingMode('select');
    toast("Klikk på lerretet for å plassere gipsplate område");
  };

  const addOsbplate = () => {
    setSelectedToolCategory('carpenter');
    setPendingTool('osbplate');
    setDrawingMode('select');
    toast("Klikk på lerretet for å plassere OSB plate område");
  };

  const addMdfplate = () => {
    setSelectedToolCategory('carpenter');
    setPendingTool('mdfplate');
    setDrawingMode('select');
    toast("Klikk på lerretet for å plassere MDF plate område");
  };

  const addTrevegg = () => {
    setSelectedToolCategory('carpenter');
    setPendingTool('trevegg');
    setDrawingMode('select');
    toast("Klikk på lerretet for å plassere trevegg område");
  };

  // Helper function to apply material to object
  const applyMaterialToObject = (obj: any, material: Material) => {
    // Calculate area for the object
    let area = 0;
    if (obj.type === 'rect') {
      area = (obj.width * obj.scaleX) * (obj.height * obj.scaleY) / 10000; // Convert to m²
    } else if (obj.type === 'path') {
      // For drawn paths, estimate area based on bounding box
      const bounds = obj.getBoundingRect();
      area = (bounds.width * bounds.height) / 10000; // Convert to m²
    } else if (obj.type === 'circle') {
      const radius = obj.radius * obj.scaleX;
      area = (Math.PI * radius * radius) / 10000; // Convert to m²
    }

    if (area <= 0) {
      toast("Kunne ikke beregne areal for objektet");
      return;
    }

    const cost = area * material.pricePerM2;

    const selection = {
      objectId: obj.id || Date.now().toString(),
      material,
      area,
      cost,
    };

    setMaterialSelections(prev => [...prev, selection]);
    toast(`${material.name} område lagt til - ${area.toFixed(2)}m², ${cost.toFixed(0)}kr`);
  };

  // Material selection functions - simplified, just sets selected material
  const handleMaterialSelection = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      setSelectedMaterial(material);
      toast(`Valgte materiale: ${material.name}`);
    }
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
                    {/* Mobile version - just icon */}
                    <div className="sm:hidden">
                      <Button 
                        variant={selectedToolCategory === 'carpenter' ? 'default' : 'outline'} 
                        className="flex items-center gap-2 min-w-0 text-sm"
                        onClick={() => {
                          if (selectedToolCategory === 'carpenter') {
                            // If already selected, deselect
                            setSelectedToolCategory('none');
                            setPendingTool(null);
                            setShowMaterialSelector(false);
                          } else {
                            // If not selected, select and show material selector
                            setSelectedToolCategory('carpenter');
                            setPendingTool(null);
                            setShowMaterialSelector(true);
                            toast("Velg material for veggene først");
                          }
                        }}
                      >
                        <Hammer className="h-4 w-4" />
                        {selectedToolCategory === 'carpenter' && <span className="text-xs">Tømrer</span>}
                      </Button>
                    </div>
                    
                    {/* Desktop version - dropdown */}  
                    <div className="hidden sm:block">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button 
                            variant={selectedToolCategory === 'carpenter' ? 'default' : 'outline'} 
                            className="flex items-center gap-2 min-w-0 text-sm"
                            onClick={() => {
                              const newCategory = selectedToolCategory === 'carpenter' ? 'none' : 'carpenter';
                              setSelectedToolCategory(newCategory);
                              setPendingTool(null);
                            }}
                          >
                            <Hammer className="h-4 w-4" />
                            <span>Tømrer</span>
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={drawWalls}>
                            <PenTool className="h-4 w-4 mr-2" />
                            Tegn vegger
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Mobile version - just icon */}
                    <div className="sm:hidden">
                      <Button 
                        variant={selectedToolCategory === 'electrician' ? 'default' : 'outline'} 
                        className="flex items-center gap-2 min-w-0 text-sm"
                        onClick={() => {
                          const newCategory = selectedToolCategory === 'electrician' ? 'none' : 'electrician';
                          setSelectedToolCategory(newCategory);
                          setPendingTool(null);
                        }}
                      >
                        <Zap className="h-4 w-4" />
                        {selectedToolCategory === 'electrician' && <span className="text-xs">Elektriker</span>}
                      </Button>
                    </div>
                    
                    {/* Desktop version - dropdown */}
                    <div className="hidden sm:block">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant={selectedToolCategory === 'electrician' ? 'default' : 'outline'} 
                            className="flex items-center gap-2 min-w-0 text-sm"
                            onClick={() => {
                              const newCategory = selectedToolCategory === 'electrician' ? 'none' : 'electrician';
                              setSelectedToolCategory(newCategory);
                              setPendingTool(null);
                            }}
                          >
                            <Zap className="h-4 w-4" />
                            <span>Elektriker</span>
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
                    </div>

                    {/* Mobile version - just icon */}
                    <div className="sm:hidden">
                      <Button 
                        variant={selectedToolCategory === 'plumber' ? 'default' : 'outline'} 
                        className="flex items-center gap-2 min-w-0 text-sm"
                        onClick={() => {
                          const newCategory = selectedToolCategory === 'plumber' ? 'none' : 'plumber';
                          setSelectedToolCategory(newCategory);
                          setPendingTool(null);
                        }}
                      >
                        <Droplet className="h-4 w-4" />
                        {selectedToolCategory === 'plumber' && <span className="text-xs">Rørlegger</span>}
                      </Button>
                    </div>
                    
                    {/* Desktop version - dropdown */}
                    <div className="hidden sm:block">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant={selectedToolCategory === 'plumber' ? 'default' : 'outline'} 
                            className="flex items-center gap-2 min-w-0 text-sm"
                            onClick={() => {
                              const newCategory = selectedToolCategory === 'plumber' ? 'none' : 'plumber';
                              setSelectedToolCategory(newCategory);
                              setPendingTool(null);
                            }}
                          >
                            <Droplet className="h-4 w-4" />
                            <span>Rørlegger</span>
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
                    </div>

                    {/* Separator for action buttons - hidden on mobile */}
                    <div className="border-l border-gray-300 h-8 mx-2 hidden sm:block"></div>
                    
                    <Button onClick={clearCanvas} variant="destructive" size="sm" className="text-xs px-2 sm:px-4">
                      <span className="hidden sm:inline">Tøm canvas</span>
                      <span className="sm:hidden">Tøm</span>
                    </Button>
                    
                    <Button 
                      onClick={undoLastAction} 
                      variant="outline"
                      size="sm"
                      disabled={!getCurrentFloorPlan() || getCurrentFloorPlan()!.historyIndex <= 0}
                      className="flex items-center gap-1 sm:gap-2 text-xs px-2 sm:px-4"
                    >
                      <Undo className="h-4 w-4" />
                      <span className="hidden sm:inline">Angre</span>
                    </Button>
                    
                    <Button 
                      onClick={deleteSelected} 
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 sm:gap-2 text-xs px-2 sm:px-4"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Slett valgte</span>
                      <span className="sm:hidden">Slett</span>
                    </Button>
                  </div>

                  {/* Carpenter tool options */}
                  {selectedToolCategory === 'carpenter' && (
                    <div className="flex gap-1 sm:gap-2 flex-wrap p-2 sm:p-3 bg-amber-50 rounded-lg">
                      <Label className="text-xs sm:text-sm font-medium w-full mb-1 sm:mb-2">Tømrerarbeider:</Label>
                      
                      {/* Mobile version - show window or draw wall options first */}
                      <div className="sm:hidden w-full">
                        {carpenterMode === 'none' && (
                          <div className="flex gap-2">
                            <Button 
                              onClick={() => setCarpenterMode('window')}
                              variant="outline" 
                              size="sm" 
                              className="flex items-center gap-1 text-xs flex-1"
                            >
                              <Square className="h-3 w-3" />
                              <span>Vindu</span>
                            </Button>
                            <Button 
                              onClick={() => setCarpenterMode('wall')}
                              variant="outline" 
                              size="sm" 
                              className="flex items-center gap-1 text-xs flex-1"
                            >
                              <PenTool className="h-3 w-3" />
                              <span>Tegn vegg</span>
                            </Button>
                          </div>
                        )}

                        {/* Wall material selector - only shown after selecting "tegn vegg" */}
                        {carpenterMode === 'wall' && (
                          <div className="w-full space-y-2">
                            <div className="flex justify-between items-center">
                              <Label className="text-sm font-medium">Velg veggmateriale:</Label>
                              <Button 
                                onClick={() => setCarpenterMode('none')}
                                variant="ghost" 
                                size="sm" 
                                className="text-xs px-2"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {materials.map((material) => (
                                <Button
                                  key={material.id}
                                  variant={selectedMaterial.id === material.id ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => {
                                    setSelectedMaterial(material);
                                    startWallDrawing();
                                  }}
                                  className="text-xs p-2"
                                >
                                  <div className="text-center">
                                    <div className="font-medium">{material.name.split(' ')[0]}</div>
                                    <div className="text-xs opacity-75">({material.pricePerM2}kr)</div>
                                  </div>
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        {carpenterMode === 'window' && (
                          <div className="w-full">
                            <div className="flex justify-between items-center mb-2">
                              <Label className="text-sm font-medium">Vindu alternativer:</Label>
                              <Button 
                                onClick={() => setCarpenterMode('none')}
                                variant="ghost" 
                                size="sm" 
                                className="text-xs px-2"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button variant="outline" size="sm" className="text-xs">
                              Standardvindu (2000kr)
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Desktop version - show draw walls button */}
                      <div className="hidden sm:block">
                        <Button onClick={drawWalls} variant="outline" size="sm" className="flex items-center gap-1 sm:gap-2 text-xs">
                          <PenTool className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Tegn vegger med waypoints</span>
                        </Button>
                      </div>
                      
                      {/* Material selector for wall drawing - appears when draw walls is clicked (desktop) */}
                      {showMaterialSelector && (
                        <div className="w-full mt-2 sm:mt-4 p-3 bg-white border rounded-lg">
                          <Label className="text-sm font-semibold mb-2 block">Velg veggmateriale:</Label>
                          <div className="flex gap-2 flex-wrap">
                            {materials.map((material) => (
                              <Button
                                key={material.id}
                                variant={selectedMaterial.id === material.id ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                  setSelectedMaterial(material);
                                  startWallDrawing();
                                }}
                                className="text-xs"
                              >
                                <span className="sm:hidden">{material.name.split(' ')[0]} ({material.pricePerM2}kr)</span>
                                <span className="hidden sm:inline">{material.name} ({material.pricePerM2}kr/m²)</span>
                              </Button>
                            ))}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowMaterialSelector(false)}
                            className="mt-2 text-xs"
                          >
                            Avbryt
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedToolCategory === 'electrician' && (
                    <div className="flex gap-1 sm:gap-2 flex-wrap p-2 sm:p-3 bg-blue-50 rounded-lg">
                      <Label className="text-xs sm:text-sm font-medium w-full mb-1 sm:mb-2">Elektriske installasjoner:</Label>
                      <Button
                        onClick={addOutlet}
                        variant={pendingTool === 'outlet' ? 'default' : 'outline'}
                        size="sm"
                        className="flex items-center gap-1 sm:gap-2 text-xs min-w-0"
                      >
                        <Zap className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">
                          {pendingTool === 'outlet' ? (
                            <>
                              <span className="sm:hidden">Klikk å plassere</span>
                              <span className="hidden sm:inline">Klikk for å plassere stikkontakt</span>
                            </>
                          ) : (
                            <>
                              <span className="sm:hidden">Kontakt (500kr)</span>
                              <span className="hidden sm:inline">Stikkontakt (500kr/stk)</span>
                            </>
                          )}
                        </span>
                      </Button>
                      <Button
                        onClick={addLightSwitch}
                        variant={pendingTool === 'lightSwitch' ? 'default' : 'outline'}
                        size="sm"
                        className="flex items-center gap-1 sm:gap-2 text-xs min-w-0"
                      >
                        <Zap className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">
                          {pendingTool === 'lightSwitch' ? (
                            <>
                              <span className="sm:hidden">Klikk å plassere</span>
                              <span className="hidden sm:inline">Klikk for å plassere lysbryter</span>
                            </>
                          ) : (
                            <>
                              <span className="sm:hidden">Bryter (300kr)</span>
                              <span className="hidden sm:inline">Lysbryter (300kr/stk)</span>
                            </>
                          )}
                        </span>
                      </Button>
                      <Button
                        onClick={addLight}
                        variant={pendingTool === 'light' ? 'default' : 'outline'}
                        size="sm"
                        className="flex items-center gap-1 sm:gap-2 text-xs min-w-0"
                      >
                        <Zap className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">
                          {pendingTool === 'light' ? (
                            <>
                              <span className="sm:hidden">Klikk å plassere</span>
                              <span className="hidden sm:inline">Klikk for å plassere lysarmatur</span>
                            </>
                          ) : (
                            <>
                              <span className="sm:hidden">Armatur (800kr)</span>
                              <span className="hidden sm:inline">Lysarmatur (800kr/stk)</span>
                            </>
                          )}
                        </span>
                      </Button>
                      {pendingTool && (
                        <Button
                          onClick={() => setPendingTool(null)}
                          variant="secondary"
                          size="sm"
                          className="text-xs px-2"
                        >
                          <span className="hidden sm:inline">Stopp plassering</span>
                          <span className="sm:hidden">Stopp</span>
                        </Button>
                      )}
                    </div>
                  )}

                  {selectedToolCategory === 'plumber' && (
                    <div className="flex gap-1 sm:gap-2 flex-wrap p-2 sm:p-3 bg-cyan-50 rounded-lg">
                      <Label className="text-xs sm:text-sm font-medium w-full mb-1 sm:mb-2">Sanitærutstyr:</Label>
                      <Button
                        onClick={addSink}
                        variant={pendingTool === 'sink' ? 'default' : 'outline'}
                        size="sm"
                        className="flex items-center gap-1 sm:gap-2 text-xs min-w-0"
                      >
                        <Droplet className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">
                          {pendingTool === 'sink' ? (
                            <>
                              <span className="sm:hidden">Klikk å plassere</span>
                              <span className="hidden sm:inline">Klikk for å plassere vask</span>
                            </>
                          ) : (
                            <>
                              <span className="sm:hidden">Vask (3000kr)</span>
                              <span className="hidden sm:inline">Vask (3000kr/stk)</span>
                            </>
                          )}
                        </span>
                      </Button>
                      <Button
                        onClick={addDishwasher}
                        variant={pendingTool === 'dishwasher' ? 'default' : 'outline'}
                        size="sm"
                        className="flex items-center gap-1 sm:gap-2 text-xs min-w-0"
                      >
                        <Droplet className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">
                          {pendingTool === 'dishwasher' ? (
                            <>
                              <span className="sm:hidden">Klikk å plassere</span>
                              <span className="hidden sm:inline">Klikk for å plassere oppvaskmaskin</span>
                            </>
                          ) : (
                            <>
                              <span className="sm:hidden">Oppvask (2500kr)</span>
                              <span className="hidden sm:inline">Oppvaskmaskin (2500kr/stk)</span>
                            </>
                          )}
                        </span>
                      </Button>
                      <Button
                        onClick={addWashingMachine}
                        variant={pendingTool === 'washingMachine' ? 'default' : 'outline'}
                        size="sm"
                        className="flex items-center gap-1 sm:gap-2 text-xs min-w-0"
                      >
                        <Droplet className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">
                          {pendingTool === 'washingMachine' ? (
                            <>
                              <span className="sm:hidden">Klikk å plassere</span>
                              <span className="hidden sm:inline">Klikk for å plassere vaskemaskin</span>
                            </>
                          ) : (
                            <>
                              <span className="sm:hidden">Vaske (2000kr)</span>
                              <span className="hidden sm:inline">Vaskemaskin (2000kr/stk)</span>
                            </>
                          )}
                        </span>
                      </Button>
                      <Button
                        onClick={addShower}
                        variant={pendingTool === 'shower' ? 'default' : 'outline'}
                        size="sm"
                        className="flex items-center gap-1 sm:gap-2 text-xs min-w-0"
                      >
                        <Droplet className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">
                          {pendingTool === 'shower' ? (
                            <>
                              <span className="sm:hidden">Klikk å plassere</span>
                              <span className="hidden sm:inline">Klikk for å plassere dusj</span>
                            </>
                          ) : (
                            <>
                              <span className="sm:hidden">Dusj (8000kr)</span>
                              <span className="hidden sm:inline">Dusj (8000kr/stk)</span>
                            </>
                          )}
                        </span>
                      </Button>
                      <Button
                        onClick={addToilet}
                        variant={pendingTool === 'toilet' ? 'default' : 'outline'}
                        size="sm"
                        className="flex items-center gap-1 sm:gap-2 text-xs min-w-0"
                      >
                        <Droplet className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">
                          {pendingTool === 'toilet' ? (
                            <>
                              <span className="sm:hidden">Klikk å plassere</span>
                              <span className="hidden sm:inline">Klikk for å plassere toalett</span>
                            </>
                          ) : (
                            <>
                              <span className="sm:hidden">Toalett (4000kr)</span>
                              <span className="hidden sm:inline">Toalett (4000kr/stk)</span>
                            </>
                          )}
                        </span>
                      </Button>
                      {pendingTool && (
                        <Button
                          onClick={() => setPendingTool(null)}
                          variant="secondary"
                          size="sm"
                          className="text-xs px-2"
                        >
                          <span className="hidden sm:inline">Stopp plassering</span>
                          <span className="sm:hidden">Stopp</span>
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
                    className="w-full block" 
                    style={{ 
                      aspectRatio: window.innerWidth < 768 ? '4/3' : '4/3',
                      maxHeight: window.innerWidth < 768 ? '300px' : 'calc(100vh - 400px)', 
                      minHeight: window.innerWidth < 768 ? '250px' : '300px'
                    }}
                  />
                </div>

                {/* Complete Cost Breakdown */}
                {(materialSelections.length > 0 || placedItems.length > 0) && (
                  <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Kostnadsovesikt</h3>
                    
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

            <Dialog open={showWallHeightDialog} onOpenChange={setShowWallHeightDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Vegg høyde</DialogTitle>
                  <DialogDescription>
                    Skriv inn høyden på veggen for å beregne areal og pris
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wall-height">Høyde (meter)</Label>
                    <Input
                      id="wall-height"
                      type="number"
                      placeholder="2.7"
                      step="0.1"
                      min="0.1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const height = parseFloat((e.target as HTMLInputElement).value);
                          if (height > 0) {
                            completeWallWithHeight(height);
                          }
                        }
                      }}
                    />
                    <p className="text-sm text-gray-600">
                      Vegglengde: {currentWallLength.toFixed(1)} meter
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        const input = document.getElementById('wall-height') as HTMLInputElement;
                        const height = parseFloat(input.value);
                        if (height > 0) {
                          completeWallWithHeight(height);
                        } else {
                          toast("Vennligst skriv inn en gyldig høyde");
                        }
                      }}
                    >
                      Bekreft
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Cancel wall creation - remove temp objects
                        const floorPlan = getCurrentFloorPlan();
                        if (floorPlan?.canvas) {
                          tempWallObjects.forEach(obj => {
                            floorPlan.canvas!.remove(obj);
                          });
                          floorPlan.canvas.renderAll();
                        }
                        setShowWallHeightDialog(false);
                        setIsDrawingWall(false);
                        setWallPoints([]);
                        setTempWallObjects([]);
                        setDrawingMode('select');
                        toast("Vegg avbrutt");
                      }}
                    >
                      Avbryt
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showMaterialDialog} onOpenChange={setShowMaterialDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Velg materialtype</DialogTitle>
                  <DialogDescription>
                    Velg hvilket materiale du ønsker å bruke for dette området
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Select onValueChange={(materialId) => {
                    handleMaterialSelection(materialId);
                    setShowMaterialDialog(false);
                  }}>
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