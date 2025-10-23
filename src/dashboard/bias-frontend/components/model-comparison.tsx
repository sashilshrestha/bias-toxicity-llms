'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface SummaryMetric {
  condition: string;
  model_name: string;
  identity_mention_rate: number;
  negative_regard_percent: number;
  refusal_rate: number;
}

export function ModelComparison() {
  const [summaryData, setSummaryData] = useState<SummaryMetric[]>([]);

  useEffect(() => {
    fetch('/api/bias-data-summary')
      .then((res) => res.json())
      .then((data) => setSummaryData(data));
  }, []);

  const prepareChartData = (
    metric: 'identity_mention_rate' | 'negative_regard_percent' | 'refusal_rate'
  ) => {
    const models = ['GPT', 'Gemini', 'Grok'];
    return models.map((model) => {
      const baseline = summaryData.find(
        (d) => d.model_name === model && d.condition === 'baseline'
      );
      const socialEng = summaryData.find(
        (d) => d.model_name === model && d.condition === 'social_eng'
      );

      let baselineValue = baseline?.[metric] || 0;
      let socialEngValue = socialEng?.[metric] || 0;

      // Convert rates to percentages for display
      if (metric === 'identity_mention_rate' || metric === 'refusal_rate') {
        baselineValue *= 100;
        socialEngValue *= 100;
      }

      return {
        model,
        Baseline: baselineValue,
        'Social Engineering': socialEngValue,
      };
    });
  };

  const chartConfig = {
    Baseline: {
      label: 'Baseline',
      color: '#4a6fa5',
    },
    'Social Engineering': {
      label: 'Social Engineering',
      color: '#e27d60',
    },
  };

  return (
    <section>
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Model Comparison</CardTitle>
          <CardDescription>
            Compare metrics across baseline and social engineering conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="identity" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="identity">Identity Mention</TabsTrigger>
              <TabsTrigger value="regard">Negative Regard</TabsTrigger>
              <TabsTrigger value="refusal">Refusal Rate</TabsTrigger>
            </TabsList>
            <TabsContent value="identity" className="pt-6">
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareChartData('identity_mention_rate')}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis dataKey="model" className="text-xs" />
                    <YAxis
                      className="text-xs"
                      label={{
                        value: 'Rate (%)',
                        angle: -90,
                        position: 'insideLeft',
                      }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar
                      dataKey="Baseline"
                      fill={chartConfig.Baseline.color}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="Social Engineering"
                      fill={chartConfig['Social Engineering'].color}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </TabsContent>
            <TabsContent value="regard" className="pt-6">
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareChartData('negative_regard_percent')}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis dataKey="model" className="text-xs" />
                    <YAxis
                      className="text-xs"
                      label={{
                        value: 'Percentage (%)',
                        angle: -90,
                        position: 'insideLeft',
                      }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar
                      dataKey="Baseline"
                      fill={chartConfig.Baseline.color}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="Social Engineering"
                      fill={chartConfig['Social Engineering'].color}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </TabsContent>
            <TabsContent value="refusal" className="pt-6">
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareChartData('refusal_rate')}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis dataKey="model" className="text-xs" />
                    <YAxis
                      className="text-xs"
                      label={{
                        value: 'Rate (%)',
                        angle: -90,
                        position: 'insideLeft',
                      }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar
                      dataKey="Baseline"
                      fill={chartConfig.Baseline.color}
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="Social Engineering"
                      fill={chartConfig['Social Engineering'].color}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}
