import { AlertTriangle, Clock, Shield } from "lucide-react";

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  host: string;
  acknowledged: boolean;
}

interface AlertsCardProps {
  alerts: Alert[];
}

export const AlertsCard = ({ alerts }: AlertsCardProps) => {
  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case "critical":
        return "bg-destructive/10 text-destructive border-destructive/30";
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    }
  };

  const getSeverityIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case "critical":
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="dashboard-card col-span-full lg:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg border border-destructive/30">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold">Alertas Recentes</h3>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Últimas 24h</span>
        </div>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-3 text-primary" />
            <p>Nenhum alerta crítico</p>
            <p className="text-sm">Sistema funcionando normalmente</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 rounded-lg border border-border/50 bg-muted/5 hover:bg-muted/10 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground">{alert.host}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                  {alert.acknowledged && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        RECONHECIDO
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{alert.timestamp}</span>
                {!alert.acknowledged && (
                  <button className="text-primary hover:text-primary/80 transition-colors">
                    Reconhecer
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};