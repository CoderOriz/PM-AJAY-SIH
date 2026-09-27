import { useState } from "react";
import Beneficiary from "./Beneficiary";
import Admin from "./Admin";

export default function App() {
  const [view, setView] = useState(location.hash === "#admin" ? "admin" : "beneficiary");
  const switchView = () => {
    const v = view === "admin" ? "beneficiary" : "admin";
    location.hash = v === "admin" ? "#admin" : "";
    setView(v);
  };
  return (
    <>
      <button className="switch" onClick={switchView}>
        {view === "admin" ? "← गुणारोप / लाभार्थी" : "Admin →"}
      </button>
      {view === "admin" ? <Admin /> : <Beneficiary />}
    </>
  );
}
