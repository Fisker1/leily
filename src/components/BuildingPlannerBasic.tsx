import React, { useRef, useEffect, useState } from 'react';
// Import Fabric.js components individually for better debugging
import { Canvas } from 'fabric';
import { Rect } from 'fabric';  
import { Line } from 'fabric';
import { FabricImage } from 'fabric';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Hammer, Zap, Wrench, Save, FolderOpen, Trash2, Plus, Upload, Calculator } from 'lucide-react';
import { useBuildingProjects } from '@/hooks/useBuildingProjects';
import { useToast } from '@/hooks/use-toast';
import { formatNumberWithSpaces } from '@/lib/utils';

type Profession = 'carpenter' | 'electrician' | 'plumber';

interface ProfessionData {
  id: Profession;
  name: string;
  icon: React.ReactNode;
  color: string;
  tools: BuildingTool[];
}

interface BuildingTool {
  id: string;
  name: string;
  cost: number;
  color: string;
  description: string;
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
    icon: <Hammer className="h-6 w-6" />,
    color: '#8B4513',
    tools: [
      { id: 'wall', name: 'Vegg', cost: 2500, color: '#8B4513', description: 'Trevegg per meter' },
      { id: 'window', name: 'Vindu', cost: 12000, color: '#87CEEB', description: 'Vindu med karm' },
      { id: 'door', name: 'Dør', cost: 8000, color: '#D2691E', description: 'Innendørsdør' },
      { id: 'floor', name: 'Gulv', cost: 1500, color: '#DEB887', description: 'Gulvbelegg per m²' },
    ]
  },
  {
    id: 'electrician',
    name: 'Elektriker',
    icon: <Zap className="h-6 w-6" />,
    color: '#FFD700',
    tools: [
      { id: 'outlet', name: 'Stikkontakt', cost: 800, color: '#FFD700', description: 'Standard stikkontakt' },
      { id: 'switch', name: 'Bryter', cost: 600, color: '#FFA500', description: 'Lysbryter' },
      { id: 'light', name: 'Taklampe', cost: 2500, color: '#FFFF00', description: 'LED taklampe' },
      { id: 'cable', name: 'Kabel', cost: 150, color: '#FF4500', description: 'Elektrisk kabel per meter' },
    ]
  },
  {
    id: 'plumber',
    name: 'Rørlegger',
    icon: <Wrench className="h-6 w-6" />,
    color: '#4682B4',
    tools: [
      { id: 'pipe', name: 'Rør', cost: 200, color: '#4682B4', description: 'Vanntilførsel per meter' },
      { id: 'drain', name: 'Avløp', cost: 350, color: '#2F4F4F', description: 'Avløpsrør per meter' },
      { id: 'faucet', name: 'Kran', cost: 1500, color: '#C0C0C0', description: 'Standard vannkran' },
      { id: 'toilet', name: 'Toalett', cost: 8000, color: '#F0F8FF', description: 'Komplett toalett' },
    ]
  }
];

