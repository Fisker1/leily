import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import "react-image-crop/dist/ReactCrop.css";

const cropperStyles = `
  .ReactCrop__crop-selection {
    border: 2px solid hsl(var(--primary));
    box-shadow: 0 0 0 9999em rgba(0, 0, 0, 0.5);
  }
  
  .ReactCrop__drag-handle {
    background-color: hsl(var(--primary));
    border: 1px solid hsl(var(--primary-foreground));
  }
  
  .ReactCrop__drag-handle:after {
    background-color: hsl(var(--primary-foreground));
  }
`;

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export const ImageCropDialog = ({ open, onOpenChange, imageSrc, onCropComplete }: ImageCropDialogProps) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1)); // 1:1 aspect ratio for circular avatar
  }, []);

  const getCroppedImg = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      toast({
        title: "Feil",
        description: "Kunne ikke behandle bildet",
        variant: "destructive",
      });
      return;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
    );

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/jpeg',
        0.9
      );
    });
  }, [completedCrop, toast]);

  const handleSave = async () => {
    try {
      const croppedBlob = await getCroppedImg();
      if (croppedBlob) {
        onCropComplete(croppedBlob);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      toast({
        title: "Feil ved beskjæring",
        description: "Kunne ikke beskjære bildet. Prøv igjen.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <style>{cropperStyles}</style>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Beskjær profilbilde</DialogTitle>
          <DialogDescription>
            Dra for å velge området som skal brukes som profilbilde
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center max-h-96 overflow-hidden">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={1}
            circularCrop
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imageSrc}
              onLoad={onImageLoad}
              className="max-w-full max-h-96 object-contain"
            />
          </ReactCrop>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSave} disabled={!completedCrop}>
            Lagre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};