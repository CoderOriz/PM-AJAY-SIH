import { useState } from "react";
import Beneficiary from "./Beneficiary";
import Admin from "./Admin";
import { Button } from "./components/ui/button";

export default function App() {
  const [view, setView] = useState(location.hash === "#admin" ? "admin" : "beneficiary");
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-base font-bold text-primary-foreground">प</div>
            <div className="leading-tight">
              <div className="text-sm font-bold">PM-AJAY</div>
              <div className="text-[10px] text-muted-foreground">उपजीविका सहाय्यक · GIA</div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-0 w-auto rounded-full px-4" onClick={switchView}>
            {view === "admin" ? "← लाभार्थी" : "Admin →"}
          </Button>
        </div>
      </header>
      {view === "admin" ? <Admin /> : <Beneficiary />}
    </div>
  );
}
