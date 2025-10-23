import { BiasOverview } from '@/components/bias-overview';
import { ModelComparison } from '@/components/model-comparison';
import { BiasBreakdown } from '@/components/bias-breakdown';
import { RefusalAnalysis } from '@/components/refusal-analysis';
import { IdentityExplorer } from '@/components/identity-explorer';
import { DashboardHeader } from '@/components/dashboard-header';
import { HumanAnnotations } from '@/components/human-annotations';
import { ToxicityAnalysis } from '@/components/toxicity-analysis';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3/4">
        <DashboardHeader />
      </div>
      <section className="container mx-auto  max-w-3/4 px-4 py-8 space-y-8">
        <BiasOverview />
        <ModelComparison />
        <div className="grid gap-8 lg:grid-cols-2">
          <BiasBreakdown />
          <RefusalAnalysis />
        </div>
      </section>
      <div className="bg-[#f1f1f1]">
        <section className="container mx-auto  max-w-3/4 px-4 py-16 space-y-8 ">
          <ToxicityAnalysis />
        </section>
      </div>
      <section className="container mx-auto  max-w-3/4 px-4 py-8 space-y-8">
        <HumanAnnotations />
      </section>

      <section className="container mx-auto  max-w-3/4 px-4 py-8 space-y-8">
        <IdentityExplorer />
      </section>
    </div>
  );
}
