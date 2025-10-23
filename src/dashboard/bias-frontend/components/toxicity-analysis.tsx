'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useEffect, useState } from 'react';
import { AlertTriangle, Shield, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ToxicityData {
  condition: string;
  model_name: string;
  toxicity: number;
  severe_toxicity: number;
  obscene: number;
  threat: number;
  insult: number;
  identity_attack: number;
  n_rows: number;
}

export function ToxicityAnalysis() {
  const [data, setData] = useState<ToxicityData[]>([]);
  const [selectedCondition, setSelectedCondition] =
    useState<string>('baseline');

  useEffect(() => {
    fetch('/api/toxicity-data')
      .then((res) => res.json())
      .then((jsonData) => setData(jsonData));
  }, []);

  const baselineData = data.filter((d) => d.condition === 'baseline');
  const socialEngData = data.filter((d) => d.condition === 'social_eng');

  const avgBaselineToxicity =
    baselineData.length > 0
      ? (
          (baselineData.reduce((sum, d) => sum + d.toxicity, 0) /
            baselineData.length) *
          100
        ).toFixed(3)
      : '0';

  const avgSocialEngToxicity =
    socialEngData.length > 0
      ? (
          (socialEngData.reduce((sum, d) => sum + d.toxicity, 0) /
            socialEngData.length) *
          100
        ).toFixed(3)
      : '0';

  const highestToxicity =
    data.length > 0
      ? data.reduce((max, d) => (d.toxicity > max.toxicity ? d : max), data[0])
      : null;

  const allMetricsComparisonData = [
    'toxicity',
    'severe_toxicity',
    'obscene',
    'threat',
    'insult',
    'identity_attack',
  ].map((metric) => {
    const entry: any = {
      metric: metric
        .replace(/_/g, ' ')
        .toUpperCase()
        .replace('SEVERE TOXICITY', 'SEVERE')
        .replace('IDENTITY ATTACK', 'IDENTITY'),
    };

    const filteredData = data.filter((d) => d.condition === selectedCondition);

    filteredData.forEach((d) => {
      entry[d.model_name] = Number.parseFloat(
        ((d as any)[metric] * 100).toFixed(3)
      );
    });

    return entry;
  });

  const getMetricComparisonData = (metric: string) => {
    return data
      .map((d) => ({
        name: d.model_name,
        condition: d.condition,
        baseline:
          d.condition === 'baseline'
            ? Number.parseFloat(((d as any)[metric] * 100).toFixed(3))
            : 0,
        social_eng:
          d.condition === 'social_eng'
            ? Number.parseFloat(((d as any)[metric] * 100).toFixed(3))
            : 0,
      }))
      .reduce((acc: any[], curr) => {
        const existing = acc.find((item) => item.name === curr.name);
        if (existing) {
          if (curr.condition === 'baseline') existing.baseline = curr.baseline;
          if (curr.condition === 'social_eng')
            existing.social_eng = curr.social_eng;
        } else {
          acc.push({
            name: curr.name,
            baseline: curr.baseline,
            social_eng: curr.social_eng,
          });
        }
        return acc;
      }, []);
  };

  const modelComparisonData = data.map((d) => ({
    name: `${d.model_name} (${d.condition})`,
    model: d.model_name,
    condition: d.condition,
    toxicity: (d.toxicity * 100).toFixed(3),
    severe_toxicity: (d.severe_toxicity * 100).toFixed(3),
    obscene: (d.obscene * 100).toFixed(3),
    threat: (d.threat * 100).toFixed(3),
    insult: (d.insult * 100).toFixed(3),
    identity_attack: (d.identity_attack * 100).toFixed(3),
  }));

  const radarData = [
    'toxicity',
    'severe_toxicity',
    'obscene',
    'threat',
    'insult',
    'identity_attack',
  ].map((metric) => {
    const entry: any = { metric: metric.replace(/_/g, ' ').toUpperCase() };

    const models = ['GPT', 'Gemini', 'Grok'];
    models.forEach((model) => {
      const modelData = data.filter((d) => d.model_name === model);
      const avg =
        modelData.length > 0
          ? (modelData.reduce((sum, d) => sum + (d as any)[metric], 0) /
              modelData.length) *
            100
          : 0;
      entry[model] = Number.parseFloat(avg.toFixed(3));
    });

    return entry;
  });

  const conditionComparisonData = [
    'toxicity',
    'severe_toxicity',
    'obscene',
    'threat',
    'insult',
    'identity_attack',
  ].map((metric) => {
    const baselineAvg =
      baselineData.length > 0
        ? (baselineData.reduce((sum, d) => sum + (d as any)[metric], 0) /
            baselineData.length) *
          100
        : 0;

    const socialEngAvg =
      socialEngData.length > 0
        ? (socialEngData.reduce((sum, d) => sum + (d as any)[metric], 0) /
            socialEngData.length) *
          100
        : 0;

    return {
      metric: metric.replace(/_/g, ' ').toUpperCase(),
      baseline: Number.parseFloat(baselineAvg.toFixed(3)),
      social_eng: Number.parseFloat(socialEngAvg.toFixed(3)),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Toxicity Analysis</h2>
        <p className="text-muted-foreground mt-2">
          Comprehensive toxicity metrics across models and prompt conditions
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Baseline Avg Toxicity
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgBaselineToxicity}%</div>
            <p className="text-xs text-muted-foreground">
              Average across all models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Social Eng Avg Toxicity
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSocialEngToxicity}%</div>
            <p className="text-xs text-muted-foreground">
              Average with social engineering
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Highest Toxicity
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {highestToxicity
                ? (highestToxicity.toxicity * 100).toFixed(2)
                : '0'}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {highestToxicity
                ? `${highestToxicity.model_name} (${highestToxicity.condition})`
                : 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <CardTitle>All Metrics Comparison: Models × Conditions</CardTitle>
              <CardDescription>
                Complete comparison of all toxicity metrics across GPT, Gemini,
                and Grok
              </CardDescription>
            </div>
            <Select
              value={selectedCondition}
              onValueChange={setSelectedCondition}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baseline">Baseline</SelectItem>
                <SelectItem value="social_eng">Social Engineering</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              GPT: {
                label: 'GPT',
                color: '#74AA9C',
              },
              Gemini: {
                label: 'Gemini',
                color: '#4796E3',
              },
              Grok: {
                label: 'Grok',
                color: '#3b3434',
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={allMetricsComparisonData}
                margin={{ bottom: 60, left: 20, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="metric"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  label={{
                    value: 'Score (%)',
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="GPT" fill="var(--color-GPT)" name="GPT" />
                <Bar
                  dataKey="Gemini"
                  fill="var(--color-Gemini)"
                  name="Gemini"
                />
                <Bar dataKey="Grok" fill="var(--color-Grok)" name="Grok" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* TODO: Individual Metric Analysis */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Individual Metric Analysis</CardTitle>
          <CardDescription>
            Detailed breakdown of each toxicity metric comparing baseline vs
            social engineering across all models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="toxicity" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="toxicity">Toxicity</TabsTrigger>
              <TabsTrigger value="severe_toxicity">Severe</TabsTrigger>
              <TabsTrigger value="obscene">Obscene</TabsTrigger>
              <TabsTrigger value="threat">Threat</TabsTrigger>
              <TabsTrigger value="insult">Insult</TabsTrigger>
              <TabsTrigger value="identity_attack">Identity</TabsTrigger>
            </TabsList>

            {[
              'toxicity',
              'severe_toxicity',
              'obscene',
              'threat',
              'insult',
              'identity_attack',
            ].map((metric) => (
              <TabsContent key={metric} value={metric} className="mt-6">
                <ChartContainer
                  config={{
                    baseline: {
                      label: 'Baseline',
                      color: 'hsl(var(--chart-2))',
                    },
                    social_eng: {
                      label: 'Social Engineering',
                      color: 'hsl(var(--chart-1))',
                    },
                  }}
                  className="h-[350px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getMetricComparisonData(metric)}
                      margin={{ bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis
                        label={{
                          value: `${metric
                            .replace(/_/g, ' ')
                            .toUpperCase()} (%)`,
                          angle: -90,
                          position: 'insideLeft',
                        }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar
                        dataKey="baseline"
                        fill="var(--color-baseline)"
                        name="Baseline"
                      />
                      <Bar
                        dataKey="social_eng"
                        fill="var(--color-social_eng)"
                        name="Social Engineering"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card> */}

      {/* <Card>
        <CardHeader>
          <CardTitle>Toxicity Scores by Model and Condition</CardTitle>
          <CardDescription>
            Overall toxicity percentage for each model under different
            conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              toxicity: {
                label: 'Toxicity',
                color: 'hsl(var(--chart-1))',
              },
            }}
            className="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modelComparisonData} margin={{ bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis
                  label={{
                    value: 'Toxicity (%)',
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="toxicity"
                  fill="var(--color-toxicity)"
                  name="Toxicity %"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card> */}

      <Card>
        <CardHeader>
          <CardTitle>Baseline vs Social Engineering</CardTitle>
          <CardDescription>
            Comparison of toxicity metrics between baseline and social
            engineering conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              baseline: {
                label: 'Baseline',
                color: '#4a6fa5',
              },
              social_eng: {
                label: 'Social Engineering',
                color: '#e27d60',
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conditionComparisonData} margin={{ bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="metric"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis
                  label={{
                    value: 'Score (%)',
                    angle: -90,
                    position: 'insideLeft',
                  }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar
                  dataKey="baseline"
                  fill="var(--color-baseline)"
                  name="Baseline"
                />
                <Bar
                  dataKey="social_eng"
                  fill="var(--color-social_eng)"
                  name="Social Engineering"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Multi-Dimensional Toxicity Profile</CardTitle>
          <CardDescription>
            Radar chart showing all toxicity metrics across models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              GPT: {
                label: 'GPT',
                color: '#74AA9C',
              },
              Gemini: {
                label: 'Gemini',
                color: '#4796E3',
              },
              Grok: {
                label: 'Grok',
                color: '#3b3434',
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 'auto']} />
                <Radar
                  name="GPT"
                  dataKey="GPT"
                  stroke="var(--color-GPT)"
                  fill="var(--color-GPT)"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Gemini"
                  dataKey="Gemini"
                  stroke="var(--color-Gemini)"
                  fill="var(--color-Gemini)"
                  fillOpacity={0.3}
                />
                <Radar
                  name="Grok"
                  dataKey="Grok"
                  stroke="var(--color-Grok)"
                  fill="var(--color-Grok)"
                  fillOpacity={0.3}
                />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Toxicity Metrics</CardTitle>
          <CardDescription>
            Complete breakdown of all toxicity scores (in percentages)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Model</th>
                  <th className="text-left p-2 font-medium">Condition</th>
                  <th className="text-right p-2 font-medium">Toxicity</th>
                  <th className="text-right p-2 font-medium">Severe</th>
                  <th className="text-right p-2 font-medium">Obscene</th>
                  <th className="text-right p-2 font-medium">Threat</th>
                  <th className="text-right p-2 font-medium">Insult</th>
                  <th className="text-right p-2 font-medium">
                    Identity Attack
                  </th>
                  <th className="text-right p-2 font-medium">Samples</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{row.model_name}</td>
                    <td className="p-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          row.condition === 'baseline'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                        }`}
                      >
                        {row.condition}
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      {(row.toxicity * 100).toFixed(3)}%
                    </td>
                    <td className="p-2 text-right">
                      {(row.severe_toxicity * 100).toFixed(3)}%
                    </td>
                    <td className="p-2 text-right">
                      {(row.obscene * 100).toFixed(3)}%
                    </td>
                    <td className="p-2 text-right">
                      {(row.threat * 100).toFixed(3)}%
                    </td>
                    <td className="p-2 text-right">
                      {(row.insult * 100).toFixed(3)}%
                    </td>
                    <td className="p-2 text-right">
                      {(row.identity_attack * 100).toFixed(3)}%
                    </td>
                    <td className="p-2 text-right">{row.n_rows}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
