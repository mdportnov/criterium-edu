import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  Activity, 
  Zap,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react';
import { costTrackingService } from '@/services/cost-tracking.service';
import type { SystemCostsDto } from '@app/shared';

export const CostsTab: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('30');

  const { data: systemCosts, isLoading, error } = useQuery({
    queryKey: ['system-costs', timeRange],
    queryFn: () => costTrackingService.getSystemCosts(parseInt(timeRange)),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(amount);
  };

  const formatLargeCurrency = (amount: number) => {
    if (amount >= 1) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    }
    return formatCurrency(amount);
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load cost data</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-muted-foreground">Loading cost analytics...</span>
      </div>
    );
  }

  const dailyCostsArray = systemCosts?.dailyCosts 
    ? Object.entries(systemCosts.dailyCosts).sort(([a], [b]) => a.localeCompare(b))
    : [];

  const modelEntries = systemCosts?.modelBreakdown 
    ? Object.entries(systemCosts.modelBreakdown).sort(([,a], [,b]) => b.cost - a.cost)
    : [];

  const operationEntries = systemCosts?.operationBreakdown
    ? Object.entries(systemCosts.operationBreakdown).sort(([,a], [,b]) => b.cost - a.cost)  
    : [];

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cost Analytics</h2>
          <p className="text-muted-foreground">Monitor API usage and costs</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
              <p className="text-2xl font-bold text-foreground">
                {systemCosts ? formatLargeCurrency(systemCosts.totalCost) : '$0.00'}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Daily Average</p>
              <p className="text-2xl font-bold text-foreground">
                {systemCosts && dailyCostsArray.length > 0 
                  ? formatCurrency(systemCosts.totalCost / parseInt(timeRange))
                  : '$0.00'
                }
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
              <p className="text-2xl font-bold text-foreground">
                {modelEntries.reduce((sum, [, data]) => sum + data.requests, 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
              <p className="text-2xl font-bold text-foreground">
                {modelEntries.reduce((sum, [, data]) => sum + data.tokens, 0).toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Costs */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Daily Costs</h3>
          </div>
          <div className="space-y-3">
            {dailyCostsArray.length > 0 ? (
              dailyCostsArray.slice(-7).map(([date, cost]) => (
                <div key={date} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {new Date(date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 bg-primary rounded-full"
                      style={{ 
                        width: `${Math.max(20, (cost / Math.max(...dailyCostsArray.map(([, c]) => c))) * 100)}px` 
                      }}
                    />
                    <span className="text-sm font-medium min-w-[60px] text-right">
                      {formatCurrency(cost)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No cost data available</p>
            )}
          </div>
        </Card>

        {/* Model Breakdown */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Model Breakdown</h3>
          </div>
          <div className="space-y-3">
            {modelEntries.length > 0 ? (
              modelEntries.map(([model, data]) => (
                <div key={model} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {model}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {data.requests} requests
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {data.tokens.toLocaleString()} tokens
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(data.cost)}</p>
                    <p className="text-xs text-muted-foreground">
                      {systemCosts && systemCosts.totalCost > 0 
                        ? `${((data.cost / systemCosts.totalCost) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No model data available</p>
            )}
          </div>
        </Card>
      </div>

      {/* Operations Breakdown */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Operations Breakdown</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {operationEntries.length > 0 ? (
            operationEntries.map(([operation, data]) => (
              <div key={operation} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="text-xs">
                    {operation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                  <span className="text-sm font-medium">{formatCurrency(data.cost)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{data.requests} requests</span>
                  <span>
                    {systemCosts && systemCosts.totalCost > 0 
                      ? `${((data.cost / systemCosts.totalCost) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <p className="text-muted-foreground text-center py-4">No operation data available</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};