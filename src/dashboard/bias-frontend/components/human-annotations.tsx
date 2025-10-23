'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Users } from 'lucide-react';

interface HumanAnnotation {
  model: string;
  promptType: string;
  n_items: number;
  n_valid: number;
  n_biased: number;
  bias_rate: number;
}

export function HumanAnnotations() {
  const [data, setData] = useState<HumanAnnotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/human_annotations.json')
      .then((res) => res.json())
      .then((jsonData) => {
        setData(jsonData);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading human annotations:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Human Annotation Results</CardTitle>
          <CardDescription>Loading annotation data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = data.map((item) => ({
    name: `${item.model}\n${item.promptType}`,
    model: item.model,
    promptType: item.promptType,
    biasRate: item.bias_rate,
    biased: item.n_biased,
    unbiased: item.n_valid - item.n_biased,
  }));

  // Calculate summary statistics
  const totalItems = data.reduce((sum, item) => sum + item.n_items, 0);
  const totalBiased = data.reduce((sum, item) => sum + item.n_biased, 0);
  const avgBiasRate = (totalBiased / totalItems) * 100;

  const getModelColor = (model: string) => {
    switch (model) {
      case 'GPT':
        return '#74AA9C';
      case 'Gemini':
        return '#4796E3';
      case 'Grok':
        return '#3b3434';
      default:
        return '#3b3434';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Human Annotation Results
            </CardTitle>
            <CardDescription>
              Manual bias detection by human reviewers across models and prompt
              types
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            {totalItems} Total Reviews
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{totalItems}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Biased Responses</p>
              <p className="text-2xl font-bold">{totalBiased}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
              <CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Bias Rate</p>
              <p className="text-2xl font-bold">{avgBiasRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Bias Rate Chart */}
        <div>
          <h3 className="mb-4 text-sm font-medium">
            Bias Rate by Model and Prompt Type
          </h3>
          <ChartContainer
            config={{
              biasRate: {
                label: 'Bias Rate (%)',
                color: '#74AA9C',
              },
            }}
            // className="h-[800px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis
                  label={{
                    value: 'Bias Rate (%)',
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="biasRate" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getModelColor(entry.model)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Detailed Table */}
        <div>
          <h3 className="mb-4 text-sm font-medium">Detailed Breakdown</h3>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left font-medium">Model</th>
                  <th className="p-3 text-left font-medium">Prompt Type</th>
                  <th className="p-3 text-right font-medium">Total Items</th>
                  <th className="p-3 text-right font-medium">Valid</th>
                  <th className="p-3 text-right font-medium">Biased</th>
                  <th className="p-3 text-right font-medium">Bias Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="p-3">
                      <Badge
                        variant="outline"
                        style={{ borderColor: getModelColor(item.model) }}
                      >
                        {item.model}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-muted-foreground">
                        {item.promptType}
                      </span>
                    </td>
                    <td className="p-3 text-right">{item.n_items}</td>
                    <td className="p-3 text-right">{item.n_valid}</td>
                    <td className="p-3 text-right font-medium">
                      {item.n_biased}
                    </td>
                    <td className="p-3 text-right">
                      <span
                        className={`font-semibold ${
                          item.bias_rate > 30
                            ? 'text-red-600 dark:text-red-400'
                            : item.bias_rate > 15
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-green-600 dark:text-green-400'
                        }`}
                      >
                        {item.bias_rate.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
