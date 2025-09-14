import React, { useRef, useEffect, useState } from 'react';
import { Canvas as FabricCanvas, Rect, Line } from 'fabric';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Square, Minus, Save, FolderOpen, Trash2, Plus, Link2, Calculator } from 'lucide-react';
import { useBuildingProjects } from '@/hooks/useBuildingProjects';
import { useCalculationHistory } from '@/hooks/useCalculationHistory';
import { useToast } from '@/hooks/use-toast';
import { formatNumberWithSpaces } from '@/lib/utils';

interface BuildingItem {
  id: string;
  type: 'wall' | 'room' | 'door' | 'window';
  cost: number;
  description: string;
}

const BUILDING_ITEMS: BuildingItem[] = [
  { id: 'wall', type: 'wall', cost: 2500, description: 'Vegg (per meter)' },
  { id: 'room', type: 'room', cost: 15000, description: 'Rom (grunnfundament)' },
  { id: 'door', type: 'door', cost: 8000, description: 'Dør' },
  { id: 'window', type: 'window', cost: 12000, description: 'Vindu' },
];

export default function BuildingPlannerBasic() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const { projects, loading, saveProject, updateProject, deleteProject, loadProject } = useBuildingProjects();
  const { calculations } = useCalculationHistory();
  const { toast } = useToast();

  const [projectType, setProjectType] = useState<'new' | 'link' | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>('wall');
  const [projectName, setProjectName] = useState('');
  const [selectedCalculation, setSelectedCalculation] = useState<string>('');
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [placedItems, setPlacedItems] = useState<any[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);

  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current && projectType === 'new') {
      const canvas = new FabricCanvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#f8f9fa'
      });

      fabricCanvasRef.current = canvas;

      // Add grid
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

      // Handle object selection
      canvas.on('object:added', (e) => {
        if (e.target && e.target.type === 'rect') {
          const item = BUILDING_ITEMS.find(item => item.type === selectedTool);
          if (item) {
            const newItem = {
              id: Date.now().toString(),
              type: item.type,
              cost: item.cost,
              description: item.description
            };
            setPlacedItems(prev => [...prev, newItem]);
          }
        }
      });

      // Mouse down handler for drawing
      canvas.on('mouse:down', (options) => {
        if (!options.e.target) return;
        
        const pointer = canvas.getPointer(options.e);
        const item = BUILDING_ITEMS.find(item => item.type === selectedTool);
        
        if (item && selectedTool !== 'room') {
          let shape: Rect;
          
          switch (selectedTool) {
            case 'wall':
              shape = new Rect({
                left: pointer.x,
                top: pointer.y,
                width: 100,
                height: 10,
                fill: '#8B4513',
                stroke: '#654321',
                strokeWidth: 2
              });
              break;
            case 'door':
              shape = new Rect({
                left: pointer.x,
                top: pointer.y,
                width: 80,
                height: 10,
                fill: '#D2691E',
                stroke: '#B8860B',
                strokeWidth: 2
              });
              break;
            case 'window':
              shape = new Rect({
                left: pointer.x,
                top: pointer.y,
                width: 80,
                height: 10,
                fill: '#87CEEB',
                stroke: '#4682B4',
                strokeWidth: 2
              });
              break;
            default:
              return;
          }
          
          canvas.add(shape);
          canvas.renderAll();
        }
      });
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [selectedTool, projectType]);

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
      const calculationId = projectType === 'link' ? selectedCalculation : null;

      if (currentProject) {
        await updateProject(currentProject.id, {
          project_name: projectName,
          floor_plans: floorPlans,
          placed_items: placedItems,
          total_cost: totalCost,
          calculation_id: calculationId
        });
        toast({
          title: "Prosjekt oppdatert",
          description: `${projectName} er oppdatert`
        });
      } else {
        await saveProject(projectName, calculationId, floorPlans, placedItems, totalCost);
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

  const handleLoadProject = async (project: any) => {
    try {
      setCurrentProject(project);
      setProjectName(project.project_name);
      setPlacedItems(project.placed_items || []);
      
      if (fabricCanvasRef.current && project.floor_plans) {
        fabricCanvasRef.current.loadFromJSON(project.floor_plans, () => {
          fabricCanvasRef.current?.renderAll();
        });
      }
      
      setLoadDialogOpen(false);
      toast({
        title: "Prosjekt lastet",
        description: `${project.project_name} er lastet`
      });
    } catch (error) {
      toast({
        title: "Feil ved lasting",
        description: "Kunne ikke laste prosjektet",
        variant: "destructive"
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      toast({
        title: "Prosjekt slettet",
        description: "Prosjektet er slettet"
      });
    } catch (error) {
      toast({
        title: "Feil ved sletting",
        description: "Kunne ikke slette prosjektet",
        variant: "destructive"
      });
    }
  };

  const clearCanvas = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
      // Re-add grid
      const canvas = fabricCanvasRef.current;
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
    }
    setPlacedItems([]);
    setCurrentProject(null);
    setProjectName('');
  };

  const resetProject = () => {
    setProjectType(null);
    setProjectName('');
    setSelectedCalculation('');
    clearCanvas();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Byggeplanlegger</CardTitle>
              <CardDescription>
                Tegn og planlegg ditt byggeprosjekt med interaktiv tegning
              </CardDescription>
            </div>
            {projectType === 'new' && (
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
                        Gi prosjektet ditt et navn for å lagre det
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

                <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Last inn
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Last inn prosjekt</DialogTitle>
                      <DialogDescription>
                        Velg et eksisterende prosjekt å jobbe videre med
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {loading ? (
                        <p>Laster prosjekter...</p>
                      ) : projects.length === 0 ? (
                        <p className="text-muted-foreground">Ingen lagrede prosjekter</p>
                      ) : (
                        projects.map((project) => (
                          <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-semibold">{project.project_name}</h4>
                              <p className="text-sm text-muted-foreground">
                                Totalkostnad: {formatNumberWithSpaces(project.total_cost || 0)} NOK
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Sist oppdatert: {new Date(project.updated_at).toLocaleDateString('no-NO')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleLoadProject(project)}>
                                Last inn
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleDeleteProject(project.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" size="sm" onClick={clearCanvas}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nytt
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!projectType ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Velg prosjekttype</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setProjectType('new')}
                >
                  <Plus className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-semibold">Ny</div>
                    <div className="text-sm text-muted-foreground">Start nytt prosjekt</div>
                  </div>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center space-y-2"
                  onClick={() => setProjectType('link')}
                >
                  <Link2 className="h-8 w-8" />
                  <div className="text-center">
                    <div className="font-semibold">Knytt prosjekt</div>
                    <div className="text-sm text-muted-foreground">Bruk eksisterende beregning</div>
                  </div>
                </Button>
              </div>
            </div>
          ) : projectType === 'new' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Nytt byggeprosjekt</h3>
                <Button variant="ghost" size="sm" onClick={resetProject}>
                  Tilbake
                </Button>
              </div>

              <div>
                <Label htmlFor="project-name">Prosjektnavn</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Mitt byggeprosjekt"
                />
              </div>

              <Tabs defaultValue="draw" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="draw">Tegn</TabsTrigger>
                  <TabsTrigger value="items">Elementer</TabsTrigger>
                  <TabsTrigger value="cost">Kostnad</TabsTrigger>
                </TabsList>
                
                <TabsContent value="draw" className="space-y-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {BUILDING_ITEMS.map((item) => (
                      <Button
                        key={item.id}
                        variant={selectedTool === item.type ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTool(item.type)}
                      >
                        {item.type === 'wall' && <Minus className="h-4 w-4 mr-2" />}
                        {item.type === 'room' && <Square className="h-4 w-4 mr-2" />}
                        {item.type === 'door' && <Square className="h-4 w-4 mr-2" />}
                        {item.type === 'window' && <Square className="h-4 w-4 mr-2" />}
                        {item.description}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <canvas ref={canvasRef} className="block" />
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Klikk på lerretet for å plassere valgte element. Dra elementer for å flytte dem.</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="items" className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Plasserte elementer</h4>
                    {placedItems.length === 0 ? (
                      <p className="text-muted-foreground">Ingen elementer plassert ennå</p>
                    ) : (
                      <div className="space-y-2">
                        {placedItems.map((item, index) => (
                          <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                            <div>
                              <span className="font-medium">{item.description}</span>
                              <Badge variant="secondary" className="ml-2">
                                {item.type}
                              </Badge>
                            </div>
                            <span className="font-semibold">
                              {formatNumberWithSpaces(item.cost)} NOK
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="cost" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Kostnadssammendrag</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {BUILDING_ITEMS.map((item) => {
                        const count = placedItems.filter(p => p.type === item.type).length;
                        const totalCost = count * item.cost;
                        
                        return (
                          <div key={item.type} className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">{item.description}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                ({count} stk)
                              </span>
                            </div>
                            <span className="font-semibold">
                              {formatNumberWithSpaces(totalCost)} NOK
                            </span>
                          </div>
                        );
                      })}
                      
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Totalt</span>
                          <span>{formatNumberWithSpaces(calculateTotalCost())} NOK</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Knytt til kalkulator</h3>
                <Button variant="ghost" size="sm" onClick={resetProject}>
                  Tilbake
                </Button>
              </div>

              <div>
                <Label htmlFor="calculation-select">Velg kalkulator-beregning</Label>
                <Select value={selectedCalculation} onValueChange={setSelectedCalculation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg en beregning" />
                  </SelectTrigger>
                  <SelectContent>
                    {calculations.length === 0 ? (
                      <SelectItem value="no-calculations" disabled>
                        Ingen lagrede beregninger
                      </SelectItem>
                    ) : (
                      calculations.map((calc) => (
                        <SelectItem key={calc.id} value={calc.id}>
                          <div className="flex flex-col">
                            <span>{calc.calculation_name || 'Uten navn'}</span>
                            {calc.property_address && (
                              <span className="text-xs text-muted-foreground">
                                {calc.property_address}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedCalculation && selectedCalculation !== 'no-calculations' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="linked-project-name">Prosjektnavn</Label>
                    <Input
                      id="linked-project-name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="Byggeprosjekt basert på kalkulator"
                    />
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">Tilknyttet kalkulator</h4>
                    <p className="text-sm text-muted-foreground">
                      <strong>Beregning:</strong> {
                        calculations.find(c => c.id === selectedCalculation)?.calculation_name || 'Valgt beregning'
                      }
                    </p>
                    {calculations.find(c => c.id === selectedCalculation)?.property_address && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Adresse:</strong> {
                          calculations.find(c => c.id === selectedCalculation)?.property_address
                        }
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => setSaveDialogOpen(true)} disabled={!projectName.trim()}>
                      <Save className="h-4 w-4 mr-2" />
                      Lagre prosjekt
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save dialog for linked projects */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lagre tilknyttet prosjekt</DialogTitle>
            <DialogDescription>
              Dette prosjektet vil bli knyttet til den valgte kalkulatoren
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Prosjektnavn</Label>
              <p className="text-sm font-medium">{projectName}</p>
            </div>
            <div>
              <Label>Tilknyttet kalkulator</Label>
              <p className="text-sm font-medium">
                {calculations.find(c => c.id === selectedCalculation)?.calculation_name || 'Valgt beregning'}
              </p>
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
  );
}