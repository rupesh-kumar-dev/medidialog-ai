import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function EmergencyAlert({
  warningSigns = [],
  onReturn,
}: {
  warningSigns?: string[];
  onReturn?: () => void;
}) {
  const [showSigns, setShowSigns] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <section
      role="alert"
      className="rounded-2xl border border-danger/50 bg-danger-soft p-5 text-danger"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
        <div className="space-y-3">
          <h2 className="text-lg font-bold tracking-tight">⚠️ URGENT MEDICAL ATTENTION</h2>
          <p className="text-sm">
            Some symptoms you reported may require immediate professional evaluation. Please contact
            local emergency medical services or visit the nearest emergency department.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="destructive" onClick={() => setShowHelp(true)}>
              Seek Medical Help
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowSigns(true)}>
              View Warning Signs
            </Button>
            {onReturn ? (
              <Button size="sm" variant="ghost" onClick={onReturn}>
                Return to Assessment
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Getting professional help now</DialogTitle>
            <DialogDescription>MediSage AI cannot contact services for you.</DialogDescription>
          </DialogHeader>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Call your local emergency medical services number immediately.</li>
            <li>If safe, ask someone nearby to stay with you and help you travel.</li>
            <li>Go to the nearest emergency department if that is faster.</li>
            <li>Do not drive yourself if you feel faint, breathless or confused.</li>
            <li>Take a list of your symptoms and any medicines you take with you.</li>
          </ul>
        </DialogContent>
      </Dialog>

      <Dialog open={showSigns} onOpenChange={setShowSigns}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Warning signs to take seriously</DialogTitle>
            <DialogDescription>Seek prompt professional evaluation if present.</DialogDescription>
          </DialogHeader>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {(warningSigns.length
              ? warningSigns
              : [
                  "Chest discomfort or pressure, especially with breathlessness or sweating",
                  "Severe difficulty breathing",
                  "Sudden weakness, facial drooping or difficulty speaking",
                  "Fainting, severe confusion or unresponsiveness",
                  "Heavy uncontrolled bleeding",
                  "Severe, sudden or rapidly worsening pain",
                ]
            ).map((sign) => (
              <li key={sign}>{sign}</li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </section>
  );
}
