import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Cloud, CloudDrizzle, CloudRain, CloudSnow, CloudLightning, Sun, CloudSun, CloudFog, Droplets, Wind, Thermometer } from "lucide-react";

interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
  weatherDescription: string;
  isRainy: boolean;
  wateringAdjustment: string;
  wateringFactor: number;
  location: string;
}

function getWeatherIcon(code: number) {
  if ([0].includes(code)) return <Sun className="w-8 h-8 text-garden-sun" />;
  if ([1, 2].includes(code)) return <CloudSun className="w-8 h-8 text-garden-sun" />;
  if ([3].includes(code)) return <Cloud className="w-8 h-8 text-muted-foreground" />;
  if ([45, 48].includes(code)) return <CloudFog className="w-8 h-8 text-muted-foreground" />;
  if ([51, 53, 55].includes(code)) return <CloudDrizzle className="w-8 h-8 text-garden-sky" />;
  if ([61, 63, 65, 80, 81, 82].includes(code)) return <CloudRain className="w-8 h-8 text-garden-sky" />;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow className="w-8 h-8 text-garden-sky" />;
  if ([95, 96, 99].includes(code)) return <CloudLightning className="w-8 h-8 text-accent" />;
  return <Sun className="w-8 h-8 text-garden-sun" />;
}

export function WeatherCard({ zipCode }: { zipCode: string }) {
  const { data: weather, isLoading, error } = useQuery<WeatherData>({
    queryKey: ["weather", zipCode],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-weather", {
        body: { zip_code: zipCode },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    enabled: !!zipCode,
    staleTime: 1000 * 60 * 30, // 30 min cache
    refetchInterval: 1000 * 60 * 30,
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-garden-sky/10 to-primary/5 border-garden-sky/20">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return null; // Silently hide if weather unavailable
  }

  return (
    <Card className="bg-gradient-to-br from-garden-sky/10 to-primary/5 border-garden-sky/20 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0 mt-1">
            {getWeatherIcon(weather.weatherCode)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between">
              <h3 className="font-serif font-bold text-lg">{weather.temperature}°C</h3>
              <span className="text-xs text-muted-foreground truncate ml-2">{weather.location}</span>
            </div>
            <p className="text-sm text-muted-foreground">{weather.weatherDescription}</p>

            <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Droplets className="w-3 h-3" /> {weather.humidity}%
              </span>
              <span className="flex items-center gap-1">
                <Wind className="w-3 h-3" /> {weather.windSpeed} km/h
              </span>
              {weather.precipitation > 0 && (
                <span className="flex items-center gap-1">
                  <CloudRain className="w-3 h-3" /> {weather.precipitation}mm
                </span>
              )}
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-background/60 border border-border/50">
              <p className="text-sm font-medium flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{weather.wateringAdjustment}</span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
