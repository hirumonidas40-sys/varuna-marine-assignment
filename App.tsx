import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type RouteRow = {
  routeId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumptionTons: number;
  distanceKm: number;
  totalEmissionsTons: number;
  baselineSet: boolean;
};

type CB = {
  shipId: string;
  year: number;
  cbBefore: number;
  applied: number;
  cbAfter: number;
};
type ComparisonResp = {
  target: number;
  comparison: Array<{ routeId: string; baselineGhg: number; compGhg: number }>;
};

export default function App() {
  const [tab, setTab] = useState<"routes" | "compare" | "banking" | "pooling">(
    "routes"
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Fuel EU Compliance Dashboard</h1>
      <nav className="mb-4 space-x-2">
        <button onClick={() => setTab("routes")}>Routes</button>
        <button onClick={() => setTab("compare")}>Compare</button>
        <button onClick={() => setTab("banking")}>Banking</button>
        <button onClick={() => setTab("pooling")}>Pooling</button>
      </nav>

      <div className="border p-4 rounded">
        {tab === "routes" && <RoutesTab />}
        {tab === "compare" && <CompareTab />}
        {tab === "banking" && <BankingTab />}
        {tab === "pooling" && <PoolingTab />}
      </div>
    </div>
  );
}

/* ---------------- Routes Tab ---------------- */
function RoutesTab() {
  const [rows, setRows] = useState<RouteRow[]>([]);
  const [filters, setFilters] = useState({
    vesselType: "",
    fuelType: "",
    year: "",
  });

  useEffect(() => {
    fetchRows();
  }, []);

  async function fetchRows() {
    const params: any = {};
    if (filters.vesselType) params.vesselType = filters.vesselType;
    if (filters.fuelType) params.fuelType = filters.fuelType;
    if (filters.year) params.year = filters.year;
    const res = await axios.get<RouteRow[]>("/api/routes", { params });
    setRows(res.data);
  }

  async function setBaseline(routeId: string) {
    await axios.post(`/api/routes/${routeId}/baseline`);
    fetchRows();
  }

  return (
    <div>
      <h2 className="text-xl mb-2">Routes</h2>

      <div className="mb-3 flex gap-2">
        <input
          placeholder="vesselType"
          value={filters.vesselType}
          onChange={(e) =>
            setFilters((f) => ({ ...f, vesselType: e.target.value }))
          }
        />
        <input
          placeholder="fuelType"
          value={filters.fuelType}
          onChange={(e) =>
            setFilters((f) => ({ ...f, fuelType: e.target.value }))
          }
        />
        <input
          placeholder="year"
          value={filters.year}
          onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
        />
        <button onClick={fetchRows}>Filter</button>
      </div>

      <table className="table">
        <thead>
          <tr className="header">
            <th>routeId</th>
            <th>vesselType</th>
            <th>fuelType</th>
            <th>year</th>
            <th>ghgIntensity</th>
            <th>fuelConsumption(t)</th>
            <th>distance(km)</th>
            <th>totalEmissions(t)</th>
            <th>baseline</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.routeId}>
              <td>{r.routeId}</td>
              <td>{r.vesselType}</td>
              <td>{r.fuelType}</td>
              <td>{r.year}</td>
              <td>{r.ghgIntensity}</td>
              <td>{r.fuelConsumptionTons}</td>
              <td>{r.distanceKm}</td>
              <td>{r.totalEmissionsTons}</td>
              <td>
                <button
                  onClick={() => setBaseline(r.routeId)}
                  disabled={r.baselineSet}
                >
                  {r.baselineSet ? "Baseline set" : "Set Baseline"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Compare Tab ---------------- */
function CompareTab() {
  const [data, setData] = useState<ComparisonResp | null>(null);

  useEffect(() => {
    axios
      .get<ComparisonResp>("/api/routes/comparison")
      .then((r) => setData(r.data));
  }, []);

  if (!data) return <div>Loading...</div>;

  const labels = data.comparison.map((c) => c.routeId);
  const baselineValues = data.comparison.map((c) => c.baselineGhg);
  const compValues = data.comparison.map((c) => c.compGhg);

  const chartData = {
    labels,
    datasets: [
      { label: "Baseline (gCO₂e/MJ)", data: baselineValues },
      { label: "Comparison (gCO₂e/MJ)", data: compValues },
    ],
  };

  return (
    <div>
      <h2 className="text-xl mb-2">Compare (target {data.target})</h2>

      <table className="table mb-4">
        <thead className="header">
          <tr>
            <th>routeId</th>
            <th>baseline</th>
            <th>comparison</th>
            <th>% diff</th>
            <th>compliant</th>
          </tr>
        </thead>
        <tbody>
          {data.comparison.map((c) => {
            const percentDiff = (c.compGhg / c.baselineGhg - 1) * 100;
            return (
              <tr key={c.routeId}>
                <td>{c.routeId}</td>
                <td>{c.baselineGhg}</td>
                <td>{c.compGhg}</td>
                <td>{percentDiff.toFixed(2)}%</td>
                <td>{c.compGhg <= data.target ? "✅" : "❌"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ maxWidth: 800 }}>
        <Bar data={chartData as any} />
      </div>
    </div>
  );
}

/* ---------------- Banking Tab ---------------- */
function BankingTab() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [cbs, setCbs] = useState<CB[]>([]);

  useEffect(() => {
    fetchCBs();
  }, [year]);

  async function fetchCBs() {
    const res = await axios.get<CB[]>("/api/compliance/cb", {
      params: { year },
    });
    setCbs(res.data);
  }

  async function bank(shipId: string) {
    const amount = Number(prompt("Bank amount (tCO2e)") || "0");
    if (!amount || amount <= 0) return alert("amount must be positive");
    await axios.post("/api/banking/bank", { shipId, year, amount });
    fetchCBs();
  }

  async function apply(fromShipId: string, toShipId: string) {
    const amount = Number(prompt("Apply amount (tCO2e)") || "0");
    if (!amount || amount <= 0) return alert("amount must be positive");
    await axios.post("/api/banking/apply", {
      fromShipId,
      toShipId,
      year,
      amount,
    });
    fetchCBs();
  }

  return (
    <div>
      <h2 className="text-xl mb-2">Banking</h2>
      <div className="mb-3">
        <label>Year: </label>
        <input
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="ml-2"
        />
        <button onClick={fetchCBs} className="ml-2">
          Refresh
        </button>
      </div>

      <table className="table">
        <thead className="header">
          <tr>
            <th>Ship</th>
            <th>Year</th>
            <th>cb_before</th>
            <th>applied</th>
            <th>cb_after</th>
            <th>actions</th>
          </tr>
        </thead>
        <tbody>
          {cbs.map((c) => (
            <tr key={c.shipId}>
              <td>{c.shipId}</td>
              <td>{c.year}</td>
              <td>{c.cbBefore}</td>
              <td>{c.applied}</td>
              <td>{c.cbAfter}</td>
              <td>
                <button
                  onClick={() => bank(c.shipId)}
                  disabled={c.cbBefore <= 0}
                >
                  Bank
                </button>
                <button
                  onClick={() => {
                    const to = prompt("to shipId");
                    if (to) apply(c.shipId, to);
                  }}
                >
                  Apply
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Pooling Tab ---------------- */
function PoolingTab() {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [adjusted, setAdjusted] = useState<
    { shipId: string; cbBefore: number; cbAfter: number }[]
  >([]);
  const [poolMembers, setPoolMembers] = useState<
    { shipId: string; share: number }[]
  >([]);
  const [poolName, setPoolName] = useState("");

  useEffect(() => {
    fetchAdjusted();
  }, [year]);

  async function fetchAdjusted() {
    const res = await axios.get("/api/compliance/adjusted-cb", {
      params: { year },
    });
    setAdjusted(res.data);
  }

  function addMember() {
    const shipId = prompt("shipId");
    const share = Number(prompt("share (adjustment)") || "0");
    if (!shipId) return;
    setPoolMembers((ms) => [...ms, { shipId, share }]);
  }

  async function createPool() {
    if (!poolName) return alert("name required");
    const res = await axios.post("/api/pools", {
      name: poolName,
      members: poolMembers,
      year,
    });
    alert("pool result: " + JSON.stringify(res.data, null, 2));
    setPoolMembers([]);
    setPoolName("");
    fetchAdjusted();
  }

  const sum = adjusted.reduce((s, a) => s + a.cbBefore, 0);
  const valid = sum >= 0;

  return (
    <div>
      <h2 className="text-xl mb-2">Pooling</h2>
      <div className="mb-3">
        <label>Year: </label>
        <input
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="ml-2"
        />
        <button onClick={fetchAdjusted} className="ml-2">
          Refresh
        </button>
      </div>

      <div className="mb-3">
        <h3 className="font-semibold">Adjusted CB</h3>
        <ul>
          {adjusted.map((a) => (
            <li key={a.shipId}>
              {a.shipId}: {a.cbBefore} → {a.cbAfter}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-3">
        <h3 className="font-semibold">Create Pool</h3>
        <input
          placeholder="pool name"
          value={poolName}
          onChange={(e) => setPoolName(e.target.value)}
        />
        <div className="mt-2">
          <button onClick={addMember}>Add Member</button>
          <button onClick={createPool} disabled={!valid}>
            Create Pool
          </button>
        </div>
        <div className="mt-2">
          Pool sum:{" "}
          <span className={valid ? "text-green-600" : "text-red-600"}>
            {sum}
          </span>
        </div>
        <div>
          Members:
          <ul>
            {poolMembers.map((m, i) => (
              <li key={i}>
                {m.shipId}: {m.share}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
