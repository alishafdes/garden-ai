import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Sun, Droplets, Search, Loader2 } from "lucide-react";

interface AddPlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PlantSearchResult {
  access_token: string;
  matched_in: string;
  matched_in_type: string;
  entity_name: string;
  entity_id: number;
}

interface PlantDetail {
  access_token: string;
  entity_name: string;
  common_names?: string[];
  description?: { value: string } | null;
  image?: { value: string } | null;
  watering?: { min: number; max: number } | null;
  best_watering?: string | null;
  best_light_condition?: string | null;
  best_soil_type?: string | null;
}

export const AddPlantDialog = ({ open, onOpenChange }: AddPlantDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPlant, setSelectedPlant] = useState<PlantDetail | null>(null);
  const [nickname, setNickname] = useState("");
  const [location, setLocation] = useState("");
  const [sectionId, setSectionId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: sections = [] } = useQuery({
    queryKey: ["garden_sections", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("garden_sections")
        .select("*")
        .eq("user_id", user!.id)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ["plant_search", debouncedSearch],
    queryFn: async () => {
      if (debouncedSearch.length < 2) return [];
      const { data, error } = await supabase.functions.invoke("search-plants", {
        body: { action: "search", query: debouncedSearch },
      });
      if (error) return [];
      return (data?.entities || []) as PlantSearchResult[];
    },
    enabled: debouncedSearch.length >= 2,
    staleTime: 60000,
  });

  const handleSelectPlant = async (plant: PlantSearchResult) => {
    setLoadingDetail(true);
    try {
      const { data: detail, error } = await supabase.functions.invoke("search-plants", {
        body: { action: "detail", token: plant.access_token },
      });
      if (error) throw new Error("Failed to fetch plant details");
      setSelectedPlant({
        access_token: plant.access_token,
        entity_name: detail.name || plant.entity_name,
        common_names: detail.common_names,
        description: detail.description,
        image: detail.image,
        watering: detail.watering,
        best_watering: detail.best_watering,
        best_light_condition: detail.best_light_condition,
        best_soil_type: detail.best_soil_type,
      });
    } catch (err) {
      // Fallback: use search result data
      setSelectedPlant({
        access_token: plant.access_token,
        entity_name: plant.entity_name,
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedPlant) return;
    setLoading(true);
    try {
      // Upsert into local plants catalog first
      const commonName = selectedPlant.common_names?.[0] || selectedPlant.entity_name;
      const scientificName = selectedPlant.entity_name;
      const imageUrl = selectedPlant.image?.value || null;
      const description = selectedPlant.description?.value || null;

      // Determine watering and sunlight from details
      let wateringFreq: string | null = null;
      if (selectedPlant.best_watering) {
        wateringFreq = selectedPlant.best_watering.slice(0, 100);
      } else if (selectedPlant.watering) {
        wateringFreq = selectedPlant.watering.max <= 1 ? "Low" : selectedPlant.watering.max <= 2 ? "Medium" : "High";
      }

      let sunlight: string | null = null;
      if (selectedPlant.best_light_condition) {
        sunlight = selectedPlant.best_light_condition.slice(0, 100);
      }

      // Insert into plants catalog if not exists
      const { data: existingPlant } = await supabase
        .from("plants")
        .select("id")
        .eq("scientific_name", scientificName)
        .maybeSingle();

      let plantId: string;
      if (existingPlant) {
        plantId = existingPlant.id;
      } else {
        const { data: newPlant, error: insertErr } = await supabase
          .from("plants")
          .insert({
            common_name: commonName,
            scientific_name: scientificName,
            image_url: imageUrl,
            description: description?.slice(0, 500) || null,
            watering_frequency: wateringFreq,
            sunlight,
          })
          .select("id")
          .single();
        if (insertErr) throw insertErr;
        plantId = newPlant.id;
      }

      const { error } = await supabase.from("garden_plants").insert({
        user_id: user!.id,
        plant_id: plantId,
        nickname: nickname || null,
        location: location || null,
        section_id: sectionId || null,
      });
      if (error) throw error;

      // Create initial watering task
      await supabase.from("garden_tasks").insert({
        user_id: user!.id,
        garden_plant_id: null,
        task_type: "Water",
        title: `Water your ${nickname || commonName}`,
        due_date: new Date().toISOString().split("T")[0],
      });

      queryClient.invalidateQueries({ queryKey: ["garden_plants"] });
      queryClient.invalidateQueries({ queryKey: ["garden_tasks"] });
      queryClient.invalidateQueries({ queryKey: ["plants_catalog"] });
      toast({ title: "Plant added! 🌱", description: `${commonName} is now in your garden.` });
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPlant(null);
    setNickname("");
    setLocation("");
    setSectionId("");
    setSearch("");
    setDebouncedSearch("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Add a Plant</DialogTitle>
          <DialogDescription>Search from over 35,000 plant species powered by Plant.id.</DialogDescription>
        </DialogHeader>

        {loadingDetail ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading plant details...</span>
          </div>
        ) : !selectedPlant ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search plants (e.g. Monstera, Rose, Basil)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {isSearching && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-xs text-muted-foreground">Searching...</span>
                </div>
              )}
              {!isSearching && debouncedSearch.length >= 2 && searchResults.length === 0 && (
                <p className="text-center py-6 text-sm text-muted-foreground">No plants found. Try a different search term.</p>
              )}
              {!isSearching && debouncedSearch.length < 2 && (
                <p className="text-center py-6 text-sm text-muted-foreground">Type at least 2 characters to search.</p>
              )}
              {searchResults.map((plant: PlantSearchResult) => (
                <button
                  key={plant.access_token}
                  onClick={() => handleSelectPlant(plant)}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-sans font-medium text-sm">{plant.entity_name}</p>
                      {plant.matched_in !== plant.entity_name && (
                        <p className="text-xs text-muted-foreground">Matched: {plant.matched_in}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Leaf className="w-3 h-3" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-3">
                {selectedPlant.image?.value ? (
                  <img
                    src={selectedPlant.image.value}
                    alt={selectedPlant.entity_name}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Leaf className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-semibold text-sm">
                    {selectedPlant.common_names?.[0] || selectedPlant.entity_name}
                  </p>
                  <p className="text-xs text-muted-foreground italic">{selectedPlant.entity_name}</p>
                  {selectedPlant.best_light_condition && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Sun className="w-3 h-3" /> {selectedPlant.best_light_condition.slice(0, 60)}
                    </div>
                  )}
                  {selectedPlant.best_watering && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                      <Droplets className="w-3 h-3" /> {selectedPlant.best_watering.slice(0, 60)}
                    </div>
                  )}
                </div>
              </div>
              {selectedPlant.description?.value && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{selectedPlant.description.value}</p>
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

            {sections.length > 0 && (
              <div className="space-y-2">
                <Label>Garden Section (optional)</Label>
                <Select value={sectionId} onValueChange={setSectionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.icon} {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

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
