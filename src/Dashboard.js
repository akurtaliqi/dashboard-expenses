import React, { useState, useEffect } from "react";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import * as XLSX from "xlsx";
import { styled } from '@mui/material/styles';
import {
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

const TYPES_PREDEFINIS = ["Virement émis", 
    "Loisirs", "Vie quotidienne", 
    "Voyages et Transports", "Courses", 
    "Loyer", "Transport", "Divertissement", 
    "Santé", "Abonnement",
    "Abonnements et téléphonie",
    "Services financiers / professionnels",
    "Emprunts (hors immobilier)",
];
const ITEMS_PER_PAGE = 10;
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});
export default function Dashboard() {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [monthlyData, setMonthlyData] = useState([]);
  const [predictionData, setPredictionData] = useState([]);
  const [predictionsByType, setPredictionsByType] = useState([]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const arrayBuffer = evt.target.result;
      // Convert ArrayBuffer to binary string
      let binary = "";
      const bytes = new Uint8Array(arrayBuffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const wb = XLSX.read(binary, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData = XLSX.utils.sheet_to_json(ws, { raw: true });
      console.log("Données brutes :", rawData);

       const cleanedData = rawData.map((row, i) => ({
        Date: new Date(row.Date).toISOString().slice(0, 10),
        Montant: parseFloat(String(row.Montant).replace(',', '.')),
        Type: row.Type,
        id: `local-${i}`
      }));

      console.log("Données nettoyées :", cleanedData);
      setData(cleanedData);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleTypeChange = (index, newType) => {
    const updatedData = [...data];
    updatedData[index].Type = newType;
    setData(updatedData);
  };

  const getMonthlyTotals = (filteredData) => {
    const totals = {};
    filteredData.forEach((item) => {
      const month = item.Date?.slice(0, 7);
      totals[month] = (totals[month] || 0) + parseFloat(item.Montant);
    });
    return Object.entries(totals).map(([month, value]) => ({ month, montant: value }));
  };

  const getPredictions = (monthlyData, n = 3) => {
    if (monthlyData.length === 0) return [];
    const y = monthlyData.map((d) => d.montant);
    const avg = y.reduce((a, b) => a + b, 0) / y.length;
    return Array.from({ length: n }, (_, i) => ({ month: `M+${i + 1}`, montant: parseFloat(avg.toFixed(2)) }));
  };

  const getPredictionsByType = (allData) => {
    return TYPES_PREDEFINIS.map(type => {
      const filtered = allData.filter(d => d.Type === type);
      const monthly = getMonthlyTotals(filtered);
      const predicted = getPredictions(monthly);
      return { type, predicted };
    });
  };

  useEffect(() => {
    const monthly = getMonthlyTotals(data);
    setMonthlyData(monthly);
    setPredictionData(getPredictions(monthly));
    setPredictionsByType(getPredictionsByType(data));
  }, [data]);

  const paginatedData = data.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const pieData = TYPES_PREDEFINIS.map(type => {
    const total = data.filter(d => d.Type === type).reduce((sum, d) => sum + parseFloat(d.Montant), 0);
    return { name: type, value: total };
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard Dépenses</h1>
      <Button
  component="label"
  role={undefined}
  variant="contained"
  tabIndex={-1}
  startIcon={<CloudUploadIcon />}
>
  Upload files
  <VisuallyHiddenInput
    type="file"
    onChange={handleFileUpload}
    multiple
  />
</Button>

      <table className="w-full border mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Montant</th>
            <th className="p-2 border">Type</th>
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((item, index) => (
            <tr key={item.id}>
              <td className="p-2 border">{item.Date}</td>
              <td className="p-2 border">{item.Montant} €</td>
              <td className="p-2 border">
                <select
                  value={item.Type}
                  onChange={(e) => handleTypeChange(index + page * ITEMS_PER_PAGE, e.target.value)}
                  className="border rounded p-1"
                >
                  {TYPES_PREDEFINIS.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-between mb-4">
        <button onClick={() => setPage(p => Math.max(p - 1, 0))} disabled={page === 0}>Précédent</button>
        <button onClick={() => setPage(p => (p + 1) * ITEMS_PER_PAGE < data.length ? p + 1 : p)} disabled={(page + 1) * ITEMS_PER_PAGE >= data.length}>Suivant</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent>
          <h3 className="font-semibold mb-2">Répartition par type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" label outerRadius={100}>
                {pieData.map((_, i) => <Cell key={i} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent></Card>

        <Card><CardContent>
          <h3 className="font-semibold mb-2">Dépenses mensuelles</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <XAxis dataKey="month" /><YAxis /><Tooltip />
              <Line type="monotone" dataKey="montant" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent></Card>

        <Card><CardContent>
          <h3 className="font-semibold mb-2">Prédiction globale</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={predictionData}>
              <XAxis dataKey="month" /><YAxis /><Tooltip />
              <Line type="monotone" dataKey="montant" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent></Card>

        {predictionsByType.map(({ type, predicted }, i) => (
          <Card key={i}><CardContent>
            <h3 className="font-semibold mb-2">Prédiction pour {type}</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={predicted}>
                <XAxis dataKey="month" /><YAxis /><Tooltip />
                <Line type="monotone" dataKey="montant" stroke="#ff7300" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
