import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
}

export const ImageCropDialog = ({ open, onOpenChange, imageSrc, onCropComplete }: ImageCropDialogProps) => {

  const handleSave = async () => {
    // Simplified version - just close dialog
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Beskjær profilbilde</DialogTitle>
          <DialogDescription>
            Bilderedigering er midlertidig deaktivert
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center p-8">
          <img
            alt="Preview"
            src={imageSrc}
            className="max-w-full max-h-96 object-contain"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleSave}>
            Lagre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};