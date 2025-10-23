"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar } from "./ui/avatar"

interface SummaryMetric {
  condition: string
  model_name: string
  identity_mention_rate: number
  negative_regard_percent: number
  refusal_rate: number
}

export function BiasOverview() {
  const [summaryData, setSummaryData] = useState<SummaryMetric[]>([])

  useEffect(() => {
    fetch("/api/bias-data-summary")
      .then((res) => res.json())
      .then((data) => setSummaryData(data))
  }, [])

  const getModelData = (modelName: string) => {
    const baseline = summaryData.find((d) => d.model_name === modelName && d.condition === "baseline")
    const socialEng = summaryData.find((d) => d.model_name === modelName && d.condition === "social_eng")
    return { baseline, socialEng }
  }

  const getModelImg = (modelName: string) => {
    if (modelName === "GPT") return "https://img.freepik.com/premium-vector/chatgpt-ai-logo-icon_11410-496.jpg";
    if (modelName === "Gemini") return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQW26_bYY4S2PRKRtkug3XVKDIHhpwXhp_oYQ&s";
    if (modelName === "Grok") return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnuyhgsRh7ORw2Lh_SAh0XXkI6R9YvvaDCxg&s";
  }

  const calculateChange = (baseline?: number, socialEng?: number) => {
    if (!baseline || !socialEng) return 0
    return ((socialEng - baseline) / baseline) * 100
  }

  const models = ["GPT", "Gemini", "Grok"]

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Model Overview</h2>
        <p className="text-sm text-muted-foreground">
          Key performance indicators across baseline and social engineering conditions
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {models.map((model) => {
          const { baseline, socialEng } = getModelData(model)
          const identityChange = calculateChange(baseline?.identity_mention_rate, socialEng?.identity_mention_rate)
          const regardChange = calculateChange(baseline?.negative_regard_percent, socialEng?.negative_regard_percent)
          const refusalChange = calculateChange(baseline?.refusal_rate, socialEng?.refusal_rate)

          return (
            <Card key={model}
              className={cn(
                "bg-card border-8 border-r-0 border-l-0 border-b-0",
                model === "GPT" && "border-[#74AA9C]",
                model === "Gemini" && "border-[#4796E3]",
                model === "Grok" && "border-[#3b3434]",
            )}>
              <div className="flex px-5 gap-3">
                <img src={getModelImg(model)} alt="" className="w-10 h-10"/>
                <CardHeader className="flex-auto p-0">
                  <CardTitle className="text-foreground">{model}</CardTitle>
                  <CardDescription>Performance metrics comparison</CardDescription>
                </CardHeader>
              </div>
              <CardContent className="space-y-4">
                <MetricRow
                  label="Identity Mention Rate"
                  baseline={baseline?.identity_mention_rate}
                  socialEng={socialEng?.identity_mention_rate}
                  change={identityChange}
                />
                <MetricRow
                  label="Negative Regard"
                  baseline={baseline?.negative_regard_percent}
                  socialEng={socialEng?.negative_regard_percent}
                  change={regardChange}
                  isPercent
                />
                <MetricRow
                  label="Refusal Rate"
                  baseline={baseline?.refusal_rate}
                  socialEng={socialEng?.refusal_rate}
                  change={refusalChange}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

function MetricRow({
  label,
  baseline,
  socialEng,
  change,
  isPercent = false,
}: {
  label: string
  baseline?: number
  socialEng?: number
  change: number
  isPercent?: boolean
}) {
  const formatValue = (val?: number) => {
    if (!val) return "—"
    if (isPercent) return `${val.toFixed(1)}%`
    return `${(val * 100).toFixed(1)}%`
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          {change !== 0 && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                change > 0 ? "text-destructive" : "text-chart-2",
              )}
            >
              {change > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {Math.abs(change).toFixed(0)}%
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-md bg-secondary px-3 py-2">
          <div className="text-xs text-muted-foreground">Baseline</div>
          <div className="font-mono font-semibold text-foreground">{formatValue(baseline)}</div>
        </div>
        <div className="rounded-md bg-accent/10 px-3 py-2">
          <div className="text-xs text-muted-foreground">Social Eng</div>
          <div className="font-mono font-semibold text-foreground">{formatValue(socialEng)}</div>
        </div>
      </div>
    </div>
  )
}
