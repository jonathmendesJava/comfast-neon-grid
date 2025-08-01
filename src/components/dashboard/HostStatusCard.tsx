import { Server, Wifi, WifiOff } from "lucide-react";

interface Host {
  id: string;
  name: string;
  ip: string;
  status: "online" | "offline";
  uptime?: string;
  lastSeen?: string;
}

interface HostStatusCardProps {
  hosts: Host[];
  onHostClick?: (host: Host) => void;
}

export const HostStatusCard = ({ hosts, onHostClick }: HostStatusCardProps) => {
  const onlineHosts = hosts.filter(host => host.status === "online");
  const offlineHosts = hosts.filter(host => host.status === "offline");

  return (
    <div className="dashboard-card col-span-full lg:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg border border-primary/30">
            <Server className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Status dos Hosts</h3>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-primary rounded-full" />
            <span className="text-muted-foreground">Online: {onlineHosts.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-destructive rounded-full" />
            <span className="text-muted-foreground">Offline: {offlineHosts.length}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {hosts.map((host) => (
          <div
            key={host.id}
            className={`flex items-center justify-between p-4 rounded-lg border border-border/50 bg-muted/5 hover:bg-muted/10 transition-colors ${
              onHostClick ? 'cursor-pointer hover:border-primary/30' : ''
            }`}
            onClick={() => onHostClick?.(host)}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-2 rounded-lg ${
                host.status === "online" 
                  ? "bg-primary/10 text-primary" 
                  : "bg-destructive/10 text-destructive"
              }`}>
                {host.status === "online" ? (
                  <Wifi className="w-4 h-4" />
                ) : (
                  <WifiOff className="w-4 h-4" />
                )}
              </div>
              
              <div>
                <h4 className="font-medium text-foreground">{host.name}</h4>
                <p className="text-sm text-muted-foreground">{host.ip}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                host.status === "online"
                  ? "bg-primary/10 text-primary"
                  : "bg-destructive/10 text-destructive"
              }`}>
                {host.status.toUpperCase()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {host.status === "online" && host.uptime ? `Uptime: ${host.uptime}` : 
                 host.status === "offline" && host.lastSeen ? `Offline desde: ${host.lastSeen}` : 
                 "Status atualizado"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};