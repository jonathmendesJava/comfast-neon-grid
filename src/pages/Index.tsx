import { Cpu, HardDrive, Network, Activity, Clock, Server } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { HostStatusCard } from "@/components/dashboard/HostStatusCard";
import { AlertsCard } from "@/components/dashboard/AlertsCard";
import { ChartPlaceholder } from "@/components/dashboard/ChartPlaceholder";
import { ChatButton } from "@/components/dashboard/ChatButton";
import { Footer } from "@/components/dashboard/Footer";
import { useZabbixHosts, useZabbixAlerts, useZabbixMetrics } from "@/hooks/useZabbixData";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";

const Index = () => {
  // Hooks para dados reais do Zabbix
  const { data: zabbixHosts, isLoading: hostsLoading, error: hostsError } = useZabbixHosts();
  const { data: zabbixAlerts, isLoading: alertsLoading, error: alertsError } = useZabbixAlerts();
  const { data: zabbixMetrics, isLoading: metricsLoading, error: metricsError } = useZabbixMetrics();

  // Mapear dados do Zabbix para o formato esperado pelos componentes
  const hosts = zabbixHosts?.map(host => ({
    id: host.id,
    name: host.name,
    ip: host.ip,
    status: host.available === 'online' ? 'online' as const : 'offline' as const,
    uptime: host.available === 'online' ? 'Online' : 'Offline',
    lastSeen: host.available === 'offline' ? 'Indisponível' : undefined,
  })) || [];

  const alerts = zabbixAlerts || [];

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
            {metricsLoading ? (
              <div className="metric-card flex items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : metricsError ? (
              <div className="metric-card flex items-center justify-center text-destructive">
                Erro: {metricsError.message}
              </div>
            ) : (
              <>
                <MetricCard
                  title="CPU Média"
                  value={zabbixMetrics?.find(m => m.type === 'cpu')?.value || '0'}
                  unit="%"
                  icon={Cpu}
                  trend="stable"
                  status="normal"
                />
                <MetricCard
                  title="Memória RAM"
                  value={zabbixMetrics?.find(m => m.type === 'memory')?.value || '0'}
                  unit="%"
                  icon={HardDrive}
                  trend="stable"
                  status="normal"
                />
                <MetricCard
                  title="Ping Médio"
                  value={zabbixMetrics?.find(m => m.type === 'ping')?.value || '0'}
                  unit="ms"
                  icon={Network}
                  trend="stable"
                  status="normal"
                />
                <MetricCard
                  title="Hosts Online"
                  value={hosts.filter(h => h.status === 'online').length.toString()}
                  unit={`/${hosts.length}`}
                  icon={Activity}
                  trend="stable"
                  status="normal"
                />
              </>
            )}
          </div>
        </section>

        {/* Status dos Hosts e Alertas */}
        <section>
          <h2 className="text-xl font-semibold mb-6 text-foreground">Status do Sistema</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hostsLoading ? (
              <div className="metric-card flex items-center justify-center min-h-[200px]">
                <LoadingSpinner />
              </div>
            ) : hostsError ? (
              <div className="metric-card flex items-center justify-center min-h-[200px] text-destructive">
                Erro ao carregar hosts: {hostsError.message}
              </div>
            ) : (
              <HostStatusCard hosts={hosts} />
            )}
            {alertsLoading ? (
              <div className="metric-card flex items-center justify-center min-h-[200px]">
                <LoadingSpinner />
              </div>
            ) : alertsError ? (
              <div className="metric-card flex items-center justify-center min-h-[200px] text-destructive">
                Erro ao carregar alertas: {alertsError.message}
              </div>
            ) : (
              <AlertsCard alerts={alerts} />
            )}
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