export default function BuildingPlannerBasic() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { projects, loading, saveProject, updateProject, deleteProject } = useBuildingProjects();
  const { toast } = useToast();

  const [selectedProfessions, setSelectedProfessions] = useState<Profession[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [projectName, setProjectName] = useState('');
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [floorPlanImage, setFloorPlanImage] = useState<string>('');

  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      // Get responsive canvas dimensions
      const container = canvasRef.current.parentElement;
      const containerWidth = container?.clientWidth || 800;
      const canvasWidth = Math.min(containerWidth - 32, 800); // 32px for padding
      const canvasHeight = Math.min(canvasWidth * 0.75, 600); // Maintain aspect ratio on mobile
      
      const canvas = new Canvas(canvasRef.current, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: '#ffffff'
      });

      fabricCanvasRef.current = canvas;

      // Add touch controls once during canvas initialization
      addTouchControls(canvas);

      // Handle object placement
      canvas.on('mouse:down', (options) => {
        if (!options.e.target || !selectedTool) return;
        
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
          const shape = new Rect({
            left: pointer.x,
            top: pointer.y,
            width: 30,
            height: 30,
            fill: tool.color,
            stroke: '#000',
            strokeWidth: 2
          });
          
          canvas.add(shape);
          canvas.renderAll();
          
          // Add to placed items
          const newItem: PlacedItem = {
            id: Date.now().toString(),
            type: tool.id,
            name: tool.name,
            cost: tool.cost,
            description: tool.description,
            profession: profession
          };
          setPlacedItems(prev => [...prev, newItem]);
        }
      });
    }

    return () => {
      if (fabricCanvasRef.current) {
        // Cleanup touch events if they exist
        if ((fabricCanvasRef.current as any).touchCleanup) {
          (fabricCanvasRef.current as any).touchCleanup();
        }
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [selectedTool, floorPlanImage]);

  const addGrid = (canvas: Canvas) => {
    const gridSize = 20;
    for (let i = 0; i <= canvas.width! / gridSize; i++) {
      const line = new Line([i * gridSize, 0, i * gridSize, canvas.height!], {
        stroke: '#e0e0e0',
        strokeWidth: 1,
        selectable: false,
        evented: false
      });
      canvas.add(line);
    }
    for (let i = 0; i <= canvas.height! / gridSize; i++) {
      const line = new Line([0, i * gridSize, canvas.width!, i * gridSize], {
        stroke: '#e0e0e0',
        strokeWidth: 1,
        selectable: false,
        evented: false
      });
      canvas.add(line);
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

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      setFloorPlanImage(imageUrl);
      
      if (fabricCanvasRef.current) {
        const canvas = fabricCanvasRef.current;
        
        try {
          // Clear canvas
          canvas.clear();
          canvas.backgroundColor = '#ffffff';
          
          // Load image using Fabric v6
          const img = await FabricImage.fromURL(imageUrl);
          
          // Scale to fit canvas
          const canvasWidth = canvas.width || 800;
          const canvasHeight = canvas.height || 600;
          const scale = Math.min(canvasWidth / img.width!, canvasHeight / img.height!, 1);
          
          img.scaleToWidth(canvasWidth * scale * 0.9);
          img.set({
            left: canvasWidth / 2,
            top: canvasHeight / 2,
            originX: 'center',
            originY: 'center'
          });
          
          canvas.add(img);
          canvas.renderAll();
          
          toast({
            title: "Plantegning lastet opp", 
            description: "Bildet er nå synlig på lerretet"
          });
        } catch (error) {
          toast({
            title: "Feil",
            description: "Kunne ikke laste bildet",
            variant: "destructive"
          });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const addTouchControls = (canvas: Canvas) => {
    let isPanning = false;
    let lastPanPoint = { x: 0, y: 0 };
    let initialDistance = 0;
    let initialScale = 1;
    
    const canvasElement = canvas.getElement();
    
    // Touch start handler
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      
      if (e.touches.length === 1) {
        // Single touch - start panning
        isPanning = true;
        const touch = e.touches[0];
        const rect = canvasElement.getBoundingClientRect();
        lastPanPoint = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top
        };
      } else if (e.touches.length === 2) {
        // Two touches - start zooming
        isPanning = false;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        initialScale = canvas.getZoom();
      }
    };
    
    // Touch move handler
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      
      if (e.touches.length === 1 && isPanning) {
        // Single touch - pan
        const touch = e.touches[0];
        const rect = canvasElement.getBoundingClientRect();
        const currentPoint = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top
        };
        
        const deltaX = currentPoint.x - lastPanPoint.x;
        const deltaY = currentPoint.y - lastPanPoint.y;
        
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] += deltaX;
          vpt[5] += deltaY;
          canvas.requestRenderAll();
        }
        
        lastPanPoint = currentPoint;
      } else if (e.touches.length === 2) {
        // Two touches - zoom
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        const scale = (currentDistance / initialDistance) * initialScale;
        const minScale = 0.5;
        const maxScale = 3;
        const clampedScale = Math.min(Math.max(scale, minScale), maxScale);
        
        // Calculate center point between fingers
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        const rect = canvasElement.getBoundingClientRect();
        
        canvas.setZoom(clampedScale);
      }
    };
    
    // Touch end handler
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      isPanning = false;
      
      if (e.touches.length === 0) {
        initialDistance = 0;
        initialScale = canvas.getZoom();
      }
    };
    
    // Add touch event listeners
    canvasElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvasElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvasElement.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Store cleanup function
    (canvas as any).touchCleanup = () => {
      canvasElement.removeEventListener('touchstart', handleTouchStart);
      canvasElement.removeEventListener('touchmove', handleTouchMove);
      canvasElement.removeEventListener('touchend', handleTouchEnd);
    };
  };

  const calculateTotalCost = () => {
    return placedItems.reduce((total, item) => total + item.cost, 0);
  };

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      toast({
        title: "Feil",
        description: "Vennligst skriv inn et prosjektnavn",
        variant: "destructive"
      });
      return;
    }

    try {
      const floorPlans = fabricCanvasRef.current?.toJSON() || {};
      const totalCost = calculateTotalCost();

      if (currentProject) {
        await updateProject(currentProject.id, {
          project_name: projectName,
          floor_plans: floorPlans,
          placed_items: placedItems,
          total_cost: totalCost
        });
        toast({
          title: "Prosjekt oppdatert",
          description: `${projectName} er oppdatert`
        });
      } else {
        await saveProject(projectName, null, floorPlans, placedItems, totalCost);
        toast({
          title: "Prosjekt lagret",
          description: `${projectName} er lagret`
        });
      }
      
      setSaveDialogOpen(false);
    } catch (error) {
      toast({
        title: "Feil ved lagring",
        description: "Kunne ikke lagre prosjektet",
        variant: "destructive"
      });
    }
  };

  const clearCanvas = () => {
    if (fabricCanvasRef.current && fabricCanvasRef.current.getContext) {
      try {
        fabricCanvasRef.current.clear();
        fabricCanvasRef.current.backgroundColor = '#ffffff';
        fabricCanvasRef.current.renderAll();
        
        if (!floorPlanImage) {
          addGrid(fabricCanvasRef.current);
        } else if (floorPlanImage) {
          // Re-add floor plan image using v6 approach
          const canvas = fabricCanvasRef.current;
          const imageElement = document.createElement('img');
          imageElement.src = floorPlanImage;
          imageElement.crossOrigin = 'anonymous';
          
        imageElement.onload = async () => {
          try {
            const canvasWidth = canvas.width || 800;
            const canvasHeight = canvas.height || 600;
            
            // Use v6 fromURL method
            const fabricImg = await FabricImage.fromURL(floorPlanImage);
            
            const scaleX = canvasWidth / fabricImg.width!;
            const scaleY = canvasHeight / fabricImg.height!;
            const scale = Math.min(scaleX, scaleY, 1);
            
            fabricImg.set({
              left: (canvasWidth - fabricImg.width! * scale) / 2,
              top: (canvasHeight - fabricImg.height! * scale) / 2,
              scaleX: scale,
              scaleY: scale,
              selectable: false,
              evented: false,
              hasControls: false,
              hoverCursor: 'default',
              name: 'floorPlan'
            });
            
            canvas.add(fabricImg);
            canvas.renderAll();
            
            console.log('Floor plan re-added to canvas');
          } catch (error) {
            console.error('Error re-adding floor plan:', error);
          }
        };
        }
      } catch (error) {
        console.error('Error clearing canvas:', error);
        toast({
          title: "Feil",
          description: "Kunne ikke tømme lerretet",
          variant: "destructive"
        });
      }
    }
    setPlacedItems([]);
  };

  const resetAll = () => {
    setSelectedProfessions([]);
    setSelectedTool('');
    setProjectName('');
    setFloorPlanImage('');
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
      fabricCanvasRef.current = null;
    }
    setPlacedItems([]);
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Byggeplanlegger</CardTitle>
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
                      Knytt prosjekt
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Velg eksisterende prosjekt</DialogTitle>
                      <DialogDescription>
                        Knytt tegningen til et eksisterende prosjekt
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
                {selectedTool && (
                  <p className="text-sm text-muted-foreground">
                    Klikk på {floorPlanImage ? 'plantegningen' : 'lerretet'} for å plassere{' '}
                    {PROFESSIONS.flatMap(p => p.tools).find(t => t.id === selectedTool)?.name.toLowerCase()}
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
            <div className="flex justify-end gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                <Trash2 className="h-4 w-4 mr-2" />
                Tøm
              </Button>

              <Button variant="outline" size="sm" onClick={resetAll}>
                <Plus className="h-4 w-4 mr-2" />
                Start på nytt
              </Button>
            </div>

            {/* Canvas */}
            <div className="border rounded-lg overflow-hidden w-full">
              <canvas ref={canvasRef} className="block w-full h-auto touch-none" style={{ maxWidth: '100%' }} />
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