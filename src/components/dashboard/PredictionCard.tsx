import { AlertTriangle, Shield, AlertCircle, Skull } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PredictionResult } from "@/hooks/useInstabilityPrediction";

interface PredictionCardProps {
  prediction: PredictionResult;
  hostName?: string;
  className?: string;
}

export const PredictionCard = ({ prediction, hostName, className }: PredictionCardProps) => {
  const getRiskConfig = () => {
    switch (prediction.riskLevel) {
      case 'critical':
        return {
          icon: Skull,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/30',
          badgeVariant: 'destructive' as const,
          label: 'CRÍTICO',
        };
      case 'high':
        return {
          icon: AlertTriangle,
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/30',
          badgeVariant: 'secondary' as const,
          label: 'ALTO',
        };
      case 'medium':
        return {
          icon: AlertCircle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          badgeVariant: 'outline' as const,
          label: 'MÉDIO',
        };
      case 'low':
      default:
        return {
          icon: Shield,
          color: 'text-status-online',
          bgColor: 'bg-status-online/10',
          borderColor: 'border-status-online/30',
          badgeVariant: 'outline' as const,
          label: 'BAIXO',
        };
    }
  };

  const config = getRiskConfig();
  const Icon = config.icon;
  
  const formatETA = (minutes: number | null) => {
    if (!minutes) return null;
    
    if (minutes < 60) {
      return `${minutes}min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    }
  };

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
      config.borderColor,
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "p-3 rounded-lg border",
            config.bgColor,
            config.borderColor
          )}>
            <Icon className={cn("w-6 h-6", config.color)} />
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge variant={config.badgeVariant} className="font-bold">
              {config.label}
            </Badge>
            {prediction.etaMinutes && (
              <div className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                config.bgColor,
                config.color
              )}>
                ETA: {formatETA(prediction.etaMinutes)}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Previsão de Instabilidade
            </h3>
            {hostName && (
              <p className="text-xs text-muted-foreground mt-1">{hostName}</p>
            )}
          </div>
          
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-foreground">
              {prediction.riskScore}
            </span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>

          <div className="space-y-2">
            <p className={cn("text-sm font-medium", config.color)}>
              {prediction.recommendation}
            </p>
            
            {prediction.factors.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">
                  Fatores de risco:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {prediction.factors.slice(0, 3).map((factor, index) => (
                    <li key={index} className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-current rounded-full" />
                      {factor}
                    </li>
                  ))}
                  {prediction.factors.length > 3 && (
                    <li className="text-xs text-muted-foreground/70">
                      +{prediction.factors.length - 3} outros fatores
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Risk level indicator bar */}
        <div className="mt-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                config.color.replace('text-', 'bg-')
              )}
              style={{ width: `${prediction.riskScore}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};