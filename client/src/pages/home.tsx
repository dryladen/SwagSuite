import Layout from "@/components/Layout";
import { EnhancedDashboard } from "@/components/dashboard/EnhancedDashboard";
import { SlackPanel } from "@/components/dashboard/SlackPanel";

export default function Home() {
  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Dashboard - Takes up 3/4 of the width */}
        <div className="lg:col-span-3">
          <EnhancedDashboard />
        </div>
        
        {/* Slack Panel - Takes up 1/4 of the width on the right */}
        <div className="lg:col-span-1">
          <SlackPanel />
        </div>
      </div>
    </Layout>
  );
}
