import { BarChart3, LineChart, PieChart, TrendingUp } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface ChartPlaceholderProps {
  title: string;
  type: "line" | "bar" | "donut" | "area";
  height?: number;
  description?: string;
}

export const ChartPlaceholder = ({ 
  title, 
  type, 
  height = 200, 
  description 
}: ChartPlaceholderProps) => {
  const getIcon = (): LucideIcon => {
    switch (type) {
      case "line":
      case "area":
        return LineChart;
      case "bar":
        return BarChart3;
      case "donut":
        return PieChart;
      default:
        return TrendingUp;
    }
  };

  const Icon = getIcon();

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg border border-primary/30">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span>Tempo real</span>
        </div>
      </div>

      <div 
        className="relative flex items-center justify-center border border-dashed border-border/50 rounded-lg bg-muted/5"
        style={{ height: `${height}px` }}
      >
        <div className="text-center">
          <Icon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Gráfico {type === "donut" ? "de Pizza" : type === "bar" ? "de Barras" : "de Linha"}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Dados serão carregados via API
          </p>
        </div>
        
        {/* Decorative grid pattern */}
        <div className="absolute inset-0 grid-pattern opacity-20 rounded-lg" />
        
        {/* Simulated data points for line charts */}
        {(type === "line" || type === "area") && (
          <div className="absolute inset-4 flex items-end justify-between">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary/30 rounded-t animate-pulse"
                style={{
                  height: `${Math.random() * 60 + 20}%`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        )}
        
        {/* Simulated data for bar charts */}
        {type === "bar" && (
          <div className="absolute inset-4 flex items-end justify-between space-x-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-primary/40 to-secondary/20 rounded-t animate-pulse"
                style={{
                  height: `${Math.random() * 70 + 20}%`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        )}
        
        {/* Simulated donut chart */}
        {type === "donut" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full border-8 border-primary/30" />
              <div className="absolute inset-0 rounded-full border-8 border-primary border-t-transparent animate-spin" 
                   style={{ animationDuration: "3s" }} />
            </div>
          </div>
        )}
      </div>
      
      {/* Mock legend for charts */}
      <div className="flex items-center justify-center space-x-4 mt-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-primary rounded" />
          <span className="text-muted-foreground">Atual</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 bg-secondary rounded" />
          <span className="text-muted-foreground">Anterior</span>
        </div>
      </div>
    </div>
  );
};