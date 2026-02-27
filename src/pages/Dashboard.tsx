import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { LogOut, Sprout, Sun, Droplets, Calendar, Plus, Check, Leaf, MapPin, ScanLine } from "lucide-react";
import { AddPlantDialog } from "@/components/AddPlantDialog";
import { ProfileSetup } from "@/components/ProfileSetup";
import { WeatherCard } from "@/components/WeatherCard";
import { PlantScannerDialog } from "@/components/PlantScannerDialog";
import { useState } from "react";

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [addPlantOpen, setAddPlantOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: gardenPlants = [] } = useQuery({
    queryKey: ["garden_plants", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("garden_plants")
        .select("*, plants(*)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["garden_tasks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("garden_tasks")
        .select("*")
        .eq("user_id", user!.id)
        .eq("completed", false)
        .order("due_date", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("garden_tasks")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", taskId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["garden_tasks"] });
    },
  });

  if (profile && !profile.zip_code) {
    return <ProfileSetup />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const getHealthColor = (score: number) => {
    if (score >= 70) return "text-primary";
    if (score >= 40) return "text-accent";
    return "text-destructive";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Sprout className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg leading-tight">My Garden</h2>
              {profile?.zip_code && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {profile.zip_code}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-5xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Welcome */}
          <motion.div variants={itemVariants}>
            <h1 className="text-3xl font-serif font-bold">
              Hello, {profile?.full_name || "Gardener"} 🌿
            </h1>
            <p className="text-muted-foreground mt-1 font-sans">
              Here's what your garden needs today.
            </p>
          </motion.div>

          {/* Weather */}
          {profile?.zip_code && (
            <motion.div variants={itemVariants}>
              <WeatherCard zipCode={profile.zip_code} />
            </motion.div>
          )}

          {/* Stats Row */}
          <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-4 text-center">
                <Leaf className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-2xl font-serif font-bold">{gardenPlants.length}</p>
                <p className="text-xs text-muted-foreground">Plants</p>
              </CardContent>
            </Card>
            <Card className="bg-accent/10 border-accent/20">
              <CardContent className="p-4 text-center">
                <Calendar className="w-6 h-6 text-accent mx-auto mb-1" />
                <p className="text-2xl font-serif font-bold">{tasks.length}</p>
                <p className="text-xs text-muted-foreground">Tasks Due</p>
              </CardContent>
            </Card>
            <Card className="bg-garden-sky/10 border-garden-sky/20">
              <CardContent className="p-4 text-center">
                <Sun className="w-6 h-6 text-garden-sun mx-auto mb-1" />
                <p className="text-2xl font-serif font-bold">
                  {gardenPlants.length > 0
                    ? Math.round(gardenPlants.reduce((a: number, p: any) => a + (p.health_score || 80), 0) / gardenPlants.length)
                    : "--"}
                </p>
                <p className="text-xs text-muted-foreground">Avg Health</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Today's Tasks */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-garden-sky" />
                  Today's Tasks
                </CardTitle>
                <CardDescription>Keep your garden thriving</CardDescription>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">
                    No pending tasks — your garden is happy! 🌻
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((task: any) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div>
                          <p className="font-sans font-medium text-sm">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {task.task_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => completeTask.mutate(task.id)}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* My Plants */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold">My Plants</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setScannerOpen(true)}>
                  <ScanLine className="w-4 h-4 mr-1" />
                  Scan Plant
                </Button>
                <Button size="sm" onClick={() => setAddPlantOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Plant
                </Button>
              </div>
            </div>

            {gardenPlants.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="py-12 text-center">
                  <Sprout className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                  <h3 className="font-serif font-semibold text-lg">Your garden awaits</h3>
                  <p className="text-muted-foreground text-sm mt-1 mb-4">
                    Start by adding your first plant to get personalized care tips.
                  </p>
                  <Button onClick={() => setAddPlantOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Your First Plant
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {gardenPlants.map((gp: any) => (
                  <motion.div key={gp.id} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                    <Card className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-serif font-semibold">
                              {gp.nickname || gp.plants?.common_name || "Unknown Plant"}
                            </h3>
                            {gp.plants?.scientific_name && (
                              <p className="text-xs text-muted-foreground italic">
                                {gp.plants.scientific_name}
                              </p>
                            )}
                          </div>
                          <span className={`text-lg font-serif font-bold ${getHealthColor(gp.health_score || 80)}`}>
                            {gp.health_score || 80}%
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                          {gp.plants?.sunlight && (
                            <span className="flex items-center gap-1">
                              <Sun className="w-3 h-3" /> {gp.plants.sunlight}
                            </span>
                          )}
                          {gp.plants?.watering_frequency && (
                            <span className="flex items-center gap-1">
                              <Droplets className="w-3 h-3" /> {gp.plants.watering_frequency}
                            </span>
                          )}
                        </div>
                        {gp.location && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {gp.location}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </main>

      <AddPlantDialog open={addPlantOpen} onOpenChange={setAddPlantOpen} />
      <PlantScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} />
    </div>
  );
};

export default Dashboard;
