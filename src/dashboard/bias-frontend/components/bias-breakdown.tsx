'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface BiasMetric {
  model_name: string;
  condition: string;
  regard_label: string;
  has_identity: number;
}

export function BiasBreakdown() {
  const [rawData, setRawData] = useState<BiasMetric[]>([]);
  const [selectedCondition, setSelectedCondition] =
    useState<string>('baseline');

  useEffect(() => {
    fetch('/api/bias-data')
      .then((res) => res.json())
      .then((data) => setRawData(data));
  }, []);

  const prepareChartData = () => {
    const models = ['GPT', 'Gemini', 'Grok'];
    const filteredData = rawData.filter(
      (d) => d.condition === selectedCondition && d.has_identity === 1
    );

    return models.map((model) => {
      const modelData = filteredData.filter((d) => d.model_name === model);
      const total = modelData.length;

      const positive = modelData.filter((d) => d.regard_label === 'pos').length;
      const neutral = modelData.filter((d) => d.regard_label === 'neu').length;
      const negative = modelData.filter((d) => d.regard_label === 'neg').length;

      return {
        model,
        Positive: total > 0 ? (positive / total) * 100 : 0,
        Neutral: total > 0 ? (neutral / total) * 100 : 0,
        Negative: total > 0 ? (negative / total) * 100 : 0,
      };
    });
  };

  const chartConfig = {
    Positive: {
      label: 'Positive',
      color: '#5cb85c',
    },
    Neutral: {
      label: 'Neutral',
      color: '#747474',
    },
    Negative: {
      label: 'Negative',
      color: '#d9534f',
    },
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">
              Regard Distribution
            </CardTitle>
            <CardDescription>
              Sentiment breakdown for identity-related content
            </CardDescription>
          </div>
          <Select
            value={selectedCondition}
            onValueChange={setSelectedCondition}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baseline">Baseline</SelectItem>
              <SelectItem value="social_eng">Social Engineering</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={prepareChartData()}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
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
                dataKey="Positive"
                stackId="a"
                fill={chartConfig['Positive'].color}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Neutral"
                stackId="a"
                fill="var(--color-Neutral)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Negative"
                stackId="a"
                fill={chartConfig.Negative.color}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
