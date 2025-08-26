import React, { useRef, useState, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Circle, Text, Group, Rect } from "react-konva";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Calculator as CalcIcon } from "lucide-react";

// Simple cost catalogue (NOK). You can replace with API/DB later
const DEFAULT_COSTS = {
  snekker: {
    gips_vegg_per_m: 200, // NOK per meter vegg (material + arbeid)
    gips_tak_per_m2: 300, // NOK per m2 (om du måler areal)
    innervegg_ny_per_m: 1200,
  },
  elektriker: {
    stikk_pr_stk: 1200,
    bryter_pr_stk: 1400,
    punkt_pr_stk: 1800,
    skjult_anlegg_per_m: 250,
  },
  maler: {
    vegg_per_m2: 180,
    tak_per_m2: 160,
  },
};

function useImage(url: string | null) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!url) return;
    const img = new window.Image();
    img.onload = () => setImage(img);
    img.src = url;
  }, [url]);
  return image;
}

interface ToolButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const ToolButton = ({ active, onClick, children }: ToolButtonProps) => (
  <Button
    onClick={onClick}
    variant={active ? "default" : "outline"}
    size="sm"
    className="mr-2 mb-2"
  >
    {children}
  </Button>
);

export default function BuildingPlanner() {
  const stageRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgURL, setImgURL] = useState<string | null>(null);
  const image = useImage(imgURL);

  // canvas state
  const [tool, setTool] = useState("select"); // select | scale | wall | area | outlet
  const [scalePxPerMeter, setScalePxPerMeter] = useState<number | null>(null);
  const [scaleTempPoints, setScaleTempPoints] = useState<Array<{x: number, y: number}>>([]);

  // drawings
  const [walls, setWalls] = useState<Array<{points: number[], closed: boolean}>>([]);
  const [areas, setAreas] = useState<Array<{points: number[], closed: boolean, name: string}>>([]);
  const [outlets, setOutlets] = useState<Array<{x: number, y: number, type: string}>>([]);

  // cost model
  const [costs, setCosts] = useState(DEFAULT_COSTS);

  // view state
  const [stageSize, setStageSize] = useState({ width: 900, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setStageSize({ width: Math.min(rect.width, 1400), height: Math.max(500, rect.height - 16) });
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleFile = (file: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgURL(url);
  };

  // Helpers
  const distance = (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1);

  const polygonArea = (pts: number[]) => {
    // pts flat [x1,y1,x2,y2,...]
    let area = 0;
    for (let i = 0; i < pts.length; i += 2) {
      const x1 = pts[i];
      const y1 = pts[i + 1];
      const x2 = pts[(i + 2) % pts.length];
      const y2 = pts[(i + 3) % pts.length];
      area += x1 * y2 - x2 * y1;
    }
    return Math.abs(area) / 2; // in px^2
  };

  const lengthOfPolyline = (pts: number[]) => {
    let len = 0;
    for (let i = 0; i < pts.length - 2; i += 2) {
      len += distance(pts[i], pts[i + 1], pts[i + 2], pts[i + 3]);
    }
    return len;
  };

  // Mouse handling
  const [tempPoints, setTempPoints] = useState<number[]>([]);

  const onStageClick = (e: any) => {
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const { x, y } = pointer;

    if (tool === "scale") {
      if (scaleTempPoints.length === 2) return;
      setScaleTempPoints((p) => [...p, { x, y }]);
      return;
    }

    if (tool === "wall" || tool === "area") {
      setTempPoints((pts) => [...pts, x, y]);
      return;
    }

    if (tool === "outlet") {
      setOutlets((o) => [...o, { x, y, type: outletType }]);
      return;
    }
  };

  const onStageDblClick = () => {
    if (tool === "wall" && tempPoints.length >= 4) {
      setWalls((w) => [...w, { points: tempPoints.slice(), closed: false }]);
      setTempPoints([]);
    }
    if (tool === "area" && tempPoints.length >= 6) {
      setAreas((a) => [...a, { points: tempPoints.slice(), closed: true, name: `Areal ${a.length + 1}` }]);
      setTempPoints([]);
    }
  };

  const clearTemp = () => setTempPoints([]);

  // Scale workflow
  const [scaleInput, setScaleInput] = useState(0);
  const [outletType, setOutletType] = useState("stikk");

  // Cost calculations
  const wallLenMeters = (w: {points: number[]}) => (scalePxPerMeter ? lengthOfPolyline(w.points) / scalePxPerMeter : 0);
  const areaSqMeters = (a: {points: number[]}) => (scalePxPerMeter ? polygonArea(a.points) / (scalePxPerMeter * scalePxPerMeter) : 0);

  const totals = () => {
    const totalWallsM = walls.reduce((s, w) => s + wallLenMeters(w), 0);
    const totalAreasM2 = areas.reduce((s, a) => s + areaSqMeters(a), 0);
    const stikk = outlets.filter((o) => o.type === "stikk").length;
    const bryter = outlets.filter((o) => o.type === "bryter").length;
    const punkt = outlets.filter((o) => o.type === "punkt").length;

    const t: any = {};
    // Snekker
    t.snekker =
      totalWallsM * costs.snekker.gips_vegg_per_m +
      totalAreasM2 * costs.snekker.gips_tak_per_m2;

    // Elektriker
    t.elektriker =
      stikk * costs.elektriker.stikk_pr_stk +
      bryter * costs.elektriker.bryter_pr_stk +
      punkt * costs.elektriker.punkt_pr_stk +
      totalWallsM * costs.elektriker.skjult_anlegg_per_m;

    // Maler
    t.maler = totalAreasM2 * costs.maler.vegg_per_m2 + totalAreasM2 * costs.maler.tak_per_m2;

    t.sum = Object.values(t).reduce((a: number, b: number) => a + b, 0);
    return { totalWallsM, totalAreasM2, stikk, bryter, punkt, ...t };
  };

  const T = totals();

  return (
    <div className="p-4 w-full h-full grid grid-cols-1 lg:grid-cols-12 gap-4" ref={containerRef}>
      {/* Left controls */}
      <div className="lg:col-span-3 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">1) Last opp plantegning</CardTitle>
            <CardDescription>Last opp et skjermbilde av plantegningen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0] as File)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">2) Sett skala</CardTitle>
            <CardDescription>Velg verktøyet «Skala», klikk to punkter med kjent avstand på tegningen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap">
                <ToolButton active={tool === "scale"} onClick={() => setTool("scale")}>Skala</ToolButton>
                <ToolButton active={tool === "select"} onClick={() => setTool("select")}>Velg</ToolButton>
              </div>
              {tool === "scale" && scaleTempPoints.length === 2 && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Pikselavstand: {Math.round(distance(scaleTempPoints[0].x, scaleTempPoints[0].y, scaleTempPoints[1].x, scaleTempPoints[1].y))} px
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label className="text-sm">Reell avstand (meter):</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={scaleInput}
                      onChange={(e) => setScaleInput(parseFloat(e.target.value))}
                      className="w-24"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        const px = distance(scaleTempPoints[0].x, scaleTempPoints[0].y, scaleTempPoints[1].x, scaleTempPoints[1].y);
                        if (scaleInput > 0 && px > 0) {
                          setScalePxPerMeter(px / scaleInput);
                          setScaleTempPoints([]);
                          setTool("select");
                        }
                      }}
                    >
                      Sett
                    </Button>
                    <Button variant="outline" onClick={() => setScaleTempPoints([])}>Reset</Button>
                  </div>
                  {scalePxPerMeter && (
                    <div className="text-xs text-muted-foreground">
                      Skala: {scalePxPerMeter.toFixed(2)} px/m
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">3) Tegn</CardTitle>
            <CardDescription>Tegn vegger, arealer og el-punkter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap">
                <ToolButton active={tool === "wall"} onClick={() => setTool("wall")}>Vegg-linje</ToolButton>
                <ToolButton active={tool === "area"} onClick={() => setTool("area")}>Areal</ToolButton>
                <ToolButton active={tool === "outlet"} onClick={() => setTool("outlet")}>El-punkt</ToolButton>
                <ToolButton active={false} onClick={clearTemp}>Avslutt form</ToolButton>
              </div>
              {tool === "outlet" && (
                <div className="space-y-2">
                  <Label>Type:</Label>
                  <Select value={outletType} onValueChange={setOutletType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stikk">Stikk</SelectItem>
                      <SelectItem value="bryter">Bryter</SelectItem>
                      <SelectItem value="punkt">Annet punkt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">4) Kostnader</CardTitle>
            <CardDescription>Juster enhetspriser ved behov</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(costs).map(([trade, items]) => (
                <Card key={trade}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base capitalize">{trade}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(items).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between">
                          <Label className="text-sm text-muted-foreground">{k}</Label>
                          <Input
                            className="w-24 text-right"
                            type="number"
                            value={v}
                            onChange={(e) => setCosts((c) => ({
                              ...c,
                              [trade]: { ...c[trade], [k]: parseFloat(e.target.value) || 0 },
                            }))}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalcIcon className="h-5 w-5" />
              Oppsummering
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Vegg-lengde</div>
                <div className="text-right">{T.totalWallsM.toFixed(2)} m</div>
                <div>Areal</div>
                <div className="text-right">{T.totalAreasM2.toFixed(2)} m²</div>
                <div>Stikk</div>
                <div className="text-right">{T.stikk}</div>
                <div>Brytere</div>
                <div className="text-right">{T.bryter}</div>
                <div>Andre punkt</div>
                <div className="text-right">{T.punkt}</div>
              </div>
              
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Snekker</span>
                  <span>{Math.round(T.snekker).toLocaleString("no-NO")} kr</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Elektriker</span>
                  <span>{Math.round(T.elektriker).toLocaleString("no-NO")} kr</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Maler</span>
                  <span>{Math.round(T.maler).toLocaleString("no-NO")} kr</span>
                </div>
                <div className="flex justify-between font-semibold text-primary border-t pt-2">
                  <span>TOTALT</span>
                  <span>{Math.round(T.sum).toLocaleString("no-NO")} kr</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Canvas */}
      <div className="lg:col-span-9 bg-muted/30 rounded-lg overflow-hidden border">
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onClick={onStageClick}
          onDblClick={onStageDblClick}
          style={{ 
            cursor: tool === "scale" || tool === "wall" || tool === "area" || tool === "outlet" ? "crosshair" : "default",
            background: "white"
          }}
        >
          <Layer>
            {/* background image */}
            {image && (
              <KonvaImage 
                image={image} 
                x={0} 
                y={0} 
                width={stageSize.width} 
                height={stageSize.height} 
                opacity={0.95} 
              />
            )}

            {/* scale temp points */}
            {tool === "scale" && scaleTempPoints.map((p, idx) => (
              <Group key={`s-${idx}`}>
                <Circle x={p.x} y={p.y} radius={5} fill="#222" />
                <Text x={p.x + 8} y={p.y - 8} text={`P${idx + 1}`} fontSize={12} />
              </Group>
            ))}
            {tool === "scale" && scaleTempPoints.length === 2 && (
              <Line 
                points={[scaleTempPoints[0].x, scaleTempPoints[0].y, scaleTempPoints[1].x, scaleTempPoints[1].y]} 
                stroke="#222" 
                strokeWidth={2} 
                dash={[4, 4]} 
              />
            )}

            {/* existing walls */}
            {walls.map((w, i) => (
              <Line 
                key={`w-${i}`} 
                points={w.points} 
                stroke="#1f2937" 
                strokeWidth={3} 
                lineCap="round" 
                lineJoin="round"
              />
            ))}

            {/* existing areas */}
            {areas.map((a, i) => (
              <Group key={`a-${i}`}> 
                <Line 
                  points={a.points} 
                  closed 
                  stroke="#0f766e" 
                  strokeWidth={2} 
                  opacity={0.9} 
                  fill="rgba(16,185,129,0.15)" 
                />
              </Group>
            ))}

            {/* temp drawing */}
            {tempPoints.length > 0 && (tool === "wall" || tool === "area") && (
              <Line 
                points={tempPoints} 
                stroke={tool === "wall" ? "#1f2937" : "#0f766e"} 
                strokeWidth={tool === "wall" ? 3 : 2} 
                closed={tool === "area"} 
                dash={tool === "area" ? [6, 6] : undefined} 
              />
            )}

            {/* outlets */}
            {outlets.map((o, i) => (
              <Group key={`o-${i}`}> 
                <Circle 
                  x={o.x} 
                  y={o.y} 
                  radius={6} 
                  fill={o.type === "stikk" ? "#1d4ed8" : o.type === "bryter" ? "#b45309" : "#7c3aed"} 
                />
                <Text x={o.x + 8} y={o.y - 8} text={o.type} fontSize={12} />
              </Group>
            ))}

            {/* watermark if no scale */}
            {!scalePxPerMeter && (
              <Group>
                <Rect x={10} y={10} width={280} height={40} fill="white" opacity={0.8} cornerRadius={12} />
                <Text x={20} y={30} text="Sett skala for å få meter og m²" fontSize={14} fill="#111" />
              </Group>
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
