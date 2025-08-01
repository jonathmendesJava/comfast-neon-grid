import React from "react";
import { Cpu, HardDrive, Network, Activity, Clock, Server } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { EnhancedMetricCard } from "@/components/dashboard/EnhancedMetricCard";
import { HostStatusCard } from "@/components/dashboard/HostStatusCard";
import { HostDetailsModal } from "@/components/dashboard/HostDetailsModal";
import { AlertsCard } from "@/components/dashboard/AlertsCard";
import { MetricsOverview } from "@/components/dashboard/MetricsOverview";
import { ChartPlaceholder } from "@/components/dashboard/ChartPlaceholder";
import { ChatButton } from "@/components/dashboard/ChatButton";
import { Footer } from "@/components/dashboard/Footer";
import { useZabbixHosts, useZabbixAlerts, useZabbixMetrics } from "@/hooks/useZabbixData";
import { LoadingSpinner } from "@/components/dashboard/LoadingSpinner";

const Index = () => {
  const [selectedHost, setSelectedHost] = React.useState<any>(null);
  const [isHostModalOpen, setIsHostModalOpen] = React.useState(false);
  
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

  const handleHostClick = (host: any) => {
    setSelectedHost(host);
    setIsHostModalOpen(true);
  };

  const handleCloseHostModal = () => {
    setIsHostModalOpen(false);
    setSelectedHost(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <DashboardHeader />
      
      {/* Main Dashboard Content */}
      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Enhanced Metrics Overview */}
        <section>
          <h2 className="text-xl font-semibold mb-6 text-foreground">Visão Geral das Métricas</h2>
          <MetricsOverview />
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
              <HostStatusCard hosts={hosts} onHostClick={handleHostClick} />
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

        {/* Legacy Metrics for Comparison */}
        <section>
          <h2 className="text-xl font-semibold mb-6 text-foreground">Métricas Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metricsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="metric-card flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ))
            ) : metricsError ? (
              <div className="col-span-full metric-card flex items-center justify-center text-destructive">
                Erro: {metricsError.message}
              </div>
            ) : (
              <>
                <EnhancedMetricCard
                  title="CPU Média"
                  value={parseFloat(zabbixMetrics?.find(m => m.type === 'cpu')?.value || '0').toFixed(1)}
                  unit="%"
                  icon={Cpu}
                  trend="stable"
                  status="normal"
                  isLoading={metricsLoading}
                  lastUpdate={zabbixMetrics?.find(m => m.type === 'cpu')?.lastUpdate}
                />
                <EnhancedMetricCard
                  title="Memória RAM"
                  value={parseFloat(zabbixMetrics?.find(m => m.type === 'memory')?.value || '0').toFixed(1)}
                  unit="%"
                  icon={HardDrive}
                  trend="stable"
                  status="normal"
                  isLoading={metricsLoading}
                  lastUpdate={zabbixMetrics?.find(m => m.type === 'memory')?.lastUpdate}
                />
                <EnhancedMetricCard
                  title="Ping Status"
                  value={zabbixMetrics?.find(m => m.type === 'ping')?.value === '1' ? '100' : '0'}
                  unit="%"
                  icon={Network}
                  trend="stable"
                  status={zabbixMetrics?.find(m => m.type === 'ping')?.value === '1' ? 'normal' : 'critical'}
                  isLoading={metricsLoading}
                  lastUpdate={zabbixMetrics?.find(m => m.type === 'ping')?.lastUpdate}
                />
                <EnhancedMetricCard
                  title="Hosts Online"
                  value={hosts.filter(h => h.status === 'online').length.toString()}
                  icon={Activity}
                  trend="stable"
                  status={hosts.filter(h => h.status === 'online').length < hosts.length ? "warning" : "normal"}
                  isLoading={hostsLoading}
                  subtitle={`${hosts.length} hosts totais`}
                  lastUpdate={new Date().toISOString()}
                />
              </>
            )}
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
      
      <HostDetailsModal 
        host={selectedHost}
        isOpen={isHostModalOpen}
        onClose={handleCloseHostModal}
      />
    </div>
  );
};

export default Index;
