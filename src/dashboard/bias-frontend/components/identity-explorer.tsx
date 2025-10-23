"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface BiasMetric {
  attack_id: string
  model_name: string
  condition: string
  has_identity: number
  identity_terms: string[]
  regard_label: string
  negative_regard_flag: number
  refusal_flag: number
}

export function IdentityExplorer() {
  const [rawData, setRawData] = useState<BiasMetric[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedModel, setSelectedModel] = useState<string>("all")
  const [selectedCondition, setSelectedCondition] = useState<string>("all")

  useEffect(() => {
    fetch("/api/bias-data")
      .then((res) => res.json())
      .then((data) => setRawData(data))
  }, [])

  const filteredData = rawData
    .filter((d) => d.has_identity === 1)
    .filter((d) => {
      if (selectedModel !== "all" && d.model_name !== selectedModel) return false
      if (selectedCondition !== "all" && d.condition !== selectedCondition) return false
      if (searchTerm) {
        return d.identity_terms.some((term) => term.toLowerCase().includes(searchTerm.toLowerCase()))
      }
      return true
    })
    // .slice(0, 50)

  return (
    <section>
      <Card className="border-border bg-[#f1f1f1] border-b-gray-800">
        <CardHeader>
          <CardTitle className="text-foreground">Identity Term Explorer</CardTitle>
          <CardDescription>Search and filter identity-related responses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search identity terms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Models" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                <SelectItem value="GPT">GPT</SelectItem>
                <SelectItem value="Gemini">Gemini</SelectItem>
                <SelectItem value="Grok">Grok</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCondition} onValueChange={setSelectedCondition}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Conditions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                <SelectItem value="baseline">Baseline</SelectItem>
                <SelectItem value="social_eng">Social Engineering</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-muted">
                  <tr className="border-b border-border text-left text-sm">
                    <th className="px-4 py-3 font-medium text-foreground">Attack ID</th>
                    <th className="px-4 py-3 font-medium text-foreground">Model</th>
                    <th className="px-4 py-3 font-medium text-foreground">Condition</th>
                    <th className="px-4 py-3 font-medium text-foreground">Identity Terms</th>
                    <th className="px-4 py-3 font-medium text-foreground">Regard</th>
                    <th className="px-4 py-3 font-medium text-foreground">Refused</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row) => (
                    <tr key={row.attack_id} className="border-b border-border text-sm hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.attack_id}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{row.model_name}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={row.condition === "baseline" ? "secondary" : "default"}>
                          {row.condition === "baseline" ? "Baseline" : "Social Eng"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {row.identity_terms.slice(0, 3).map((term, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {term}
                            </Badge>
                          ))}
                          {row.identity_terms.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{row.identity_terms.length - 3}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            row.regard_label === "pos"
                              ? "default"
                              : row.regard_label === "neg"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {row.regard_label === "pos"
                            ? "Positive"
                            : row.regard_label === "neg"
                              ? "Negative"
                              : "Neutral"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={row.refusal_flag === 1 ? "destructive" : "secondary"}>
                          {row.refusal_flag === 1 ? "Yes" : "No"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Showing {filteredData.length} of {rawData.filter((d) => d.has_identity === 1).length} identity-related
            responses
          </p>
        </CardContent>
      </Card>
    </section>
  )
}
