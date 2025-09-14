import React, { useRef, useEffect, useState } from 'react';
import { Canvas as FabricCanvas, Rect, Line, FabricImage } from 'fabric';
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
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { projects, loading, saveProject, updateProject, deleteProject } = useBuildingProjects();
  const { toast } = useToast();

  const [selectedProfession, setSelectedProfession] = useState<Profession | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [projectName, setProjectName] = useState('');
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [floorPlanImage, setFloorPlanImage] = useState<string>('');

  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current && selectedProfession) {
      const canvas = new FabricCanvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#f8f9fa'
      });

      fabricCanvasRef.current = canvas;

      // Add grid if no floor plan
      if (!floorPlanImage) {
        addGrid(canvas);
      }

      // Handle object placement
      canvas.on('mouse:down', (options) => {
        if (!options.e.target || !selectedTool) return;
        
        const pointer = canvas.getPointer(options.e);
        const profession = PROFESSIONS.find(p => p.id === selectedProfession);
        const tool = profession?.tools.find(t => t.id === selectedTool);
        
        if (tool) {
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
            profession: selectedProfession
          };
          setPlacedItems(prev => [...prev, newItem]);
        }
      });
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [selectedProfession, selectedTool, floorPlanImage]);

  const addGrid = (canvas: FabricCanvas) => {
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

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ugyldig filtype",
        description: "Velg en bildefil (JPG, PNG, etc.).",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Fil for stor",
        description: "Velg et bilde som er mindre enn 10MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setFloorPlanImage(imageUrl);
      
      // Add image to canvas
      if (fabricCanvasRef.current) {
        FabricImage.fromURL(imageUrl).then((img) => {
          if (fabricCanvasRef.current) {
            // Scale image to fit canvas
            const canvas = fabricCanvasRef.current;
            const scaleX = canvas.width! / img.width!;
            const scaleY = canvas.height! / img.height!;
            const scale = Math.min(scaleX, scaleY, 1);
            
            img.scale(scale);
            img.set({
              left: (canvas.width! - img.width! * scale) / 2,
              top: (canvas.height! - img.height! * scale) / 2,
              selectable: false,
              evented: false
            });
            
            canvas.clear();
            canvas.add(img);
            canvas.renderAll();
          }
        });
      }
      
      toast({
        title: "Plantegning lastet opp",
        description: "Du kan nå plassere elementer på plantegningen"
      });
    };
    reader.readAsDataURL(file);
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
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
      if (!floorPlanImage) {
        addGrid(fabricCanvasRef.current);
      } else if (floorPlanImage) {
        // Re-add floor plan image
        FabricImage.fromURL(floorPlanImage).then((img) => {
          if (fabricCanvasRef.current) {
            const canvas = fabricCanvasRef.current;
            const scaleX = canvas.width! / img.width!;
            const scaleY = canvas.height! / img.height!;
            const scale = Math.min(scaleX, scaleY, 1);
            
            img.scale(scale);
            img.set({
              left: (canvas.width! - img.width! * scale) / 2,
              top: (canvas.height! - img.height! * scale) / 2,
              selectable: false,
              evented: false
            });
            
            canvas.add(img);
            canvas.renderAll();
          }
        });
      }
    }
    setPlacedItems([]);
  };

  const resetAll = () => {
    setSelectedProfession(null);
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
            {selectedProfession && (
              <div className="flex gap-2">
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
                        <Label htmlFor="project-name">Prosjektnavn</Label>
                        <Input
                          id="project-name"
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

                <Button variant="outline" size="sm" onClick={clearCanvas}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Tøm
                </Button>

                <Button variant="outline" size="sm" onClick={resetAll}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start på nytt
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!selectedProfession ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Velg yrke</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PROFESSIONS.map((profession) => (
                  <Button
                    key={profession.id}
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center space-y-2"
                    onClick={() => setSelectedProfession(profession.id)}
                  >
                    <div style={{ color: profession.color }}>
                      {profession.icon}
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{profession.name}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{ color: PROFESSIONS.find(p => p.id === selectedProfession)?.color }}>
                    {PROFESSIONS.find(p => p.id === selectedProfession)?.icon}
                  </div>
                  <h3 className="text-lg font-semibold">
                    {PROFESSIONS.find(p => p.id === selectedProfession)?.name}
                  </h3>
                </div>
                <Button variant="ghost" size="sm" onClick={resetAll}>
                  Bytt yrke
                </Button>
              </div>

              {/* Project Name Input */}
              <div>
                <Label htmlFor="project-name-input">Prosjektnavn</Label>
                <Input
                  id="project-name-input"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Mitt byggeprosjekt"
                />
              </div>

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

              {/* Tools Selection */}
              <div className="space-y-3">
                <Label>Velg verktøy/element</Label>
                <div className="flex flex-wrap gap-2">
                  {PROFESSIONS.find(p => p.id === selectedProfession)?.tools.map((tool) => (
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
                {selectedTool && (
                  <p className="text-sm text-muted-foreground">
                    Klikk på {floorPlanImage ? 'plantegningen' : 'lerretet'} for å plassere{' '}
                    {PROFESSIONS.find(p => p.id === selectedProfession)?.tools.find(t => t.id === selectedTool)?.name.toLowerCase()}
                  </p>
                )}
              </div>

              {/* Canvas */}
              <div className="border rounded-lg overflow-hidden">
                <canvas ref={canvasRef} className="block" />
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}