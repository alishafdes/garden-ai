import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const SECTION_ICONS = ["🌱", "🌻", "🌿", "🌳", "🪴", "🌾", "🍅", "🌸", "🏡", "☀️"];

interface GardenSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editSection?: { id: string; name: string; description: string | null; icon: string | null } | null;
}

export const GardenSectionDialog = ({ open, onOpenChange, editSection }: GardenSectionDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState(editSection?.name || "");
  const [description, setDescription] = useState(editSection?.description || "");
  const [icon, setIcon] = useState(editSection?.icon || "🌱");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      if (editSection) {
        const { error } = await supabase
          .from("garden_sections")
          .update({ name: name.trim(), description: description.trim() || null, icon })
          .eq("id", editSection.id);
        if (error) throw error;
        toast({ title: "Section updated ✨" });
      } else {
        const { error } = await supabase
          .from("garden_sections")
          .insert({ user_id: user!.id, name: name.trim(), description: description.trim() || null, icon });
        if (error) throw error;
        toast({ title: "Section created! 🌿", description: `"${name.trim()}" is ready for plants.` });
      }
      queryClient.invalidateQueries({ queryKey: ["garden_sections"] });
      onOpenChange(false);
      setName("");
      setDescription("");
      setIcon("🌱");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">{editSection ? "Edit Section" : "New Garden Section"}</DialogTitle>
          <DialogDescription>
            Organize your garden into sections like "Front Yard" or "Indoor Plants".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {SECTION_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors ${
                    icon === emoji ? "bg-primary/15 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Front Yard, Indoor Plants"
            />
          </div>

          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Raised beds near the patio"
              rows={2}
            />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={loading || !name.trim()}>
            {loading ? "Saving..." : editSection ? "Save Changes" : "Create Section"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
