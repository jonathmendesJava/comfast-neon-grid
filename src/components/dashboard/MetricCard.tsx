import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  status?: "normal" | "warning" | "critical";
  className?: string;
}

export const MetricCard = ({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendValue,
  status = "normal",
  className
}: MetricCardProps) => {
  const getStatusColor = () => {
    switch (status) {
      case "warning":
        return "text-status-warning border-yellow-500/30";
      case "critical":
        return "text-status-offline border-destructive/30";
      default:
        return "text-status-online border-primary/30";
    }
  };

  const getTrendIcon = () => {
    if (trend === "up") return "↗";
    if (trend === "down") return "↘";
    return "→";
  };

  return (
    <div className={cn("metric-card group", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-lg border", getStatusColor())}>
          <Icon className="w-6 h-6" />
        </div>
        {trendValue && (
          <div className={cn(
            "flex items-center text-xs font-medium px-2 py-1 rounded-full",
            trend === "up" ? "text-primary bg-primary/10" : 
            trend === "down" ? "text-destructive bg-destructive/10" : 
            "text-muted-foreground bg-muted/10"
          )}>
            <span className="mr-1">{getTrendIcon()}</span>
            {trendValue}
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </h3>
        <div className="flex items-baseline space-x-1">
          <span className="text-3xl font-bold text-foreground">{value}</span>
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
      </div>
      
      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
    </div>
  );
};