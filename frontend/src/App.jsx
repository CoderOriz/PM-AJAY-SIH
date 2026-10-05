import { useState } from "react";
import Beneficiary from "./Beneficiary";
import Admin from "./Admin";
import { Button } from "./components/ui/button";

export default function App() {
  const [view, setView] = useState(location.hash === "#admin" ? "admin" : "beneficiary");
  const [opMode, setOpMode] = useState(false);
  const [opId, setOpId] = useState("");
  const switchView = () => {
    const v = view === "admin" ? "beneficiary" : "admin";
    location.hash = v === "admin" ? "#admin" : "";
    setView(v);
  };
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <img src="/saksham-sathi-icon.svg" alt="Saksham Sathi icon" className="h-9 w-9 rounded-xl" />
            <div className="leading-tight">
              <div className="text-sm font-bold">Saksham Sathi</div>
              <div className="text-[10px] text-muted-foreground">उपजीविका सहाय्यक · PM-AJAY GIA</div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-0 w-auto rounded-full px-4" onClick={switchView}>
            {view === "admin" ? "← लाभार्थी" : "Admin →"}
          </Button>
        </div>
      </header>
      {view === "admin" ? <Admin /> : <Beneficiary opMode={opMode} opId={opId} setOpMode={setOpMode} setOpId={setOpId} />}
    </div>
  );
}
