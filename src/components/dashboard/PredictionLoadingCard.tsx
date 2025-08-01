import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";

export const PredictionLoadingCard = () => {
  return (
    <Card className="relative overflow-hidden transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-lg border bg-muted">
            <Activity className="w-6 h-6 text-muted-foreground animate-pulse" />
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Carregando Previsão de Instabilidade
            </h3>
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
          
          <div className="flex items-baseline space-x-2">
            <Skeleton className="h-8 w-12" />
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">
                Analisando dados...
              </p>
              <div className="space-y-1">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading progress bar */}
        <div className="mt-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div className="h-2 bg-primary rounded-full animate-pulse" style={{ width: '30%' }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};