import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Sun, Droplets, Search } from "lucide-react";

interface AddPlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddPlantDialog = ({ open, onOpenChange }: AddPlantDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedPlant, setSelectedPlant] = useState<any>(null);
  const [nickname, setNickname] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: plants = [] } = useQuery({
    queryKey: ["plants_catalog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plants").select("*").order("common_name");
      if (error) throw error;
      return data;
    },
  });

  const filteredPlants = plants.filter(
    (p: any) =>
      p.common_name.toLowerCase().includes(search.toLowerCase()) ||
      p.scientific_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async () => {
    if (!selectedPlant) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("garden_plants").insert({
        user_id: user!.id,
        plant_id: selectedPlant.id,
        nickname: nickname || null,
        location: location || null,
      });
      if (error) throw error;

      // Create initial watering task
      await supabase.from("garden_tasks").insert({
        user_id: user!.id,
        garden_plant_id: null, // simplified for MVP
        task_type: "Water",
        title: `Water your ${nickname || selectedPlant.common_name}`,
        due_date: new Date().toISOString().split("T")[0],
      });

      queryClient.invalidateQueries({ queryKey: ["garden_plants"] });
      queryClient.invalidateQueries({ queryKey: ["garden_tasks"] });
      toast({ title: "Plant added! 🌱", description: `${selectedPlant.common_name} is now in your garden.` });
      onOpenChange(false);
      setSelectedPlant(null);
      setNickname("");
      setLocation("");
      setSearch("");
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
          <DialogTitle className="font-serif">Add a Plant</DialogTitle>
          <DialogDescription>Choose from our catalog or search by name.</DialogDescription>
        </DialogHeader>

        {!selectedPlant ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search plants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredPlants.map((plant: any) => (
                <button
                  key={plant.id}
                  onClick={() => setSelectedPlant(plant)}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-sans font-medium text-sm">{plant.common_name}</p>
                      <p className="text-xs text-muted-foreground italic">{plant.scientific_name}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Sun className="w-3 h-3" />
                      <Droplets className="w-3 h-3" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-2">
                <Leaf className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-sans font-semibold text-sm">{selectedPlant.common_name}</p>
                  <p className="text-xs text-muted-foreground italic">{selectedPlant.scientific_name}</p>
                </div>
              </div>
              {selectedPlant.description && (
                <p className="text-xs text-muted-foreground mt-2">{selectedPlant.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Nickname (optional)</Label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Kitchen Basil"
              />
            </div>

            <div className="space-y-2">
              <Label>Location (optional)</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Backyard raised bed"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedPlant(null)}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleAdd} disabled={loading}>
                {loading ? "Adding..." : "Add to Garden"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
