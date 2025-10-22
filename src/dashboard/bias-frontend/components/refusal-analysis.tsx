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
import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface BiasMetric {
  model_name: string;
  condition: string;
  refusal_flag: number;
  refusal_type: string;
}

export function RefusalAnalysis() {
  const [rawData, setRawData] = useState<BiasMetric[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('GPT');

  useEffect(() => {
    fetch('/api/bias-data')
      .then((res) => res.json())
      .then((data) => setRawData(data));
  }, []);

  const prepareChartData = () => {
    const modelData = rawData.filter(
      (d) => d.model_name === selectedModel && d.refusal_flag === 1
    );

    const policyRefusals = modelData.filter(
      (d) => d.refusal_type === 'policy_refusal'
    ).length;
    const otherRefusals = modelData.filter(
      (d) => d.refusal_type === 'other_refusal'
    ).length;
    const noResponse = modelData.filter(
      (d) => !d.refusal_type || d.refusal_type === ''
    ).length;

    return [
      {
        name: 'Policy Refusal',
        value: policyRefusals,
        color: '#6b8cbc',
      },
      {
        name: 'Other Refusal',
        value: otherRefusals,
        color: '#3a5885',
      },
      { name: 'No Response', value: noResponse, color: 'hsl(var(--chart-5))' },
    ].filter((item) => item.value > 0);
  };

  const chartConfig = {
    'Policy Refusal': {
      label: 'Policy Refusal',
      color: 'hsl(var(--chart-1))',
    },
    'Other Refusal': {
      label: 'Other Refusal',
      color: 'hsl(var(--chart-4))',
    },
    'No Response': {
      label: 'No Response',
      color: 'hsl(var(--chart-5))',
    },
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Refusal Analysis</CardTitle>
            <CardDescription>
              Breakdown of refusal types by model
            </CardDescription>
          </div>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GPT">GPT</SelectItem>
              <SelectItem value="Gemini">Gemini</SelectItem>
              <SelectItem value="Grok">Grok</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={prepareChartData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {prepareChartData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
