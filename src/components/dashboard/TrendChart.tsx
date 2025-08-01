import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ZabbixHistoryData } from '@/services/zabbixService';
import { cn } from "@/lib/utils";

interface TrendChartProps {
  title: string;
  data: ZabbixHistoryData[];
  unit?: string;
  color?: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  className?: string;
  height?: number;
}

export const TrendChart = ({ 
  title, 
  data, 
  unit = '', 
  color = '#8884d8',
  warningThreshold,
  criticalThreshold,
  className,
  height = 200
}: TrendChartProps) => {
  
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatValue = (value: number) => {
    if (unit === 'ms') {
      return `${value.toFixed(1)}ms`;
    } else if (unit === '%') {
      return `${value.toFixed(1)}%`;
    } else if (unit === 'status') {
      return value === 1 ? 'Online' : 'Offline';
    }
    return `${value.toFixed(2)}${unit}`;
  };

  const chartData = data.map(item => ({
    timestamp: item.timestamp,
    time: formatTimestamp(item.timestamp),
    value: item.value
  }));

  const currentValue = data.length > 0 ? data[data.length - 1].value : 0;
  
  const getStatusColor = () => {
    if (criticalThreshold && currentValue >= criticalThreshold) {
      return 'text-destructive';
    } else if (warningThreshold && currentValue >= warningThreshold) {
      return 'text-orange-500';
    }
    return 'text-status-online';
  };

  const getStatusBadge = () => {
    if (criticalThreshold && currentValue >= criticalThreshold) {
      return <Badge variant="destructive">Crítico</Badge>;
    } else if (warningThreshold && currentValue >= warningThreshold) {
      return <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">Atenção</Badge>;
    }
    return <Badge variant="outline" className="border-status-online/30 text-status-online">Normal</Badge>;
  };

  return (
    <Card className={cn("transition-all duration-300 hover:shadow-lg", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </CardTitle>
          {getStatusBadge()}
        </div>
        <div className="flex items-baseline space-x-2">
          <span className={cn("text-2xl font-bold", getStatusColor())}>
            {formatValue(currentValue)}
          </span>
          <span className="text-xs text-muted-foreground">
            atual
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                domain={unit === 'status' ? [0, 1] : ['auto', 'auto']}
              />
              <Tooltip 
                labelFormatter={(value) => `Horário: ${value}`}
                formatter={(value: number) => [formatValue(value), title]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              
              {/* Warning threshold line */}
              {warningThreshold && (
                <ReferenceLine 
                  y={warningThreshold} 
                  stroke="#f59e0b" 
                  strokeDasharray="5 5" 
                  strokeWidth={1}
                />
              )}
              
              {/* Critical threshold line */}
              {criticalThreshold && (
                <ReferenceLine 
                  y={criticalThreshold} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5" 
                  strokeWidth={1}
                />
              )}
              
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: color }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {data.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground text-center">
            {data.length} pontos de dados • Última atualização: {formatTimestamp(data[data.length - 1].timestamp)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};