import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, Rect, Line, FabricImage, FabricObject } from 'fabric';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Hammer, Zap, Wrench, Save, FolderOpen, Trash2, Plus, Upload, Calculator, Undo2, Redo2, ZoomIn, ZoomOut, RotateCcw, Move, MousePointer2 } from 'lucide-react';
import { useBuildingProjects, BuildingProject } from '@/hooks/useBuildingProjects';
import { useToast } from '@/hooks/use-toast';
import { formatNumberWithSpaces } from '@/lib/utils';

type Profession = 'carpenter' | 'electrician' | 'plumber';

interface ProfessionData {
  id: Profession;
  name: string;
  icon: string;
  color: string;
  tools: BuildingTool[];
}

interface BuildingTool {
  id: string;
  name: string;
  description: string;
  cost: number;
  color: string;
}

interface PlacedItem {
  id: string;
  type: string;
  name: string;
  cost: number;
  description: string;
  profession: Profession;
}

const PROFESSIONS: ProfessionData[] = [
  {
    id: 'carpenter',
    name: 'Snekker',
    icon: '🔨',
    color: '#8B4513',
    tools: [
      { id: 'door', name: 'Dør', description: 'Inngangsdør', cost: 15000, color: '#8B4513' },
      { id: 'window', name: 'Vindu', description: 'Standard vindu', cost: 8000, color: '#8B4513' },
      { id: 'cabinet', name: 'Skap', description: 'Innebygd skap', cost: 12000, color: '#8B4513' },
      { id: 'floor', name: 'Gulv', description: 'Parkettgulv', cost: 500, color: '#8B4513' }
    ]
  },
  {
    id: 'electrician',
    name: 'Elektriker',
    icon: '⚡',
    color: '#FFD700',
    tools: [
      { id: 'outlet', name: 'Stikkontakt', description: 'Standard stikkontakt', cost: 800, color: '#FFD700' },
      { id: 'switch', name: 'Bryter', description: 'Lysbryter', cost: 400, color: '#FFD700' },
      { id: 'light', name: 'Lampe', description: 'Taklampe', cost: 2000, color: '#FFD700' },
      { id: 'panel', name: 'Tavle', description: 'Elektrisk tavle', cost: 15000, color: '#FFD700' }
    ]
  },
  {
    id: 'plumber',
    name: 'Rørlegger',
    icon: '🔧',
    color: '#4169E1',
    tools: [
      { id: 'sink', name: 'Vask', description: 'Kjøkkenvask', cost: 5000, color: '#4169E1' },
      { id: 'toilet', name: 'Toalett', description: 'Standard toalett', cost: 8000, color: '#4169E1' },
      { id: 'shower', name: 'Dusj', description: 'Dusjkabinett', cost: 12000, color: '#4169E1' },
      { id: 'radiator', name: 'Radiator', description: 'Varmekropp', cost: 3000, color: '#4169E1' }
    ]
  }
];

