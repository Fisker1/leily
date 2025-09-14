import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, Group, Line, Ellipse, FabricImage } from 'fabric';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Hammer, Zap, Undo, Trash2, Plus, X, Droplet, ImageIcon, FileImage, ZoomIn, ZoomOut } from 'lucide-react';
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
  
  // State for drawing walls with waypoints
  const [wallPoints, setWallPoints] = useState<{x: number, y: number}[]>([]);
  const [isDrawingWall, setIsDrawingWall] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
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
    if (!canvasElement) {
      console.log('Canvas element not found for', floorPlanId);
      return;
    }

    // Check if canvas is already initialized and dispose if needed
    const existingFloorPlan = floorPlans.find(fp => fp.id === floorPlanId);
    if (existingFloorPlan?.canvas) {
      console.log('Disposing existing canvas for', floorPlanId);
      try {
        existingFloorPlan.canvas.dispose();
      } catch (error) {
        console.log('Error disposing canvas:', error);
      }
      updateFloorPlan(floorPlanId, { canvas: null });
    }

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

    try {
      console.log('Creating new canvas for', floorPlanId);
      const canvas = new FabricCanvas(canvasElement, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: "#ffffff",
      });

      // Wait for canvas to be fully initialized before setting properties
      setTimeout(() => {
        try {
          if (canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.color = '#333333';
            canvas.freeDrawingBrush.width = 3;
          }
          
          console.log('Canvas initialized successfully for', floorPlanId);
          
          // Restore background image if it exists
          const existingBackground = existingFloorPlan?.backgroundImage;
          if (existingBackground) {
            console.log('Restoring background image for', floorPlanId);
            
            // Create HTML image element first
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
              try {
                // Create Fabric image from the loaded HTML image element
                const fabricImg = new FabricImage(img);
                
                // Scale and center the image
                const canvasAspect = canvas.width / canvas.height;
                const imageAspect = fabricImg.width / fabricImg.height;
                
                if (imageAspect > canvasAspect) {
                  fabricImg.scaleToWidth(canvas.width * 0.9);
                } else {
                  fabricImg.scaleToHeight(canvas.height * 0.9);
                }
                
                fabricImg.set({
                  left: canvas.width / 2,
                  top: canvas.height / 2,
                  originX: 'center',
                  originY: 'center',
                  opacity: 0.7,
                  selectable: false,
                  evented: false
                });
                
                // Mark this as background image
                (fabricImg as any).isBackgroundImage = true;
                
                // Add image to canvas and send it to back
                canvas.add(fabricImg);
                canvas.sendObjectToBack(fabricImg);
                canvas.renderAll();
                
                console.log('Background image restored for', floorPlanId);
              } catch (error) {
                console.error('Failed to create Fabric image for restoration:', error);
              }
            };
            
            img.onerror = () => {
              console.error('Failed to load background image for restoration');
            };
            
            img.src = existingBackground;
          }
          
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
        } catch (error) {
          console.error('Error setting canvas properties:', error);
        }
      }, 100);

    } catch (error) {
      console.error('Error creating canvas:', error);
      toast("Feil ved initialisering av lerret. Prøv å laste siden på nytt.");
    }
  };

  // Update canvas drawing mode when tool changes
  useEffect(() => {
    floorPlans.forEach(fp => {
      if (fp.canvas && fp.canvas.freeDrawingBrush) {
        try {
          // Disable drawing mode for wall tool - we'll handle waypoints manually
          if (selectedTool === 'carpenter' && carpenterTool === 'wall') {
            fp.canvas.isDrawingMode = false;
            // Reset wall drawing state when switching away from wall tool
            if (!isDrawingWall) {
              setWallPoints([]);
            }
          } else {
            fp.canvas.isDrawingMode = false;
            // Reset wall drawing state when switching tools
            setWallPoints([]);
            setIsDrawingWall(false);
          }
          fp.canvas.renderAll();
        } catch (error) {
          console.error('Error updating canvas drawing mode:', error);
        }
      }
    });
  }, [selectedTool, carpenterTool, floorPlans, isDrawingWall]);

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
        // Enable drawing mode for walls - don't place objects
        if (canvas.freeDrawingBrush) {
          canvas.isDrawingMode = true;
          canvas.freeDrawingBrush.color = '#8B4513';
          canvas.freeDrawingBrush.width = 8;
          canvas.renderAll();
          toast("Tegningsmodus aktivert - tegn vegger direkte på lerretet!");
        } else {
          toast("Lerret ikke klart for tegning. Prøv på nytt.");
        }
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
        // Simple outlet icon - single circle with slots
        shape = new Circle({
          radius: 15,
          left: pointer.x,
          top: pointer.y,
          fill: 'white',
          stroke: '#333',
          strokeWidth: 2,
          originX: 'center',
          originY: 'center',
        });
        itemData = itemPrices.outlet;
        break;
      case 'lightSwitch':
        // Simple switch icon - rectangle
        shape = new Rect({
          width: 20,
          height: 30,
          left: pointer.x,
          top: pointer.y,
          fill: 'white',
          stroke: '#333',
          strokeWidth: 2,
          originX: 'center',
          originY: 'center',
        });
        itemData = itemPrices.lightSwitch;
        break;
      case 'light':
        // Simple light icon - filled circle
        shape = new Circle({
          radius: 12,
          left: pointer.x,
          top: pointer.y,
          fill: '#FFD700',
          stroke: '#333',
          strokeWidth: 2,
          originX: 'center',
          originY: 'center',
        });
        itemData = itemPrices.light;
        break;
      case 'electricalPanel':
        // Simple panel icon - larger rectangle
        shape = new Rect({
          width: 40,
          height: 60,
          left: pointer.x,
          top: pointer.y,
          fill: '#E5E5E5',
          stroke: '#333',
          strokeWidth: 3,
          originX: 'center',
          originY: 'center',
        });
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
    let shape;
    let itemData;

    switch (tool) {
      case 'sink':
        // Simple sink icon - rectangle
        shape = new Rect({
          width: 35,
          height: 25,
          left: pointer.x,
          top: pointer.y,
          fill: 'lightblue',
          stroke: '#333',
          strokeWidth: 2,
          originX: 'center',
          originY: 'center',
        });
        itemData = itemPrices.sink;
        break;
      case 'dishwasher':
        // Simple dishwasher icon - square
        shape = new Rect({
          width: 30,
          height: 30,
          left: pointer.x,
          top: pointer.y,
          fill: 'white',
          stroke: '#333',
          strokeWidth: 2,
          originX: 'center',
          originY: 'center',
        });
        itemData = itemPrices.dishwasher;
        break;
      case 'washingMachine':
        // Simple washing machine icon - circle
        shape = new Circle({
          radius: 18,
          left: pointer.x,
          top: pointer.y,
          fill: 'lightgray',
          stroke: '#333',
          strokeWidth: 2,
          originX: 'center',
          originY: 'center',
        });
        itemData = itemPrices.washingMachine;
        break;
      case 'shower':
        // Simple shower icon - larger square
        shape = new Rect({
          width: 40,
          height: 40,
          left: pointer.x,
          top: pointer.y,
          fill: 'lightblue',
          stroke: '#333',
          strokeWidth: 2,
          originX: 'center',
          originY: 'center',
        });
        itemData = itemPrices.shower;
        break;
      case 'toilet':
        // Simple toilet icon - oval
        shape = new Ellipse({
          rx: 12,
          ry: 18,
          left: pointer.x,
          top: pointer.y,
          fill: 'white',
          stroke: '#333',
          strokeWidth: 2,
          originX: 'center',
          originY: 'center',
        });
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
    
    // Prevent multiple rapid clicks
    if (overlayFlashing) return;
    
    let clientX, clientY;
    
    if ('touches' in e.nativeEvent && e.nativeEvent.changedTouches.length > 0) {
      const touch = e.nativeEvent.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else if ('clientX' in e.nativeEvent) {
      clientX = e.nativeEvent.clientX;
      clientY = e.nativeEvent.clientY;
    } else {
      return;
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
    
    // Flash briefly to show click registered
    setOverlayFlashing(true);
    setTimeout(() => setOverlayFlashing(false), 200);
    
    // Handle tool placement
    try {
      if (selectedTool === 'carpenter' && carpenterTool) {
        if (carpenterTool === 'wall') {
          // Handle wall waypoint clicking
          handleWallClick(canvas, {x, y});
        } else {
          handleCarpenterTool(canvas, {x, y}, carpenterTool, floorPlanId);
        }
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

  // Handle long press for finishing walls
  const handleOverlayLongPress = (e: React.MouseEvent | React.TouchEvent, floorPlanId: string) => {
    if (selectedTool === 'carpenter' && carpenterTool === 'wall' && isDrawingWall) {
      e.preventDefault();
      e.stopPropagation();
      
      const canvas = getCurrentFloorPlan()?.canvas;
      if (canvas) {
        handleLongPress(canvas);
      }
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
      backgroundImage: undefined, // Clear from floor plan data too
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
      toast("Lerret ikke initialisert. Prøv igjen om et øyeblikk.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      
      try {
        const canvas = currentFloor.canvas!;
        
        // Create an HTML image element to load the image first
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          try {
            // Create Fabric image from the loaded HTML image element
            const fabricImg = new FabricImage(img);
            
                // Scale image to fit canvas while maintaining aspect ratio - stretch to fill
                fabricImg.scaleToWidth(canvas.width * 0.95);
                fabricImg.scaleToHeight(canvas.height * 0.95);
            
              // Center the image and make it non-selectable
              fabricImg.set({
                left: canvas.width / 2,
                top: canvas.height / 2,
                originX: 'center',
                originY: 'center',
                opacity: 0.7,
                selectable: false,
                evented: false
              });
              
              // Clear any existing background images
              const existingBg = canvas.getObjects().find(obj => (obj as any).isBackgroundImage);
              if (existingBg) {
                canvas.remove(existingBg);
              }
              
              // Mark this as background image
              (fabricImg as any).isBackgroundImage = true;
              
              // Add image to canvas and send it to back
              canvas.add(fabricImg);
              canvas.sendObjectToBack(fabricImg);
              canvas.renderAll();
            
            // Update floor plan with background image URL
            updateFloorPlan(currentFloor.id, { 
              backgroundImage: imageUrl 
            });
            
            console.log('Background image loaded successfully', {
              imageSize: { width: fabricImg.width, height: fabricImg.height },
              canvasSize: { width: canvas.width, height: canvas.height },
              scaledSize: { width: fabricImg.getScaledWidth(), height: fabricImg.getScaledHeight() }
            });
            
            toast("Bakgrunnsbilde lastet opp og synlig på lerrettet!");
          } catch (fabricError) {
            console.error('Error creating Fabric image:', fabricError);
            toast("Feil ved opprettelse av bakgrunnsbilde.");
          }
        };
        
        img.onerror = () => {
          console.error('Error loading image');
          toast("Feil ved lasting av bakgrunnsbilde. Prøv et annet bildeformat.");
        };
        
        img.src = imageUrl;
        
      } catch (error) {
        console.error('Error in image loading:', error);
        toast("Feil ved lasting av bakgrunnsbilde.");
      }
    };
    
    reader.onerror = () => {
      toast("Feil ved lesing av fil.");
    };
    
    reader.readAsDataURL(file);
    
    // Clear the input so the same file can be uploaded again
    event.target.value = '';
  };

  // Zoom functions
  const zoomIn = () => {
    const currentFloor = getCurrentFloorPlan();
    if (!currentFloor?.canvas) return;
    
    const newZoom = Math.min(zoomLevel * 1.2, 3);
    setZoomLevel(newZoom);
    currentFloor.canvas.setZoom(newZoom);
    currentFloor.canvas.renderAll();
  };

  const zoomOut = () => {
    const currentFloor = getCurrentFloorPlan();
    if (!currentFloor?.canvas) return;
    
    const newZoom = Math.max(zoomLevel * 0.8, 0.3);
    setZoomLevel(newZoom);
    currentFloor.canvas.setZoom(newZoom);
    currentFloor.canvas.renderAll();
  };

  const resetZoom = () => {
    const currentFloor = getCurrentFloorPlan();
    if (!currentFloor?.canvas) return;
    
    setZoomLevel(1);
    currentFloor.canvas.setZoom(1);
    currentFloor.canvas.renderAll();
  };

  // Handle wall drawing with waypoints
  const handleWallClick = (canvas: FabricCanvas, pointer: any) => {
    if (selectedTool !== 'carpenter' || carpenterTool !== 'wall') return;
    
    const point = { x: pointer.x, y: pointer.y };
    
    if (!isDrawingWall) {
      // Start new wall
      setIsDrawingWall(true);
      setWallPoints([point]);
      toast("Klikk for å legge til flere punkter. Hold inne for å fullføre veggen.");
    } else {
      // Add waypoint
      const newPoints = [...wallPoints, point];
      setWallPoints(newPoints);
      
      // Draw line from previous point to current point
      if (newPoints.length > 1) {
        const prevPoint = newPoints[newPoints.length - 2];
        const line = new Line([prevPoint.x, prevPoint.y, point.x, point.y], {
          stroke: '#8B4513',
          strokeWidth: 8,
          selectable: false,
          evented: false
        });
        
        canvas.add(line);
        canvas.renderAll();
      }
      
      // Add a small circle at the waypoint
      const waypoint = new Circle({
        left: point.x,
        top: point.y,
        radius: 4,
        fill: '#8B4513',
        selectable: false,
        evented: false,
        originX: 'center',
        originY: 'center'
      });
      
      canvas.add(waypoint);
      canvas.renderAll();
    }
  };

  // Handle long press to finish wall
  const handleLongPress = (canvas: FabricCanvas) => {
    if (isDrawingWall && wallPoints.length > 1) {
      setIsDrawingWall(false);
      setWallPoints([]);
      toast("Vegg fullført!");
    }
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
                  <div key={plan.id} className="relative group">
                    <TabsTrigger value={plan.id} className="relative">
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
                    </TabsTrigger>
                    {floorPlans.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground hover:bg-destructive/80 z-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFloorPlan(plan.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
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
                         className="flex flex-col items-center justify-center w-16 h-16 p-2"
                       >
                         <Hammer className="h-6 w-6 mb-1" />
                         {!isMobile && <span className="text-xs">Tømrer</span>}
                       </Button>
                       <Button
                         variant={selectedTool === 'electrician' ? 'default' : 'outline'}
                         onClick={() => {
                           setSelectedTool('electrician');
                           setCarpenterTool(null);
                           setPlumberTool(null);
                         }}
                         className="flex flex-col items-center justify-center w-16 h-16 p-2"
                       >
                         <Zap className="h-6 w-6 mb-1" />
                         {!isMobile && <span className="text-xs">Elektriker</span>}
                       </Button>
                       <Button
                         variant={selectedTool === 'plumber' ? 'default' : 'outline'}
                         onClick={() => {
                           setSelectedTool('plumber');
                           setCarpenterTool(null);
                           setElectricianTool(null);
                         }}
                         className="flex flex-col items-center justify-center w-16 h-16 p-2"
                       >
                         <Droplet className="h-6 w-6 mb-1" />
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
                            className="flex flex-col items-center justify-center w-16 h-16 p-2"
                          >
                            <div className="w-4 h-3 border border-current mb-1" />
                            <span className="text-xs">Vindu</span>
                          </Button>
                          <Button
                            variant={carpenterTool === 'door' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCarpenterTool('door')}
                            className="flex flex-col items-center justify-center w-16 h-16 p-2"
                          >
                            <div className="w-3 h-4 border border-current rounded-r mb-1" />
                            <span className="text-xs">Dør</span>
                          </Button>
                          <Button
                            variant={carpenterTool === 'wall' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCarpenterTool('wall')}
                            className="flex flex-col items-center justify-center h-16 p-2 col-span-2"
                          >
                            <div className="w-6 h-1 bg-current mb-1" />
                            <span className="text-xs">Tegn vegg</span>
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
                            className="flex flex-col items-center justify-center w-16 h-16 p-2"
                          >
                            <Zap className="h-4 w-4 mb-1" />
                            <span className="text-xs">Stikkontakt</span>
                          </Button>
                          <Button
                            variant={electricianTool === 'lightSwitch' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setElectricianTool('lightSwitch')}
                            className="flex flex-col items-center justify-center w-16 h-16 p-2"
                          >
                            <div className="w-4 h-4 border border-current rounded-sm mb-1" />
                            <span className="text-xs">Lysbryter</span>
                          </Button>
                          <Button
                            variant={electricianTool === 'light' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setElectricianTool('light')}
                            className="flex flex-col items-center justify-center w-16 h-16 p-2"
                          >
                            <div className="w-4 h-4 border border-current rounded-full mb-1" />
                            <span className="text-xs">Lysarmatur</span>
                          </Button>
                          <Button
                            variant={electricianTool === 'electricalPanel' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setElectricianTool('electricalPanel')}
                            className="flex flex-col items-center justify-center w-16 h-16 p-2"
                          >
                            <div className="w-4 h-5 border-2 border-current rounded-sm mb-1" />
                            <span className="text-xs">Sikringsskap</span>
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
                            className="flex flex-col items-center justify-center w-16 h-16 p-2"
                          >
                            <div className="w-4 h-3 border border-current rounded-t mb-1" />
                            <span className="text-xs">Vask</span>
                          </Button>
                          <Button
                            variant={plumberTool === 'shower' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPlumberTool('shower')}
                            className="flex flex-col items-center justify-center w-16 h-16 p-2"
                          >
                            <div className="w-4 h-4 border border-current rounded mb-1" />
                            <span className="text-xs">Dusj</span>
                          </Button>
                          <Button
                            variant={plumberTool === 'toilet' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPlumberTool('toilet')}
                            className="flex flex-col items-center justify-center w-16 h-16 p-2"
                          >
                            <div className="w-3 h-4 border border-current rounded-full mb-1" />
                            <span className="text-xs">Toalett</span>
                          </Button>
                          <Button
                            variant={plumberTool === 'dishwasher' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPlumberTool('dishwasher')}
                            className="flex flex-col items-center justify-center w-16 h-16 p-2"
                          >
                            <div className="w-4 h-4 border border-current rounded mb-1" />
                            <span className="text-xs">Oppvask</span>
                          </Button>
                          <Button
                            variant={plumberTool === 'washingMachine' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPlumberTool('washingMachine')}
                            className="flex flex-col items-center justify-center w-16 h-16 p-2"
                          >
                            <div className="w-4 h-4 border border-current rounded-full mb-1" />
                            <span className="text-xs">Vask.maskin</span>
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
                      
                      {/* Zoom controls */}
                      <div className="flex gap-1 border rounded-md">
                        <Button onClick={zoomOut} variant="ghost" size="sm" className="px-2">
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <Button onClick={resetZoom} variant="ghost" size="sm" className="px-2 text-xs">
                          {Math.round(zoomLevel * 100)}%
                        </Button>
                        <Button onClick={zoomIn} variant="ghost" size="sm" className="px-2">
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </div>
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
                           // Use a longer delay to ensure element is fully rendered
                           setTimeout(() => initializeCanvas(plan.id), 300);
                         }
                       }}
                      className="max-w-full block"
                      style={{ 
                        display: 'block',
                        width: '100%',
                        height: 'auto'
                      }}
                    />
                      {/* Touch overlay for tool placement and wall drawing */}
                      {((selectedTool === 'carpenter' && carpenterTool) || 
                        (selectedTool === 'electrician' && electricianTool) || 
                        (selectedTool === 'plumber' && plumberTool)) && (
                         <div className="absolute inset-0 z-10 cursor-crosshair transition-all duration-150"
                           style={{ 
                             backgroundColor: overlayFlashing ? 'rgba(59, 130, 246, 0.3)' : 
                                             (isDrawingWall && selectedTool === 'carpenter' && carpenterTool === 'wall') ? 
                                             'rgba(139, 69, 19, 0.1)' : 'rgba(0, 0, 0, 0)',
                             touchAction: 'none'
                           }}
                           onClick={(e) => handleOverlayClick(e, plan.id)}
                           onMouseDown={(e) => {
                             if (selectedTool === 'carpenter' && carpenterTool === 'wall' && isDrawingWall) {
                               // Set up long press timer
                               const timer = setTimeout(() => {
                                 handleOverlayLongPress(e, plan.id);
                               }, 800);
                               
                               const cleanup = () => {
                                 clearTimeout(timer);
                                 document.removeEventListener('mouseup', cleanup);
                               };
                               
                               document.addEventListener('mouseup', cleanup);
                             }
                           }}
                           onTouchStart={(e) => {
                             if (selectedTool === 'carpenter' && carpenterTool === 'wall' && isDrawingWall) {
                               // Set up long press timer for touch
                               const timer = setTimeout(() => {
                                 handleOverlayLongPress(e, plan.id);
                               }, 800);
                               
                               const cleanup = () => {
                                 clearTimeout(timer);
                                 document.removeEventListener('touchend', cleanup);
                               };
                               
                               document.addEventListener('touchend', cleanup);
                             }
                           }}
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
                         <div className="space-y-4">
                           {/* Group items by profession */}
                           {(() => {
                             const floorItems = placedItems.filter(item => item.floorPlanId === plan.id);
                             const groupedByProfession = floorItems.reduce((acc, item) => {
                               if (!acc[item.category]) {
                                 acc[item.category] = [];
                               }
                               acc[item.category].push(item);
                               return acc;
                             }, {} as Record<string, PlacedItem[]>);

                             const professionNames = {
                               carpenter: 'Snekker',
                               electrician: 'Elektriker', 
                               plumber: 'Rørlegger'
                             };

                             let floorTotal = 0;

                             return Object.entries(groupedByProfession).map(([profession, items]) => {
                               // Group items by type within profession
                               const itemsByType = items.reduce((acc, item) => {
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
                               }, [] as Array<{type: string, name: string, count: number, unitPrice: number, totalPrice: number}>);

                               const professionTotal = itemsByType.reduce((sum, item) => sum + item.totalPrice, 0);
                               floorTotal += professionTotal;

                               return (
                                 <div key={profession} className="border rounded-lg p-3 bg-muted/50">
                                   <h4 className="font-semibold text-base mb-3 text-primary">
                                     {professionNames[profession as keyof typeof professionNames]}
                                   </h4>
                                   <div className="space-y-2 mb-3">
                                     {itemsByType.map((item) => (
                                       <div key={item.type} className="flex justify-between items-center py-1">
                                         <span className="text-sm">
                                           {item.name} x {item.count}
                                         </span>
                                         <span className="text-sm font-medium">
                                           {item.totalPrice.toLocaleString()} kr
                                         </span>
                                       </div>
                                     ))}
                                   </div>
                                   <div className="border-t pt-2">
                                     <div className="flex justify-between items-center font-medium text-sm">
                                       <span>Sum {professionNames[profession as keyof typeof professionNames]}:</span>
                                       <span className="text-primary">{professionTotal.toLocaleString()} kr</span>
                                     </div>
                                   </div>
                                 </div>
                               );
                             }).concat([
                               <div key="floor-total" className="border-t-2 pt-4 mt-4">
                                 <div className="flex justify-between items-center font-bold text-lg">
                                   <span>Sum {plan.name}:</span>
                                   <span className="text-primary">{floorTotal.toLocaleString()} kr</span>
                                 </div>
                               </div>
                             ]);
                           })()}
                         </div>
                       </CardContent>
                     </Card>
                   )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
          
          {/* Grand Total for all floors */}
          {placedItems.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl">Totalkostnad hele boligen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    // Group all items by profession across all floors
                    const allItemsByProfession = placedItems.reduce((acc, item) => {
                      if (!acc[item.category]) {
                        acc[item.category] = [];
                      }
                      acc[item.category].push(item);
                      return acc;
                    }, {} as Record<string, PlacedItem[]>);

                    const professionNames = {
                      carpenter: 'Snekker',
                      electrician: 'Elektriker',
                      plumber: 'Rørlegger'
                    };

                    let grandTotal = 0;

                    return Object.entries(allItemsByProfession).map(([profession, items]) => {
                      // Group items by type within profession
                      const itemsByType = items.reduce((acc, item) => {
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
                      }, [] as Array<{type: string, name: string, count: number, unitPrice: number, totalPrice: number}>);

                      const professionTotal = itemsByType.reduce((sum, item) => sum + item.totalPrice, 0);
                      grandTotal += professionTotal;

                      return (
                        <div key={profession} className="border rounded-lg p-4 bg-muted/30">
                          <h3 className="font-bold text-lg mb-3 text-primary">
                            {professionNames[profession as keyof typeof professionNames]}
                          </h3>
                          <div className="space-y-2 mb-3">
                            {itemsByType.map((item) => (
                              <div key={item.type} className="flex justify-between items-center py-1">
                                <span className="text-sm">
                                  {item.name} x {item.count}
                                </span>
                                <span className="text-sm font-medium">
                                  {item.totalPrice.toLocaleString()} kr
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t pt-2">
                            <div className="flex justify-between items-center font-semibold">
                              <span>Sum {professionNames[profession as keyof typeof professionNames]}:</span>
                              <span className="text-primary text-lg">{professionTotal.toLocaleString()} kr</span>
                            </div>
                          </div>
                        </div>
                      );
                    }).concat([
                      <div key="grand-total" className="border-t-2 border-primary pt-4 mt-6">
                        <div className="flex justify-between items-center font-bold text-xl">
                          <span>TOTALKOSTNAD:</span>
                          <span className="text-primary text-2xl">{grandTotal.toLocaleString()} kr</span>
                        </div>
                      </div>
                    ]);
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}