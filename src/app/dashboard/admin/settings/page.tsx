import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white mb-1">Settings</h2>
        <p className="text-white/40 font-body text-sm">Platform configuration and system preferences</p>
      </div>
      <div className="flex flex-col items-center justify-center py-24 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
        <div className="w-16 h-16 rounded-2xl bg-gold-400/[0.08] border border-gold-400/20 flex items-center justify-center mb-4">
          <Settings className="w-7 h-7 text-gold-400" />
        </div>
        <h3 className="font-display text-2xl text-white mb-2">Coming Soon</h3>
        <p className="text-white/40 font-body text-sm text-center max-w-sm">
          System settings — email templates, notification rules, platform branding, and API configuration.
        </p>
      </div>
    </div>
  );
}