export default function BuildingPlannerImproved() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { projects, loading, saveProject, updateProject, deleteProject } = useBuildingProjects();
  const { toast } = useToast();

  const [selectedProfessions, setSelectedProfessions] = useState<Profession[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [projectName, setProjectName] = useState('');
  const [currentProject, setCurrentProject] = useState<BuildingProject | null>(null);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [floorPlanImage, setFloorPlanImage] = useState<string>('');
  
  // History management for undo/redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Tool modes
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [isCanvasReady, setIsCanvasReady] = useState(false);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    try {
      const canvas = new FabricCanvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
        selection: true,
        preserveObjectStacking: true
      });

      fabricCanvasRef.current = canvas;
      setIsCanvasReady(true);

      // Add grid
      addGrid(canvas);

      // Save initial state
      saveCanvasState();

      // Handle object selection
      canvas.on('selection:created', () => {
        console.log('Object selected');
      });

      canvas.on('selection:cleared', () => {
        console.log('Selection cleared');
      });

      // Handle object placement
      canvas.on('mouse:down', (options) => {
        if (!options.e.target || !selectedTool || isSelectMode) return;
        
        const pointer = canvas.getPointer(options.e);
        let tool: BuildingTool | undefined;
        let profession: Profession | undefined;
        
        // Find the tool across all professions
        for (const prof of PROFESSIONS) {
          const foundTool = prof.tools.find(t => t.id === selectedTool);
          if (foundTool) {
            tool = foundTool;
            profession = prof.id;
            break;
          }
        }
        
        if (tool && profession) {
          const itemId = Date.now().toString();
          const shape = new Rect({
            left: pointer.x - 15,
            top: pointer.y - 15,
            width: 30,
            height: 30,
            fill: tool.color,
            stroke: '#000',
            strokeWidth: 2,
            rx: 4,
            ry: 4
          });
          
          // Add custom properties
          (shape as unknown as Record<string, unknown>).itemId = itemId;
          (shape as unknown as Record<string, unknown>).toolId = tool.id;
          (shape as unknown as Record<string, unknown>).profession = profession as Profession;
          (shape as unknown as Record<string, unknown>).cost = tool.cost;
          (shape as unknown as Record<string, unknown>).name = tool.name;
          (shape as unknown as Record<string, unknown>).description = tool.description;
          
          canvas.add(shape);
          canvas.renderAll();
          
          // Add to placed items
          const newItem: PlacedItem = {
            id: itemId,
            type: tool.id,
            name: tool.name,
            cost: tool.cost,
            description: tool.description,
            profession: profession
          };
          setPlacedItems(prev => [...prev, newItem]);
          
          // Save state for undo/redo
          saveCanvasState();
          
          toast({
            title: "Element plassert",
            description: `${tool.name} ble plassert på plantegningen`
          });
        }
      });

      // Handle object modification
      canvas.on('object:modified', () => {
        saveCanvasState();
      });

      // Handle object removal
      canvas.on('object:removed', () => {
        updatePlacedItemsFromCanvas();
        saveCanvasState();
      });

    } catch (error) {
      console.error('Error initializing canvas:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke initialisere tegneområdet",
        variant: "destructive"
      });
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
        setIsCanvasReady(false);
      }
    };
  }, []);

  // Save canvas state for undo/redo
  const saveCanvasState = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    try {
      const canvasState = JSON.stringify(fabricCanvasRef.current.toJSON());
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(canvasState);
        return newHistory.slice(-20); // Keep only last 20 states
      });
      setHistoryIndex(prev => Math.min(prev + 1, 19));
    } catch (error) {
      console.error('Error saving canvas state:', error);
    }
  }, [historyIndex]);
  
  // Undo function
  const undo = useCallback(() => {
    if (historyIndex <= 0 || !fabricCanvasRef.current) return;
    
    const newIndex = historyIndex - 1;
    const canvasState = history[newIndex];
    
    try {
      fabricCanvasRef.current.loadFromJSON(canvasState).then(() => {
        fabricCanvasRef.current?.renderAll();
        setHistoryIndex(newIndex);
        updatePlacedItemsFromCanvas();
      });
    } catch (error) {
      console.error('Error during undo:', error);
    }
  }, [history, historyIndex]);
  
  // Redo function
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1 || !fabricCanvasRef.current) return;
    
    const newIndex = historyIndex + 1;
    const canvasState = history[newIndex];
    
    try {
      fabricCanvasRef.current.loadFromJSON(canvasState).then(() => {
        fabricCanvasRef.current?.renderAll();
        setHistoryIndex(newIndex);
        updatePlacedItemsFromCanvas();
      });
    } catch (error) {
      console.error('Error during redo:', error);
    }
  }, [history, historyIndex]);
  
  // Update placed items from canvas objects
  const updatePlacedItemsFromCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    try {
      const objects = fabricCanvasRef.current.getObjects();
      const items: PlacedItem[] = [];
      
      objects.forEach(obj => {
        if ((obj as unknown as Record<string, unknown>).itemId) {
          const objData = obj as unknown as Record<string, unknown>;
          items.push({
            id: String(objData.itemId),
            type: String(objData.toolId),
            name: String(objData.name),
            cost: Number(objData.cost),
            description: String(objData.description),
            profession: String(objData.profession)
          });
        }
      });
      
      setPlacedItems(items);
    } catch (error) {
      console.error('Error updating placed items:', error);
    }
  }, []);
  
  // Delete selected objects
  const deleteSelected = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    try {
      const activeObjects = fabricCanvasRef.current.getActiveObjects();
      if (activeObjects.length === 0) {
        toast({
          title: "Ingen elementer valgt",
          description: "Velg elementer først for å slette dem"
        });
        return;
      }
      
      activeObjects.forEach(obj => {
        fabricCanvasRef.current?.remove(obj);
      });
      
      fabricCanvasRef.current.discardActiveObject();
      fabricCanvasRef.current.renderAll();
      
      // Update placed items
      updatePlacedItemsFromCanvas();
      
      toast({
        title: "Elementer slettet",
        description: `${activeObjects.length} element(er) ble slettet`
      });
    } catch (error) {
      console.error('Error deleting objects:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke slette elementer",
        variant: "destructive"
      });
    }
  }, [updatePlacedItemsFromCanvas, toast]);
  
  // Zoom controls
  const zoomIn = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    try {
      const zoom = fabricCanvasRef.current.getZoom();
      const newZoom = Math.min(zoom * 1.2, 3);
      fabricCanvasRef.current.setZoom(newZoom);
      setCurrentZoom(newZoom);
    } catch (error) {
      console.error('Error zooming in:', error);
    }
  }, []);
  
  const zoomOut = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    try {
      const zoom = fabricCanvasRef.current.getZoom();
      const newZoom = Math.max(zoom / 1.2, 0.5);
      fabricCanvasRef.current.setZoom(newZoom);
      setCurrentZoom(newZoom);
    } catch (error) {
      console.error('Error zooming out:', error);
    }
  }, []);
  
  const resetZoom = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    
    try {
      fabricCanvasRef.current.setZoom(1);
      fabricCanvasRef.current.viewportTransform = [1, 0, 0, 1, 0, 0];
      fabricCanvasRef.current.renderAll();
      setCurrentZoom(1);
    } catch (error) {
      console.error('Error resetting zoom:', error);
    }
  }, []);
  
  // Toggle select mode
  const toggleSelectMode = useCallback(() => {
    setIsSelectMode(prev => !prev);
    setSelectedTool('');
  }, []);

  const addGrid = (canvas: FabricCanvas) => {
    try {
      const gridSize = 20;
      const canvasWidth = canvas.width || 800;
      const canvasHeight = canvas.height || 600;
      
      // Vertical lines
      for (let i = 0; i <= canvasWidth / gridSize; i++) {
        const line = new Line([i * gridSize, 0, i * gridSize, canvasHeight], {
          stroke: '#e0e0e0',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          name: 'grid-line'
        });
        canvas.add(line);
      }
      
      // Horizontal lines
      for (let i = 0; i <= canvasHeight / gridSize; i++) {
        const line = new Line([0, i * gridSize, canvasWidth, i * gridSize], {
          stroke: '#e0e0e0',
          strokeWidth: 1,
          selectable: false,
          evented: false,
          name: 'grid-line'
        });
        canvas.add(line);
      }
    } catch (error) {
      console.error('Error adding grid:', error);
    }
  };

  const handleFloorPlanUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ugyldig filtype",
        description: "Velg en bildefil (JPG, PNG, etc.).",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Fil for stor",
        description: "Bildet må være mindre enn 10MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      
      if (fabricCanvasRef.current && imageUrl) {
        const canvas = fabricCanvasRef.current;
        
        try {
          // Clear existing objects but keep the canvas
          canvas.clear();
          canvas.backgroundColor = '#ffffff';
          
          // Create and load image
          const imgElement = new Image();
          imgElement.crossOrigin = 'anonymous';
          
          imgElement.onload = () => {
            try {
              // Create fabric image from the loaded image
              const fabricImg = new FabricImage(imgElement, {
                left: 0,
                top: 0,
                selectable: false,
                evented: false,
                name: 'backgroundImage'
              });
              
              // Scale to fit canvas while maintaining aspect ratio
              const canvasWidth = canvas.width || 800;
              const canvasHeight = canvas.height || 600;
              
              const imgWidth = fabricImg.width || 1;
              const imgHeight = fabricImg.height || 1;
              
              const scaleX = (canvasWidth * 0.9) / imgWidth;
              const scaleY = (canvasHeight * 0.9) / imgHeight;
              const scale = Math.min(scaleX, scaleY);
              
              fabricImg.set({
                left: canvasWidth / 2,
                top: canvasHeight / 2,
                originX: 'center',
                originY: 'center',
                scaleX: scale,
                scaleY: scale
              });
              
              canvas.add(fabricImg);
              canvas.sendObjectToBack(fabricImg);
              canvas.renderAll();
              
              setFloorPlanImage(imageUrl);
              
              toast({
                title: "Plantegning lastet opp", 
                description: "Bildet er nå synlig på lerretet"
              });
            } catch (fabricError) {
              console.error('Fabric image error:', fabricError);
              toast({
                title: "Feil",
                description: "Kunne ikke laste bildet på lerretet",
                variant: "destructive"
              });
            }
          };
          
          imgElement.onerror = () => {
            toast({
              title: "Feil",
              description: "Kunne ikke laste bildet",
              variant: "destructive"
            });
          };
          
          // Start loading the image
          imgElement.src = imageUrl;
          
        } catch (error) {
          console.error('Upload error:', error);
          toast({
            title: "Feil",
            description: "Kunne ikke behandle bildet",
            variant: "destructive"
          });
        }
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "Feil",
        description: "Kunne ikke lese bildefilen",
        variant: "destructive"
      });
    };
    
    reader.readAsDataURL(file);
  };

  const clearCanvas = () => {
    if (fabricCanvasRef.current) {
      try {
        fabricCanvasRef.current.clear();
        fabricCanvasRef.current.backgroundColor = '#ffffff';
        
        if (!floorPlanImage) {
          addGrid(fabricCanvasRef.current);
        } else {
          // Re-add floor plan image
          const imgElement = new Image();
          imgElement.crossOrigin = 'anonymous';
          
          imgElement.onload = () => {
            try {
              const canvas = fabricCanvasRef.current!;
              const fabricImg = new FabricImage(imgElement, {
                left: 0,
                top: 0,
                selectable: false,
                evented: false,
                name: 'backgroundImage'
              });
              
              const canvasWidth = canvas.width || 800;
              const canvasHeight = canvas.height || 600;
              
              const imgWidth = fabricImg.width || 1;
              const imgHeight = fabricImg.height || 1;
              
              const scaleX = (canvasWidth * 0.9) / imgWidth;
              const scaleY = (canvasHeight * 0.9) / imgHeight;
              const scale = Math.min(scaleX, scaleY);
              
              fabricImg.set({
                left: canvasWidth / 2,
                top: canvasHeight / 2,
                originX: 'center',
                originY: 'center',
                scaleX: scale,
                scaleY: scale
              });
              
              canvas.add(fabricImg);
              canvas.sendObjectToBack(fabricImg);
              canvas.renderAll();
            } catch (error) {
              console.error('Error re-adding floor plan:', error);
            }
          };
          
          imgElement.src = floorPlanImage;
        }
        
        fabricCanvasRef.current.renderAll();
        setPlacedItems([]);
        
        toast({
          title: "Lerret tømt",
          description: "Alle elementer er fjernet"
        });
      } catch (error) {
        console.error('Error clearing canvas:', error);
        toast({
          title: "Feil",
          description: "Kunne ikke tømme lerretet",
          variant: "destructive"
        });
      }
    }
  };

  const resetAll = () => {
    setSelectedProfessions([]);
    setSelectedTool('');
    setProjectName('');
    setFloorPlanImage('');
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
      fabricCanvasRef.current = null;
      setIsCanvasReady(false);
    }
    setPlacedItems([]);
    setHistory([]);
    setHistoryIndex(-1);
  };

  const calculateTotalCost = () => {
    return placedItems.reduce((total, item) => total + item.cost, 0);
  };

  const getItemSummary = () => {
    const summary: Record<string, { count: number; cost: number; total: number }> = {};
    
    placedItems.forEach(item => {
      if (summary[item.name]) {
        summary[item.name].count += 1;
        summary[item.name].total += item.cost;
      } else {
        summary[item.name] = {
          count: 1,
          cost: item.cost,
          total: item.cost
        };
      }
    });
    
    return summary;
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      toast({
        title: "Mangler prosjektnavn",
        description: "Gi prosjektet et navn før lagring",
        variant: "destructive"
      });
      return;
    }

    try {
      const projectData = {
        project_name: projectName,
        canvas_data: fabricCanvasRef.current ? JSON.stringify(fabricCanvasRef.current.toJSON()) : '',
        floor_plan_image: floorPlanImage,
        placed_items: placedItems
      };

      if (currentProject) {
        await updateProject(currentProject.id, projectData);
        toast({
          title: "Prosjekt oppdatert",
          description: `${projectName} er oppdatert`
        });
      } else {
        await saveProject(
          projectData.project_name,
          null, // calculation_id
          projectData.canvas_data, // floor_plans
          projectData.placed_items,
          calculateTotalCost() // total_cost
        );
        toast({
          title: "Prosjekt lagret",
          description: `${projectName} er lagret`
        });
      }
      
      setSaveDialogOpen(false);
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Feil ved lagring",
        description: "Kunne ikke lagre prosjektet",
        variant: "destructive"
      });
    }
  };

  if (!isCanvasReady) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Initialiserer tegneområde...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Forbedret Byggeplanlegger</CardTitle>
              <CardDescription>
                Velg yrke og plasser elementer på plantegning
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-6">
            {/* Project Name and Connect Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="project-name-input">Prosjektnavn</Label>
                <Input
                  id="project-name-input"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Mitt byggeprosjekt"
                />
              </div>
              <div className="flex gap-2">
                <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="whitespace-nowrap">
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Last inn
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Velg eksisterende prosjekt</DialogTitle>
                      <DialogDescription>
                        Last inn et tidligere lagret prosjekt
                      </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {projects.map((project) => (
                        <Button
                          key={project.id}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            setProjectName(project.project_name);
                            setCurrentProject(project);
                            setLoadDialogOpen(false);
                          }}
                        >
                          {project.project_name}
                        </Button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Lagre
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Lagre prosjekt</DialogTitle>
                      <DialogDescription>
                        Gi prosjektet ditt et navn
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="save-project-name">Prosjektnavn</Label>
                        <Input
                          id="save-project-name"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          placeholder="Mitt byggeprosjekt"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                        Avbryt
                      </Button>
                      <Button onClick={handleSaveProject}>Lagre</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Profession Selection */}
            <div className="space-y-3">
              <Label>Velg yrke</Label>
              <div className="grid grid-cols-3 gap-3">
                {PROFESSIONS.map((profession) => (
                  <Button
                    key={profession.id}
                    variant={selectedProfessions.includes(profession.id) ? "default" : "outline"}
                    className={`h-20 flex flex-col items-center justify-center space-y-2 ${
                      !selectedProfessions.includes(profession.id) 
                        ? 'bg-background border-border hover:bg-accent hover:text-accent-foreground' 
                        : ''
                    }`}
                    onClick={() => {
                      setSelectedProfessions(prev => 
                        prev.includes(profession.id) 
                          ? prev.filter(p => p !== profession.id)
                          : [...prev, profession.id]
                      );
                    }}
                  >
                    <div className={selectedProfessions.includes(profession.id) ? 'text-primary-foreground' : 'text-foreground'}>
                      {profession.icon}
                    </div>
                    <div className="text-center">
                      <div className={`font-semibold text-xs ${selectedProfessions.includes(profession.id) ? 'text-primary-foreground' : 'text-foreground'}`}>
                        {profession.name}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Tools Selection */}
            {selectedProfessions.length > 0 && (
              <div className="space-y-3">
                <Label>Velg verktøy/element</Label>
                <div className="space-y-3">
                  {selectedProfessions.map(professionId => {
                    const profession = PROFESSIONS.find(p => p.id === professionId);
                    return (
                      <div key={professionId} className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <div style={{ color: profession?.color }}>
                            {profession?.icon}
                          </div>
                          {profession?.name}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {profession?.tools.map((tool) => (
                            <Button
                              key={tool.id}
                              variant={selectedTool === tool.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedTool(tool.id)}
                            >
                              <div 
                                className="w-3 h-3 rounded mr-2" 
                                style={{ backgroundColor: tool.color }}
                              />
                              {tool.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {selectedTool && !isSelectMode && (
                  <p className="text-sm text-muted-foreground">
                    Klikk på {floorPlanImage ? 'plantegningen' : 'lerretet'} for å plassere{' '}
                    {PROFESSIONS.flatMap(p => p.tools).find(t => t.id === selectedTool)?.name.toLowerCase()}
                  </p>
                )}
                
                {isSelectMode && (
                  <p className="text-sm text-muted-foreground">
                    Velg elementer på {floorPlanImage ? 'plantegningen' : 'lerretet'} for å flytte, rotere eller slette dem
                  </p>
                )}
              </div>
            )}

            {/* Floor Plan Upload */}
            <div className="space-y-2">
              <Label>Last opp plantegning</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {floorPlanImage ? 'Bytt plantegning' : 'Velg plantegning'}
                </Button>
                {floorPlanImage && (
                  <Badge variant="secondary">Plantegning lastet</Badge>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFloorPlanUpload}
                className="hidden"
              />
              <p className="text-sm text-muted-foreground">
                Last opp en plantegning (JPG, PNG) for å plassere elementer på
              </p>
            </div>

            {/* Canvas Controls */}
            <div className="space-y-3 mb-4">
              {/* Tool Controls */}
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Button 
                  variant={isSelectMode ? "default" : "outline"} 
                  size="sm" 
                  onClick={toggleSelectMode}
                  className="flex-shrink-0"
                >
                  <MousePointer2 className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Velg</span>
                </Button>
                
                {isSelectMode && (
                  <Button variant="outline" size="sm" onClick={deleteSelected} className="flex-shrink-0">
                    <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Slett valgte</span>
                  </Button>
                )}
              </div>
              
              {/* History Controls */}
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="flex-shrink-0"
                >
                  <Undo2 className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Angre</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="flex-shrink-0"
                >
                  <Redo2 className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Gjenta</span>
                </Button>
              </div>
              
              {/* Zoom Controls */}
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={zoomOut} className="flex-shrink-0">
                  <ZoomOut className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Zoom ut</span>
                </Button>
                
                <Button variant="outline" size="sm" onClick={resetZoom} className="flex-shrink-0">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Tilbakestill</span>
                </Button>
                
                <Button variant="outline" size="sm" onClick={zoomIn} className="flex-shrink-0">
                  <ZoomIn className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Zoom inn</span>
                </Button>
              </div>
              
              {/* Canvas Controls */}
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" onClick={clearCanvas} className="flex-shrink-0">
                  <Trash2 className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Tøm</span>
                </Button>

                <Button variant="outline" size="sm" onClick={resetAll} className="flex-shrink-0">
                  <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Start på nytt</span>
                </Button>
              </div>
            </div>

            {/* Canvas */}
            <div className="border rounded-lg overflow-hidden w-full relative">
              <canvas 
                ref={canvasRef} 
                className="block w-full h-auto touch-none" 
                style={{ maxWidth: '100%', minHeight: '400px' }} 
              />
              {currentZoom !== 1 && (
                <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs">
                  Zoom: {Math.round(currentZoom * 100)}%
                </div>
              )}
            </div>

            {/* Placed Items and Cost Estimate */}
            {placedItems.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-semibold">Plasserte elementer og prisestimat</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Elementer på plantegning</Label>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {placedItems.map((item, index) => (
                        <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded" 
                              style={{ backgroundColor: PROFESSIONS.find(p => p.id === item.profession)?.tools.find(t => t.id === item.type)?.color }}
                            />
                            <span className="text-sm">{item.name}</span>
                          </div>
                          <span className="text-sm font-medium">
                            {formatNumberWithSpaces(item.cost)} NOK
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Prisestimat
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        {Object.entries(getItemSummary()).map(([name, data]) => (
                          <div key={name} className="flex justify-between text-sm">
                            <span>{name} ({data.count} stk)</span>
                            <span>{formatNumberWithSpaces(data.total)} NOK</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2">
                          <div className="flex justify-between font-bold">
                            <span>Total estimat</span>
                            <span>{formatNumberWithSpaces(calculateTotalCost())} NOK</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




