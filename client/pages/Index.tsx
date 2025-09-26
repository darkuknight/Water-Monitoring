import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Thermometer, Waves, FlaskConical } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

type SensorData = {
  timestamp: number;
  data: { ph: number; turbidity: number; temperature: number };
};

function useSensorsPoll(intervalMs = 3000) {
  const [history, setHistory] = useState<SensorData[]>([]);
  const latest = history[history.length - 1];

  useEffect(() => {
    let mounted = true;
    const fetchOnce = async () => {
      const res = await fetch("/api/sensors");
      const json = (await res.json()) as SensorData;
      if (!mounted) return;
      setHistory((h) => [...h.slice(-30), json]);
    };
    fetchOnce();
    const id = setInterval(fetchOnce, intervalMs);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return { latest, history };
}

function Gauge({
  value,
  min = 0,
  max = 100,
  label,
  unit,
  color,
}: {
  value: number;
  min?: number;
  max?: number;
  label: string;
  unit?: string;
  color: string;
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <div className="rounded-xl border bg-card p-4 md:p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground/70">{label}</span>
        <span className="text-sm text-foreground/60">
          {min}
          {unit} – {max}
          {unit}
        </span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="mt-2 text-xl font-bold">
        {value}
        {unit}
      </div>
    </div>
  );
}

function AlertBanner({ latest }: { latest?: SensorData }) {
  if (!latest) return null;
  const { ph, turbidity, temperature } = latest.data;
  const issues: string[] = [];
  if (ph < 6.5 || ph > 8.5) issues.push(`pH out of safe range (${ph})`);
  if (turbidity > 5) issues.push(`High turbidity (${turbidity} NTU)`);
  if (temperature > 35) issues.push(`High temperature (${temperature}°C)`);
  if (issues.length === 0)
    return (
      <div className="rounded-lg border bg-green-50 text-green-900 px-4 py-3">
        All readings within safe thresholds.
      </div>
    );
  return (
    <div className="rounded-lg border border-destructive/50 bg-red-50 text-red-900 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="mt-0.5 text-destructive" />
      <div>
        <p className="font-semibold">Alert</p>
        <ul className="list-disc ml-5 text-sm">
          {issues.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Index() {
  const { latest, history } = useSensorsPoll(3000);
  const chartData = useMemo(
    () =>
      history.map((h) => ({
        time: new Date(h.timestamp).toLocaleTimeString([], {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        ph: h.data.ph,
        turbidity: h.data.turbidity,
        temperature: h.data.temperature,
      })),
    [history],
  );

  const riskLabel = useMemo(() => {
    if (!latest) return "Unknown";
    const { ph, turbidity, temperature } = latest.data;
    const riskScore =
      (ph < 6.5 || ph > 8.5 ? 1 : 0) +
      (turbidity > 50 ? 1 : 0) +
      (temperature > 35 ? 1 : 0);
    return riskScore >= 2
      ? "High Alert"
      : riskScore === 1
        ? "Moderate"
        : "Low Risk";
  }, [latest]);

  return (
    <section className="grid gap-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold">
          Smart Health Dashboard
        </h1>
        <p className="text-foreground/70">
          Real-time water quality monitoring and early warnings
        </p>
      </div>

      <AlertBanner latest={latest} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Gauge
          label="pH"
          value={Number(latest?.data.ph ?? 0)}
          min={0}
          max={14}
          unit=""
          color="#16a34a"
        />
        <Gauge
          label="Turbidity"
          value={Number(latest?.data.turbidity ?? 0)}
          min={0}
          max={200}
          unit=" NTU"
          color="#0ea5e9"
        />
        <Gauge
          label="Temperature"
          value={Number(latest?.data.temperature ?? 0)}
          min={10}
          max={60}
          unit="°C"
          color="#f59e0b"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border bg-card p-4 md:p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical className="text-primary" />
            <h2 className="font-semibold">Sensor Trends</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ left: 8, right: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="ph"
                  stroke="#16a34a"
                  dot={false}
                  name="pH"
                />
                <Line
                  type="monotone"
                  dataKey="turbidity"
                  stroke="#0ea5e9"
                  dot={false}
                  name="Turbidity"
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#f59e0b"
                  dot={false}
                  name="Temperature"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="text-primary" />
            <h2 className="font-semibold">AI Prediction (placeholder)</h2>
          </div>
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-sm text-foreground/70 mb-2">Risk Level</p>
            <div className="text-2xl font-bold">{riskLabel}</div>
            <p className="text-xs text-foreground/60 mt-2">
              This is a visual placeholder for ML output integration.
            </p>
          </div>
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Recent distribution</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData.slice(-10)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="turbidity" fill="#0ea5e9" name="Turbidity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 md:p-6">
        <div className="flex items-center gap-2 mb-2">
          <Waves className="text-primary" />
          <h2 className="font-semibold">ThingsBoard Live Dashboard</h2>
        </div>
        <div className="aspect-video rounded-lg overflow-hidden border">
          <iframe
            title="ThingsBoard Dashboard"
            src={
              (import.meta.env.VITE_TB_PUBLIC_URL as string) ||
              "https://demo.thingsboard.io/dashboard/ab758f50-90a4-11f0-a9b5-792e2194a5d4?publicId=123f6e60-906c-11f0-8c95-7536037a85df"
            }
            className="w-full h-full"
          />
        </div>
      </div>
    </section>
  );
}
