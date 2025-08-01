import { Activity, Shield, Zap } from "lucide-react";

export const DashboardHeader = () => {
  return (
    <header className="w-full border-b border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Shield className="w-8 h-8 text-primary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Fios Tecnologia
                </h1>
                <p className="text-sm text-muted-foreground">Monitoramento de Redes</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Sistema Online</span>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <Zap className="w-4 h-4 text-secondary" />
              <span className="text-muted-foreground">Última atualização: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};