import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardAction,
  CardHeader,
  CardHeaderText,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import {
  Table,
  TableWrap,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from '@/components/ui/table';
import { Stat, StatRow } from '@/components/ui/stat';
import { costTrackingService } from '@/services/cost-tracking.service';

export const CostsTab: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('30');

  const {
    data: systemCosts,
    isLoading,
    error,
    refetch,
  } = useQuery({
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
      <ErrorState
        title="Could not load cost data"
        message="The billing service did not respond."
        onRetry={refetch}
      />
    );
  }

  if (isLoading) {
    return (
      <Card>
        <LoadingState label="Loading cost analytics…" />
      </Card>
    );
  }

  const dailyCostsArray = systemCosts?.dailyCosts
    ? Object.entries(systemCosts.dailyCosts).sort(([a], [b]) =>
        a.localeCompare(b),
      )
    : [];

  const modelEntries = systemCosts?.modelBreakdown
    ? Object.entries(systemCosts.modelBreakdown).sort(
        ([, a], [, b]) => b.cost - a.cost,
      )
    : [];

  const operationEntries = systemCosts?.operationBreakdown
    ? Object.entries(systemCosts.operationBreakdown).sort(
        ([, a], [, b]) => b.cost - a.cost,
      )
    : [];

  const totalRequests = modelEntries.reduce(
    (sum, [, data]) => sum + data.requests,
    0,
  );
  const totalTokens = modelEntries.reduce(
    (sum, [, data]) => sum + data.tokens,
    0,
  );
  const dailyAverage =
    systemCosts && dailyCostsArray.length > 0
      ? systemCosts.totalCost / parseInt(timeRange)
      : 0;
  const maxDailyCost = dailyCostsArray.length
    ? Math.max(...dailyCostsArray.map(([, c]) => c))
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <StatRow columns={4}>
        <Stat
          label="Total cost"
          value={
            systemCosts ? formatLargeCurrency(systemCosts.totalCost) : '$0.00'
          }
        />
        <Stat label="Daily average" value={formatCurrency(dailyAverage)} />
        <Stat label="Total requests" value={totalRequests.toLocaleString()} />
        <Stat label="Total tokens" value={totalTokens.toLocaleString()} />
      </StatRow>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardHeaderText>
              <CardTitle>Daily costs</CardTitle>
            </CardHeaderText>
          </CardHeader>
          {dailyCostsArray.length > 0 ? (
            <TableWrap>
              <Table>
                <THead>
                  <tr>
                    <Th>Date</Th>
                    <Th numeric>Cost</Th>
                  </tr>
                </THead>
                <TBody>
                  {dailyCostsArray.slice(-7).map(([date, cost]) => (
                    <Tr key={date}>
                      <Td>
                        <time dateTime={date} className="text-muted-foreground">
                          {new Date(date).toLocaleDateString('en-GB', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </time>
                      </Td>
                      <Td numeric>
                        <div className="flex items-center justify-end gap-2">
                          <div
                            className="h-1.5 rounded-full bg-primary/40"
                            style={{
                              width: `${Math.max(12, (cost / Math.max(maxDailyCost, 0.0001)) * 64)}px`,
                            }}
                          />
                          <span className="tabular-nums text-foreground">
                            {formatCurrency(cost)}
                          </span>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          ) : (
            <EmptyState
              title="No spend in this period"
              description="A day appears here once an assessment run bills the provider. Widen the period to see earlier activity."
            />
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardHeaderText>
              <CardTitle>Model breakdown</CardTitle>
            </CardHeaderText>
          </CardHeader>
          {modelEntries.length > 0 ? (
            <TableWrap>
              <Table>
                <THead>
                  <tr>
                    <Th>Model</Th>
                    <Th numeric>Requests</Th>
                    <Th numeric>Tokens</Th>
                    <Th numeric>Cost</Th>
                  </tr>
                </THead>
                <TBody>
                  {modelEntries.map(([model, data]) => (
                    <Tr key={model}>
                      <Td>
                        <Badge variant="outline">{model}</Badge>
                      </Td>
                      <Td numeric className="text-muted-foreground">
                        {data.requests.toLocaleString()}
                      </Td>
                      <Td numeric className="text-muted-foreground">
                        {data.tokens.toLocaleString()}
                      </Td>
                      <Td numeric>{formatCurrency(data.cost)}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          ) : (
            <EmptyState
              title="No models used yet"
              description="Each model that has answered a request in this period is listed here with what it cost."
            />
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardHeaderText>
            <CardTitle>Operations breakdown</CardTitle>
          </CardHeaderText>
          <CardAction>
            <span className="text-xs text-muted-foreground">
              % of total cost
            </span>
          </CardAction>
        </CardHeader>
        {operationEntries.length > 0 ? (
          <TableWrap>
            <Table>
              <THead>
                <tr>
                  <Th>Operation</Th>
                  <Th numeric>Requests</Th>
                  <Th numeric>Cost</Th>
                  <Th numeric>Share</Th>
                </tr>
              </THead>
              <TBody>
                {operationEntries.map(([operation, data]) => (
                  <Tr key={operation}>
                    <Td>
                      <Badge>
                        {operation
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                    </Td>
                    <Td numeric className="text-muted-foreground">
                      {data.requests.toLocaleString()}
                    </Td>
                    <Td numeric>{formatCurrency(data.cost)}</Td>
                    <Td numeric className="text-muted-foreground">
                      {systemCosts && systemCosts.totalCost > 0
                        ? `${((data.cost / systemCosts.totalCost) * 100).toFixed(1)}%`
                        : '0%'}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </TableWrap>
        ) : (
          <EmptyState
            title="No operations in this period"
            description="Bulk imports and assessment runs are broken down here by what share of the bill each one accounts for."
          />
        )}
      </Card>
    </div>
  );
};
