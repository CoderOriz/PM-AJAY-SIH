import { useState, useEffect } from "react";
import { API, api } from "./api";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";

const EDU = { 0: "No schooling", 5: "Class 5", 8: "Class 8", 10: "Class 10", 12: "Class 12", 15: "Graduate" };

function Bars({ obj, labelFn }) {
  const max = Math.max(1, ...Object.values(obj));
  return (
    <>
      {Object.entries(obj).map(([k, v]) => (
        <div key={k}>
          <div className="text-sm">{labelFn ? labelFn(k) : k} — {v}</div>
          <div className="bar"><i style={{ width: `${100 * v / max}%` }} /></div>
        </div>
      ))}
    </>
  );
}

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [centres, setCentres] = useState([]);
  const [operators, setOperators] = useState([]);
  const [opName, setOpName] = useState("");
  const [pinCode, setPinCode] = useState("");

  async function load() {
    setStats(await api("/admin/stats"));
    setCentres((await api("/admin/centres")).centres);
    setOperators((await api("/admin/operators")).operators);
  }
  useEffect(() => { load(); }, []);

  async function flag(id, status) { // C6 ground-truth loop
    await api(`/admin/centre/${id}/status`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function addOperator() { // H6
    if (!opName.trim()) return;
    await api("/admin/operator", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: opName.trim() }),
    });
    setOpName("");
    load();
  }

  async function certify(id) { // H6: quiz pass marks certified
    await api(`/admin/operator/${id}/certify`, { method: "POST" });
    load();
  }

  async function pin() { // H3: nodal officer pins a locally relevant course
    if (!pinCode.trim()) return;
    await api("/admin/pin", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ district_lgd: "523", qp_code: pinCode.trim() }),
    }).catch(() => {});
    setPinCode("");
    load();
  }

  async function unpin(code) {
    await api(`/admin/pin?district_lgd=523&qp_code=${encodeURIComponent(code)}`, { method: "DELETE" });
    load();
  }

  if (!stats) return <p style={{ textAlign: "center", marginTop: 40 }}>Loading…</p>;

  const enrolled = stats.outcomes?.enrolled || 0;
  const totalOutcomes = Object.values(stats.outcomes || {}).reduce((a, b) => a + b, 0);
  const opCert = stats.operators?.certified || 0;
  const opTotal = stats.operators?.total || 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <h1 className="text-xl font-bold mt-2">PM-AJAY — GIA Dashboard <span className="text-xs font-normal text-muted-foreground">(Pune pilot)</span></h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
        <Card><CardContent className="p-4"><div className="text-3xl font-bold">{stats.total_sessions}<small className="block text-xs text-muted-foreground font-normal mt-1">sessions started</small></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-3xl font-bold">{stats.consented}<small className="block text-xs text-muted-foreground font-normal mt-1">consent given (H7)</small></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-3xl font-bold">{stats.completed}<small className="block text-xs text-muted-foreground font-normal mt-1">profiles completed</small></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-3xl font-bold">{stats.this_week}<small className="block text-xs text-muted-foreground font-normal mt-1">this week</small></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-3xl font-bold">{stats.anomalies}<small className="block text-xs text-muted-foreground font-normal mt-1">anomaly flags (H9)</small></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-3xl font-bold">{stats.contacted}<small className="block text-xs text-muted-foreground font-normal mt-1">centre contact (M3)</small></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-3xl font-bold">{totalOutcomes ? `${Math.round(100 * enrolled / totalOutcomes)}%` : "—"}<small className="block text-xs text-muted-foreground font-normal mt-1">enrolled (H8, {enrolled}/{totalOutcomes})</small></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-3xl font-bold">{opTotal ? `${opCert}/${opTotal}` : "0"}<small className="block text-xs text-muted-foreground font-normal mt-1">operators certified (H6)</small></div></CardContent></Card>
      </div>

      <div className="grid md:grid-cols-2 gap-3 mt-4">
        <Card>
          <CardHeader><CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">District RAG (perspective plan)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>District</TableHead><TableHead>Profiled</TableHead><TableHead>Target</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {stats.rag.map(r => (
                  <TableRow key={r.district}>
                    <TableCell>{r.district}</TableCell><TableCell>{r.profiled}</TableCell><TableCell>{r.target}</TableCell>
                    <TableCell><span className={`dot ${r.status}`} />{r.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Top recommended courses</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Course</TableHead><TableHead>Shown</TableHead></TableRow></TableHeader>
              <TableBody>
                {stats.top_recommended.map(x => (
                  <TableRow key={x.qp_title}><TableCell>{x.qp_title}</TableCell><TableCell>{x.count}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-3 mt-4">
        <Card><CardHeader><CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Education</CardTitle></CardHeader><CardContent><Bars obj={stats.by_education} labelFn={k => EDU[k] || k} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Interest</CardTitle></CardHeader><CardContent><Bars obj={stats.by_interest} /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Language split</CardTitle></CardHeader><CardContent><Bars obj={stats.by_language} labelFn={k => k === "mr" ? "मराठी" : "हिंदी"} /></CardContent></Card>
        <Card>
          <CardHeader><CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Nodal-officer pins (H3)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input type="text" placeholder="QP code e.g. AMH/Q0001" value={pinCode} onChange={e => setPinCode(e.target.value)} />
              <Button size="sm" className="w-auto mt-0" onClick={pin}>Pin</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(stats.pins || []).map(p => (
                <Badge key={p.qp_code} variant="secondary" className="cursor-pointer" onClick={() => unpin(p.qp_code)}>
                  {p.qp_code} (Pune) ✕
                </Badge>
              ))}
              {!(stats.pins || []).length && <span className="text-sm text-muted-foreground">None pinned</span>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-3 mt-4">
        <Card>
          <CardHeader><CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Training centres (C6)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm mb-2">{stats.centres.active} active · {stats.centres.stale} stale (>30 days) · {stats.centres.unresponsive} unresponsive</div>
            <Table>
              <TableHeader><TableRow><TableHead>Centre</TableHead><TableHead>Status</TableHead><TableHead>Verified</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {centres.map(r => {
                  const isStale = (Date.now() - new Date(r.last_verified).getTime()) / 864e5 > 30;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.status}{isStale && <span className="stale text-destructive text-xs"> · stale</span>}</TableCell>
                      <TableCell>{r.last_verified}</TableCell>
                      <TableCell>{r.status === "active"
                        ? <Button variant="outline" size="sm" className="w-auto mt-0" onClick={() => flag(r.id, "unresponsive")}>Mark unresponsive</Button>
                        : <Button variant="outline" size="sm" className="w-auto mt-0" onClick={() => flag(r.id, "active")}>Reactivate</Button>}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">Operators (H6)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input type="text" placeholder="Operator name" value={opName} onChange={e => setOpName(e.target.value)} />
              <Button size="sm" className="w-auto mt-0" onClick={addOperator}>Add</Button>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Certified</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>
                {operators.map(o => (
                  <TableRow key={o.id}>
                    <TableCell>{o.name}</TableCell>
                    <TableCell>{o.certified ? <Badge variant="success">certified</Badge> : <Badge variant="warning">pending quiz</Badge>}</TableCell>
                    <TableCell>{!o.certified && <Button variant="outline" size="sm" className="w-auto mt-0" onClick={() => certify(o.id)}>Certify</Button>}</TableCell>
                  </TableRow>
                ))}
                {!operators.length && <TableRow><TableCell colSpan={3} className="text-muted-foreground">No operators yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <a className="btn inline-block mt-5 px-4 py-2.5 rounded-xl bg-secondary text-white font-semibold no-underline" href={API + "/admin/export.csv"}>Ministry export (CSV)</a>
      <p className="note text-xs text-muted-foreground mt-4">Aggregate-only view — individual records require supervisor-approved audit-log access (C3). Demo: no admin auth (RBAC per B3.1 before pilot).</p>
    </div>
  );
}
