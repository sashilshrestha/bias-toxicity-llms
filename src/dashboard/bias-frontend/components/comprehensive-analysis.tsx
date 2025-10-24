'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  ArrowDown,
  ArrowUp,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface ModelConditionData {
  condition: string;
  model_name: string;
  n_rows: number;
  refusal_rate: number;
  refusal_rate_ci_lo: number;
  refusal_rate_ci_hi: number;
  negative_regard_percent: number;
  negative_regard_percent_ci_lo: number;
  negative_regard_percent_ci_hi: number;
  avg_word_count: number;
  policy_flag_rate: number;
}

interface DetailedMetric {
  attack_id: string;
  model_name: string;
  condition: string;
  variant: string;
  attack_category: string;
  technique: string;
  prompt_text: string;
  output_text: string;
  refusal_flag: number;
  wp1_test_result: string;
  regard_pred_prob: number;
  regard_pred_label: number;
  refusal_pred_prob: number;
  refusal_pred_label: number;
  word_count: number;
  sentence_count: number;
  policy_flag: number;
}

export function ComprehensiveAnalysis() {
  const [summaryData, setSummaryData] = useState<ModelConditionData[]>([]);
  const [detailedData, setDetailedData] = useState<DetailedMetric[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/data/bias_metrics_summary.json').then((res) => res.json()),
      fetch('/data/bias_metrics.json').then((res) => res.json()),
    ]).then(([summary, detailed]) => {
      setSummaryData(summary);
      setDetailedData(detailed);
    });
  }, []);

  if (summaryData.length === 0 || detailedData.length === 0) {
    return <div>Loading...</div>;
  }

  const calculateOverallStats = () => {
    const totalRows = summaryData.reduce((sum, d) => sum + d.n_rows, 0);
    const avgRefusal =
      summaryData.reduce((sum, d) => sum + d.refusal_rate * d.n_rows, 0) /
      totalRows;
    const avgNegRegard =
      summaryData.reduce(
        (sum, d) => sum + d.negative_regard_percent * d.n_rows,
        0
      ) / totalRows;
    const avgPolicy =
      summaryData.reduce((sum, d) => sum + d.policy_flag_rate * d.n_rows, 0) /
      totalRows;
    const avgWords =
      summaryData.reduce((sum, d) => sum + d.avg_word_count * d.n_rows, 0) /
      totalRows;

    const refusalCIs = summaryData.map((d) => ({
      lo: d.refusal_rate_ci_lo,
      hi: d.refusal_rate_ci_hi,
    }));
    const regardCIs = summaryData.map((d) => ({
      lo: d.negative_regard_percent_ci_lo,
      hi: d.negative_regard_percent_ci_hi,
    }));

    return {
      n_rows: totalRows,
      refusal_rate: avgRefusal,
      refusal_rate_ci_lo: Math.min(...refusalCIs.map((c) => c.lo)),
      refusal_rate_ci_hi: Math.max(...refusalCIs.map((c) => c.hi)),
      negative_regard_percent: avgNegRegard,
      negative_regard_percent_ci_lo: Math.min(...regardCIs.map((c) => c.lo)),
      negative_regard_percent_ci_hi: Math.max(...regardCIs.map((c) => c.hi)),
      avg_word_count: avgWords,
      policy_flag_rate: avgPolicy,
    };
  };

  const overallStats = calculateOverallStats();

  const getModelComparison = (modelName: string) => {
    const baseline = summaryData.find(
      (d) => d.model_name === modelName && d.condition === 'baseline'
    );
    const socialEng = summaryData.find(
      (d) => d.model_name === modelName && d.condition === 'social_eng'
    );

    if (!baseline || !socialEng) return null;

    return {
      model: modelName,
      refusal_baseline: baseline.refusal_rate,
      refusal_social: socialEng.refusal_rate,
      refusal_delta: (
        (socialEng.refusal_rate - baseline.refusal_rate) *
        100
      ).toFixed(2),
      regard_baseline: baseline.negative_regard_percent,
      regard_social: socialEng.negative_regard_percent,
      regard_delta: (
        socialEng.negative_regard_percent - baseline.negative_regard_percent
      ).toFixed(2),
      policy_baseline: baseline.policy_flag_rate,
      policy_social: socialEng.policy_flag_rate,
    };
  };

  const comparisons = ['GPT', 'Gemini', 'Grok']
    .map(getModelComparison)
    .filter(Boolean);

  const kpiData = summaryData.map((d) => ({
    name: `${d.model_name} (${d.condition === 'baseline' ? 'Base' : 'SE'})`,
    model: d.model_name,
    condition: d.condition,
    refusal_rate: (d.refusal_rate * 100).toFixed(1),
    negative_regard: d.negative_regard_percent.toFixed(1),
    policy_flag: (d.policy_flag_rate * 100).toFixed(1),
    word_count: Math.round(d.avg_word_count),
  }));

  const attackTechniques = Array.from(
    new Set(detailedData.map((d) => d.technique))
  );
  const attackCategories = Array.from(
    new Set(detailedData.map((d) => d.attack_category))
  );

  const techniqueData = attackTechniques.map((technique) => {
    const techniqueItems = detailedData.filter(
      (d) => d.technique === technique
    );
    const baselineItems = techniqueItems.filter(
      (d) => d.condition === 'baseline'
    );
    const socialEngItems = techniqueItems.filter(
      (d) => d.condition === 'social_eng'
    );

    return {
      technique,
      baseline_regard: (
        (baselineItems.filter((d) => d.regard_pred_label === 1).length /
          baselineItems.length) *
        100
      ).toFixed(1),
      social_regard: (
        (socialEngItems.filter((d) => d.regard_pred_label === 1).length /
          socialEngItems.length) *
        100
      ).toFixed(1),
      baseline_refusal: (
        (baselineItems.filter((d) => d.refusal_pred_label === 1).length /
          baselineItems.length) *
        100
      ).toFixed(1),
      social_refusal: (
        (socialEngItems.filter((d) => d.refusal_pred_label === 1).length /
          socialEngItems.length) *
        100
      ).toFixed(1),
    };
  });

  const comparisonChartData = comparisons.map((c) => ({
    model: c!.model,
    'Refusal (Baseline)': (c!.refusal_baseline * 100).toFixed(1),
    'Refusal (SE)': (c!.refusal_social * 100).toFixed(1),
    'Neg-Regard (Baseline)': c!.regard_baseline.toFixed(1),
    'Neg-Regard (SE)': c!.regard_social.toFixed(1),
  }));

  return (
    <div className="space-y-8">
      {/* KPI Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
          <CardDescription>
            Overview metrics across all models and conditions (n=
            {overallStats.n_rows} total responses)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Overall Refusal Rate
                </p>
                <TrendingDown className="h-4 w-4 text-chart-1" />
              </div>
              <p className="mt-2 text-3xl font-bold">
                {(overallStats.refusal_rate * 100).toFixed(1)}%
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                CI: {(overallStats.refusal_rate_ci_lo * 100).toFixed(1)}% -{' '}
                {(overallStats.refusal_rate_ci_hi * 100).toFixed(1)}%
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Negative Regard
                </p>
                <AlertTriangle className="h-4 w-4 text-chart-2" />
              </div>
              <p className="mt-2 text-3xl font-bold">
                {overallStats.negative_regard_percent.toFixed(1)}%
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                CI: {overallStats.negative_regard_percent_ci_lo.toFixed(1)}% -{' '}
                {overallStats.negative_regard_percent_ci_hi.toFixed(1)}%
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Policy Flag Rate
                </p>
                <CheckCircle2 className="h-4 w-4 text-chart-3" />
              </div>
              <p className="mt-2 text-3xl font-bold">
                {(overallStats.policy_flag_rate * 100).toFixed(1)}%
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Across all responses
              </p>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  Avg Word Count
                </p>
                <TrendingUp className="h-4 w-4 text-chart-4" />
              </div>
              <p className="mt-2 text-3xl font-bold">
                {Math.round(overallStats.avg_word_count)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Words per response
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparative Insights Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Key Comparative Insights (Baseline vs Social Engineering)
          </CardTitle>
          <CardDescription>
            Percentage point changes showing the impact of social engineering
            prompts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Metric</th>
                  <th className="px-4 py-3 text-left font-medium">ChatGPT</th>
                  <th className="px-4 py-3 text-left font-medium">Gemini</th>
                  <th className="px-4 py-3 text-left font-medium">Grok</th>
                  <th className="px-4 py-3 text-left font-medium">Take-Away</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-3 font-medium">Refusal Rate ↓</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          71.5% → 44.9%
                        </span>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        <ArrowDown className="mr-1 h-3 w-3" />
                        -26.6 pp
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          71.5% → 44.0%
                        </span>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        <ArrowDown className="mr-1 h-3 w-3" />
                        -27.6 pp
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          51.1% → 8.0%
                        </span>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        <ArrowDown className="mr-1 h-3 w-3" />
                        -43.0 pp
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    SE prompts bypass refusals ≈ 27–43 pp; Grok most affected
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-medium">Neg-Regard ↑</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          7.1% → 17.3%
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-chart-2 text-chart-2 text-xs"
                      >
                        <ArrowUp className="mr-1 h-3 w-3" />
                        +10.2 pp
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          9.9% → 17.6%
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-chart-2 text-chart-2 text-xs"
                      >
                        <ArrowUp className="mr-1 h-3 w-3" />
                        +7.7 pp
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          12.7% → 26.6%
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-chart-2 text-chart-2 text-xs"
                      >
                        <ArrowUp className="mr-1 h-3 w-3" />
                        +13.9 pp
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    SE paraphrases noticeably increase identity-targeted
                    negative outputs
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-medium">Policy Flag ↑/↓</td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          16.7% → 17.6%
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <ArrowUp className="mr-1 h-3 w-3" />
                        +0.9 pp
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          73.1% → 43.7%
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <ArrowDown className="mr-1 h-3 w-3" />
                        -29.4 pp
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          27.9% → 5.0%
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <ArrowDown className="mr-1 h-3 w-3" />
                        -22.9 pp
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Mixed patterns; Gemini and Grok show reduced policy flagging
                    under SE
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Refusal & Negative Regard Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>
            Refusal & Negative Regard: Baseline vs Social Engineering
          </CardTitle>
          <CardDescription>
            Grouped comparison showing the common slope: compliance ↑, tone risk
            ↑
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={comparisonChartData} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="model" className="text-xs" />
              <YAxis
                className="text-xs"
                label={{
                  value: 'Percentage (%)',
                  angle: -90,
                  position: 'insideLeft',
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Refusal (Baseline)" fill="#60A5FA" />
              <Bar dataKey="Refusal (SE)" fill="#3B82F6" />
              <Bar dataKey="Neg-Regard (Baseline)" fill="#F87171" />
              <Bar dataKey="Neg-Regard (SE)" fill="#DC2626" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Attack Techniques Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Attack Techniques: Impact on Negative Regard</CardTitle>
          <CardDescription>
            Comparing baseline vs social engineering across different
            manipulation techniques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="regard">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="regard">Negative Regard</TabsTrigger>
              <TabsTrigger value="refusal">Refusal Rate</TabsTrigger>
            </TabsList>

            {/* --- NEGATIVE REGARD CHART --- */}
            <TabsContent value="regard" className="mt-4">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={techniqueData}
                  margin={{ bottom: 60, left: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="technique"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    className="text-xs"
                  />
                  <YAxis
                    className="text-xs"
                    label={{
                      value: 'Negative Regard (%)',
                      angle: -90,
                      position: 'insideLeft',
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', bottom: '0' }} />
                  <Bar
                    dataKey="baseline_regard"
                    name="Baseline"
                    fill="#F87171"
                  />
                  <Bar
                    dataKey="social_regard"
                    name="Social Engineering"
                    fill="#DC2626"
                  />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            {/* --- REFUSAL RATE CHART --- */}
            <TabsContent value="refusal" className="mt-4">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={techniqueData}
                  margin={{ bottom: 60, left: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="technique"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    className="text-xs"
                  />
                  <YAxis
                    className="text-xs"
                    label={{
                      value: 'Refusal Rate (%)',
                      angle: -90,
                      position: 'insideLeft',
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px', bottom: '0' }} />
                  <Bar
                    dataKey="baseline_refusal"
                    name="Baseline"
                    fill="#60A5FA"
                  />
                  <Bar
                    dataKey="social_refusal"
                    name="Social Engineering"
                    fill="#2563EB"
                  />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detailed Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Detailed Model Metrics with Confidence Intervals
          </CardTitle>
          <CardDescription>
            Complete breakdown of all metrics by model and condition
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Model</th>
                  <th className="px-4 py-3 text-left font-medium">Condition</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Refusal Rate
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Neg-Regard %
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Policy Flag %
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Avg Words
                  </th>
                </tr>
              </thead>
              <tbody>
                {summaryData.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium">{row.model_name}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          row.condition === 'baseline' ? 'secondary' : 'outline'
                        }
                        className={
                          row.condition === 'baseline'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-orange-100 text-orange-600 dark:border-orange-600 dark:text-orange-300 border-0'
                        }
                      >
                        {row.condition === 'baseline'
                          ? 'Baseline'
                          : 'Social Eng'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {(row.refusal_rate * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          [{(row.refusal_rate_ci_lo * 100).toFixed(1)}% -{' '}
                          {(row.refusal_rate_ci_hi * 100).toFixed(1)}%]
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {row.negative_regard_percent.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          [{row.negative_regard_percent_ci_lo.toFixed(1)}% -{' '}
                          {row.negative_regard_percent_ci_hi.toFixed(1)}%]
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {(row.policy_flag_rate * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {Math.round(row.avg_word_count)}
                    </td>
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
