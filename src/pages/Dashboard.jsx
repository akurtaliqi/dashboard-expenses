import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#a569bd', '#5dade2'];

function Dashboard() {
  const [data, setData] = useState([]);
  const [allTypes, setAllTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, 'expenses'));
      const expenses = snapshot.docs.map(doc => doc.data());

      const typeSums = expenses.reduce((acc, curr) => {
        const type = curr.type || 'Unknown';
        if (type === 'Revenus du travail') return acc; // Skip income types
        const amount = Math.abs(parseFloat(curr.amount) || 0);
        acc[type] = (acc[type] || 0) + amount;
        return acc;
      }, {});

      const allExpenseTypes = Object.keys(typeSums);
      setAllTypes(allExpenseTypes);

      const chartData = allExpenseTypes.map((type) => ({
        name: type,
        value: parseFloat(typeSums[type].toFixed(2)),
      }));

      setData(chartData);
    };

    fetchData();
  }, []);

  const filteredData = selectedType === 'All' ? data : data.filter(d => d.name === selectedType);

  return (
    <Box mt={6} mb={6} px={2}>
      <FormControl fullWidth sx={{ mb: 4, maxWidth: 300 }}>
        <InputLabel>Filter by type</InputLabel>
        <Select
          value={selectedType}
          label="Filter by type"
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <MenuItem value="All">All</MenuItem>
          {allTypes.map(type => (
            <MenuItem key={type} value={type}>{type}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Paper elevation={3} sx={{ p: 4, height: 500, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={filteredData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}

export default Dashboard;
