import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Sun, Droplets, Leaf, Loader2, X, Lightbulb } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PlantIdResult {
  common_name: string;
  scientific_name: string;
  plant_type: string;
  confidence: string;
  description: string;
  sunlight: string;
  watering_frequency: string;
  care_tips: string[];
}

interface PlantScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resizeImage(file: File, maxDim = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve(dataUrl.split(",")[1]);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export function PlantScannerDialog({ open, onOpenChange }: PlantScannerDialogProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<PlantIdResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const identify = useMutation({
    mutationFn: async (base64: string) => {
      const { data, error } = await supabase.functions.invoke("identify-plant", {
        body: { imageBase64: base64 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as PlantIdResult;
    },
    onSuccess: (data) => setResult(data),
    onError: (err: Error) => {
      toast({ title: "Identification failed", description: err.message, variant: "destructive" });
    },
  });

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image.", variant: "destructive" });
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setResult(null);

    const base64 = await resizeImage(file);
    identify.mutate(base64);
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    identify.reset();
  };

  const confidenceColor = (c: string) => {
    if (c === "high") return "bg-primary/10 text-primary border-primary/20";
    if (c === "medium") return "bg-accent/10 text-accent-foreground border-accent/20";
    return "bg-destructive/10 text-destructive border-destructive/20";
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Plant Scanner
          </DialogTitle>
          <DialogDescription>
            Take a photo or upload an image to identify any plant.
          </DialogDescription>
        </DialogHeader>

        {!preview ? (
          <div className="space-y-3 py-4">
            <Button
              className="w-full h-24 text-lg"
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="w-6 h-6 mr-3" />
              Take Photo
            </Button>
            <Button
              className="w-full h-16"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-5 h-5 mr-3" />
              Upload from Gallery
            </Button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image preview */}
            <div className="relative rounded-xl overflow-hidden">
              <img src={preview} alt="Plant to identify" className="w-full max-h-56 object-cover" />
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                onClick={reset}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Loading state */}
            {identify.isPending && (
              <div className="flex flex-col items-center py-6 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Identifying plant…</p>
              </div>
            )}

            {/* Results */}
            {result && (
              <Card className="border-primary/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-xl">{result.common_name}</h3>
                      <p className="text-sm text-muted-foreground italic">{result.scientific_name}</p>
                    </div>
                    <Badge className={confidenceColor(result.confidence)} variant="outline">
                      {result.confidence} confidence
                    </Badge>
                  </div>

                  <p className="text-sm">{result.description}</p>

                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Leaf className="w-3.5 h-3.5 text-primary" />
                      {result.plant_type}
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Sun className="w-3.5 h-3.5 text-garden-sun" />
                      {result.sunlight}
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Droplets className="w-3.5 h-3.5 text-garden-sky" />
                      {result.watering_frequency}
                    </span>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <h4 className="font-serif font-semibold text-sm flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-accent" />
                      Care Tips
                    </h4>
                    <ul className="space-y-1">
                      {result.care_tips.map((tip, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-2">
                          <span className="text-primary font-bold">•</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button className="w-full" variant="outline" onClick={reset}>
                    Scan Another Plant
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
