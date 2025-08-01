import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useZabbixHistory } from '@/hooks/useZabbixData';
import { LoadingSpinner } from './LoadingSpinner';
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RealTimeChartProps {
  itemId: string;
  title: string;
  timeRange: '24h' | '7d' | '30d';
  type?: 'line' | 'area';
  unit?: string;
  color?: string;
}

export const RealTimeChart: React.FC<RealTimeChartProps> = ({
  itemId,
  title,
  timeRange,
  type = 'line',
  unit = '',
  color = 'hsl(var(--primary))'
}) => {
  // Early return if no itemId is provided
  if (!itemId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível para este gráfico
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate time range
  const getTimeRange = () => {
    const now = Math.floor(Date.now() / 1000);
    let from: number;
    
    switch (timeRange) {
      case '24h':
        from = now - (24 * 60 * 60);
        break;
      case '7d':
        from = now - (7 * 24 * 60 * 60);
        break;
      case '30d':
        from = now - (30 * 24 * 60 * 60);
        break;
      default:
        from = now - (24 * 60 * 60);
    }
    
    return { from, to: now };
  };

  const timeRangeData = getTimeRange();
  const { data: historyData, isLoading, error, dataUpdatedAt } = useZabbixHistory(
    itemId, 
    timeRangeData
  );

  const formatXAxis = (tickItem: number) => {
    const date = new Date(tickItem);
    if (timeRange === '24h') {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === '7d') {
      return date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
    }
  };

  const formatTooltip = (value: any, name: any, props: any) => {
    if (props && props.payload) {
      const date = new Date(props.payload.timestamp);
      return [
        `${value}${unit}`,
        `${date.toLocaleString('pt-BR')}`
      ];
    }
    return [`${value}${unit}`, name];
  };

  const getTrend = () => {
    if (!historyData || historyData.length < 2) return null;
    
    const latest = historyData[historyData.length - 1]?.value || 0;
    const previous = historyData[historyData.length - 2]?.value || 0;
    
    if (latest > previous) return 'up';
    if (latest < previous) return 'down';
    return 'stable';
  };

  const trend = getTrend();
  const lastUpdate = new Date(dataUpdatedAt).toLocaleTimeString('pt-BR');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {title}
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Erro ao carregar dados: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {trend && (
              <>
                {trend === 'up' && <TrendingUp className="h-4 w-4 text-success" />}
                {trend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
                {trend === 'stable' && <Minus className="h-4 w-4" />}
              </>
            )}
            <Clock className="h-4 w-4" />
            <span>{lastUpdate}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'area' ? (
              <AreaChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatXAxis}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  formatter={formatTooltip}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color}
                  fill={color}
                  fillOpacity={0.3}
                />
              </AreaChart>
            ) : (
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatXAxis}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  formatter={formatTooltip}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};