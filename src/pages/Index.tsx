import { Cpu, HardDrive, Network, Activity, Clock, Server } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { HostStatusCard } from "@/components/dashboard/HostStatusCard";
import { AlertsCard } from "@/components/dashboard/AlertsCard";
import { ChartPlaceholder } from "@/components/dashboard/ChartPlaceholder";
import { ChatButton } from "@/components/dashboard/ChatButton";
import { Footer } from "@/components/dashboard/Footer";

const Index = () => {
  // Mock data - será substituído por dados reais da API do Zabbix
  const mockHosts = [
    { id: "1", name: "Servidor Principal", ip: "192.168.1.100", status: "online" as const, uptime: "15d 4h 30m" },
    { id: "2", name: "Firewall Corporativo", ip: "192.168.1.1", status: "online" as const, uptime: "30d 12h 15m" },
    { id: "3", name: "Switch Core", ip: "192.168.1.10", status: "online" as const, uptime: "45d 8h 22m" },
    { id: "4", name: "Access Point WiFi", ip: "192.168.1.20", status: "offline" as const, lastSeen: "2h atrás" },
    { id: "5", name: "Servidor Backup", ip: "192.168.1.101", status: "online" as const, uptime: "7d 16h 45m" },
  ];

  const mockAlerts = [
    {
      id: "1",
      title: "Alto uso de CPU",
      description: "Servidor Principal com CPU acima de 90% por mais de 5 minutos",
      severity: "high" as const,
      timestamp: "há 15 minutos",
      host: "Servidor Principal",
      acknowledged: false
    },
    {
      id: "2",
      title: "Conectividade perdida",
      description: "Access Point WiFi não responde ao ping",
      severity: "critical" as const,
      timestamp: "há 2 horas",
      host: "Access Point WiFi",
      acknowledged: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <DashboardHeader />
      
      {/* Main Dashboard Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Métricas Principais */}
        <section>
          <h2 className="text-xl font-semibold mb-6 text-foreground">Métricas em Tempo Real</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="CPU Usage"
              value={78}
              unit="%"
              icon={Cpu}
              trend="up"
              trendValue="+5%"
              status="warning"
            />
            <MetricCard
              title="Memória RAM"
              value={64}
              unit="%"
              icon={HardDrive}
              trend="stable"
              trendValue="0%"
              status="normal"
            />
            <MetricCard
              title="Latência de Rede"
              value={12}
              unit="ms"
              icon={Network}
              trend="down"
              trendValue="-3ms"
              status="normal"
            />
            <MetricCard
              title="Uptime"
              value={99.8}
              unit="%"
              icon={Activity}
              trend="stable"
              trendValue="99.8%"
              status="normal"
            />
          </div>
        </section>

        {/* Status dos Hosts e Alertas */}
        <section>
          <h2 className="text-xl font-semibold mb-6 text-foreground">Status do Sistema</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HostStatusCard hosts={mockHosts} />
            <AlertsCard alerts={mockAlerts} />
          </div>
        </section>

        {/* Gráficos e Análises */}
        <section>
          <h2 className="text-xl font-semibold mb-6 text-foreground">Análises e Tendências</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <ChartPlaceholder
              title="Uso de CPU"
              type="line"
              description="Últimas 24 horas"
              height={250}
            />
            <ChartPlaceholder
              title="Tráfego de Rede"
              type="area"
              description="Entrada vs Saída"
              height={250}
            />
            <ChartPlaceholder
              title="Distribuição de Alertas"
              type="donut"
              description="Por severidade"
              height={250}
            />
            <ChartPlaceholder
              title="Performance por Host"
              type="bar"
              description="Comparativo mensal"
              height={250}
            />
            <ChartPlaceholder
              title="Disponibilidade"
              type="line"
              description="SLA mensal"
              height={250}
            />
            <ChartPlaceholder
              title="Uso de Recursos"
              type="bar"
              description="CPU, RAM, Disco"
              height={250}
            />
          </div>
        </section>

        {/* Métricas Adiciais */}
        <section>
          <h2 className="text-xl font-semibold mb-6 text-foreground">Métricas Detalhadas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard
              title="Hosts Online"
              value={42}
              icon={Server}
              status="normal"
              className="col-span-1"
            />
            <MetricCard
              title="Hosts Offline"
              value={3}
              icon={Server}
              status="critical"
              className="col-span-1"
            />
            <MetricCard
              title="Alertas Ativos"
              value={7}
              icon={Activity}
              status="warning"
              className="col-span-1"
            />
            <MetricCard
              title="Tempo Médio Resposta"
              value={145}
              unit="ms"
              icon={Clock}
              status="normal"
              className="col-span-1"
            />
            <MetricCard
              title="Throughput"
              value={8.4}
              unit="Gbps"
              icon={Network}
              trend="up"
              trendValue="+12%"
              status="normal"
              className="col-span-1"
            />
            <MetricCard
              title="Pacotes Perdidos"
              value={0.02}
              unit="%"
              icon={Network}
              trend="down"
              trendValue="-0.01%"
              status="normal"
              className="col-span-1"
            />
          </div>
        </section>
      </main>

      {/* Chat Button */}
      <ChatButton />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
