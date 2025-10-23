import { Activity } from "lucide-react"

export function DashboardHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[linear-gradient(to_bottom_right,#4796E3,#74AA9C)]">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Bias and Toxicity Analysis Accross LLMs</h1>
            <p className="text-sm text-muted-foreground">
              Analyzing model behavior across baseline and social engineering conditions
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
