import { useMemo } from "react";
import { useStore } from "../lib/store";
import {
  activityItems,
  assigneeItems,
  computeKpis,
  costByAssembly,
  costByMaterial,
  dueLoadItems,
  materialMixItems,
  memberWorkload,
  mfgItems,
  milestoneItems,
  priorityItems,
  statusItems,
  tagItems,
  vendorItems,
  weightByAssembly,
} from "../lib/derive";
import { fmtMoney, fmtNum } from "../lib/format";
import { Columns, Donut, HBars, Legend } from "../components/charts";
import { Card, CardHeader } from "../components/ui";
import { IconChart, IconClock, IconLayers, IconScale, IconShield, IconUsers, IconZap } from "../components/icons";

export function AnalyticsPage() {
  const { state } = useStore();
  const k = computeKpis(state);
  const status = statusItems(state);
  const priority = priorityItems(state);
  const assignees = assigneeItems(state);
  const costAsm = costByAssembly(state);
  const costMat = costByMaterial(state);
  const weightAsm = weightByAssembly(state);
  const vendors = vendorItems(state);
  const mfg = mfgItems(state);
  const milestones = milestoneItems(state);
  const activity = activityItems(state);
  const due = dueLoadItems(state);
  const tags = tagItems(state);
  const mix = materialMixItems(state);
  const workload = memberWorkload(state);

  const subsys = useMemo(() => {
    const order = ["Chassis", "Suspension", "Powertrain", "High Voltage", "Low Voltage", "Systems", "General"];
    const css = (n: string, fb: string) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || fb;
    const palette = [
      css("--accent", "#2e7bff"),
      css("--ok", "#00d96a"),
      css("--warn", "#ffb300"),
      css("--danger", "#ff5a70"),
      css("--accent-2", "#6fa8ff"),
      "#8a9099",
      "#126287",
    ];
    const map = new Map<string, { open: number; done: number }>();
    for (const m of state.members) {
      const key = m.subsystem || "General";
      if (!map.has(key)) map.set(key, { open: 0, done: 0 });
    }
    for (const t of state.tasks) {
      const owner = state.members.find((m) => m.id === t.assigneeId);
      const key = owner?.subsystem || "General";
      const e = map.get(key) ?? { open: 0, done: 0 };
      if (t.status === "done") e.done += 1;
      else e.open += 1;
      map.set(key, e);
    }
    return order
      .filter((o) => map.has(o))
      .map((o, i) => ({ label: o, value: map.get(o)!.open, color: palette[i % palette.length] }));
  }, [state.members, state.tasks]);

  return (
    <>
      <div className="kpi-grid">
        <Stat label="Task throughput" value={k.progress + "%"} sub={k.doneTasks + " of " + k.totalTasks + " tasks closed"} />
        <Stat label="Schedule risk" value={String(k.overdue)} sub={k.dueSoon + " due within 7 days"} tone={k.overdue > 0 ? "danger" : "ok"} />
        <Stat label="Mass budget headroom" value={"+" + (k.budgetTotal - k.actualTotal).toFixed(1) + " kg"} sub={"measured " + k.actualTotal.toFixed(1) + " kg vs budget " + k.budgetTotal + " kg"} tone="ok" />
        <Stat label="Cost exposure" value={"฿" + fmtNum(k.totalCost)} sub={k.partCount + " purchased parts"} />
      </div>

      <div className="split-even">
        <Card>
          <CardHeader title="Task status" subtitle="All tasks by workflow state" icon={<IconChart size={18} />} />
          <div className="flex items-center gap-16 wrap">
            <Donut items={status} size={180} thickness={26} centerValue={String(k.totalTasks)} centerLabel="TASKS" />
            <div className="grow">
              <Legend items={status.map((s) => ({ label: s.label, value: String(s.value), color: s.color }))} />
            </div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Open work by priority" subtitle="Unclosed tasks only" icon={<IconZap size={18} />} />
          <Columns items={priority} height={220} />
          <div className="mt-16">
            <div className="dim" style={{ fontSize: 12, marginBottom: 8 }}>Due load</div>
            <Columns items={due} height={160} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Open work by subsystem"
          subtitle="Where the outstanding tasks sit across the whole programme"
          icon={<IconUsers size={18} />}
        />
        <Columns items={subsys} height={220} />
        <div className="mt-16">
          <div className="dim" style={{ fontSize: 12, marginBottom: 8 }}>Share of open work</div>
          <Donut items={subsys} size={168} thickness={24} centerValue={String(k.openTasks)} centerLabel="OPEN" />
        </div>
      </Card>

      <div className="split-main">
        <Card>
          <CardHeader title="Cost by assembly" subtitle="Purchased cost per subsystem" icon={<IconLayers size={18} />} />
          <Columns items={costAsm} unit="" height={240} />
          <div className="mt-16">
            <div className="dim" style={{ fontSize: 12, marginBottom: 8 }}>Mass by assembly</div>
            <HBars items={weightAsm} unit=" kg" />
          </div>
        </Card>
        <Card>
          <CardHeader title="Cost by material" subtitle="Where the money goes" icon={<IconScale size={18} />} />
          <div className="flex items-center gap-16 wrap">
            <Donut items={costMat} size={168} thickness={24} centerValue={"฿" + fmtNum(k.totalCost)} centerLabel="TOTAL" />
            <div className="grow">
              <Legend items={costMat.map((c) => ({ label: c.label, value: "฿" + fmtNum(c.value), color: c.color }))} />
            </div>
          </div>
          <div className="mt-16">
            <div className="dim" style={{ fontSize: 12, marginBottom: 8 }}>Material mix by mass</div>
            <Legend items={mix.map((m) => ({ label: m.label, value: m.value + " kg", color: m.color }))} />
          </div>
        </Card>
      </div>

      <div className="split-even">
        <Card>
          <CardHeader title="Supply chain" subtitle="Vendor and manufacturing state" icon={<IconShield size={18} />} />
          <div className="flex items-center gap-16 wrap">
            <Donut items={vendors} size={168} thickness={24} centerValue={String(k.partCount)} centerLabel="PARTS" />
            <div className="grow">
              <Legend items={vendors.map((v) => ({ label: v.label, value: String(v.value), color: v.color }))} />
            </div>
          </div>
          <div className="mt-16">
            <Columns items={mfg} height={160} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Schedule" subtitle="Milestone and delivery state" icon={<IconClock size={18} />} />
          <div className="flex items-center gap-16 wrap">
            <Donut items={milestones} size={168} thickness={24} centerValue={k.milestoneDone + "/" + k.milestoneTotal} centerLabel="DONE" />
            <div className="grow">
              <Legend items={milestones.map((m) => ({ label: m.label, value: String(m.value), color: m.color }))} />
            </div>
          </div>
          <div className="mt-16">
            <div className="dim" style={{ fontSize: 12, marginBottom: 8 }}>Tag load</div>
            <HBars items={tags} />
          </div>
        </Card>
      </div>

      <div className="split-even">
        <Card>
          <CardHeader title="Team workload" subtitle="Open tasks per member" icon={<IconUsers size={18} />} />
          <HBars items={workload.map((w) => ({ label: w.member.name, value: w.open }))} />
        </Card>
        <Card>
          <CardHeader title="Activity mix" subtitle="Local event log by type" icon={<IconZap size={18} />} />
          <HBars items={activity} />
          <div className="mt-16">
            <div className="dim" style={{ fontSize: 12, marginBottom: 8 }}>Milestone completion</div>
            <div className="flex items-center gap-16">
              <div className="grow">
                <div className="progress" style={{ height: 16 }} role="progressbar" aria-valuenow={k.milestoneDone} aria-valuemin={0} aria-valuemax={k.milestoneTotal}>
                  <div
                    className="progress-fill progress-ok"
                    style={{ width: (k.milestoneTotal ? (k.milestoneDone / k.milestoneTotal) * 100 : 0) + "%", height: 16 }}
                  />
                </div>
              </div>
              <span className="mono" style={{ fontSize: 14 }}>
                {k.milestoneDone}/{k.milestoneTotal}
              </span>
            </div>
            <div className="dim" style={{ fontSize: 12, marginTop: 8 }}>
              {k.delayed} delayed · {k.atRisk} at risk · {fmtMoney(k.totalCost)} committed
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

function Stat({ label, value, sub, tone = "accent" }: { label: string; value: string; sub: string; tone?: "accent" | "ok" | "warn" | "danger" }) {
  return (
    <Card className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color: tone === "accent" ? "var(--text)" : "var(--" + tone + ")" }}>
        {value}
      </div>
      <div className="kpi-foot">
        <span className="dim">{sub}</span>
      </div>
    </Card>
  );
}
