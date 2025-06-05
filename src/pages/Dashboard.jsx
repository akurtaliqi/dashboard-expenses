import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem, Grid, Button } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#a569bd', '#5dade2'];

function Dashboard() {
  const [rawExpenses, setRawExpenses] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [allTypes, setAllTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [subTypeData, setSubTypeData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, 'expenses'));
      const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = expenses.filter(e => e.type !== 'Revenus du travail');
      setRawExpenses(filtered);

      const allTypes = [...new Set(filtered.map(e => e.type || 'Unknown'))];
      setAllTypes(allTypes);
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...rawExpenses];

    if (selectedYear !== 'All') {
      filtered = filtered.filter(e => {
        const date = new Date(e.date.seconds * 1000);
        return date.getFullYear().toString() === selectedYear;
      });
    }

    if (selectedMonth !== 'All') {
      filtered = filtered.filter(e => {
        const date = new Date(e.date.seconds * 1000);
        return (date.getMonth() + 1).toString() === selectedMonth;
      });
    }

    if (selectedType !== 'All') {
      filtered = filtered.filter(e => e.type === selectedType);
    }

    const typeSums = filtered.reduce((acc, curr) => {
      const type = curr.type || 'Unknown';
      const amount = Math.abs(parseFloat(curr.amount) || 0);
      acc[type] = (acc[type] || 0) + amount;
      return acc;
    }, {});

    const chartData = Object.keys(typeSums).map((type) => ({
      name: type,
      value: parseFloat(typeSums[type].toFixed(2)),
    }));

    setFilteredData(chartData);
    setSubTypeData(null);
  }, [rawExpenses, selectedYear, selectedMonth, selectedType]);

  const handleLegendClick = (data) => {
    const clickedType = data.value;
    let filtered = rawExpenses.filter(e => e.type === clickedType);

    if (selectedYear !== 'All') {
      filtered = filtered.filter(e => {
        const date = new Date(e.date.seconds * 1000);
        return date.getFullYear().toString() === selectedYear;
      });
    }

    if (selectedMonth !== 'All') {
      filtered = filtered.filter(e => {
        const date = new Date(e.date.seconds * 1000);
        return (date.getMonth() + 1).toString() === selectedMonth;
      });
    }

    const subTypeSums = filtered.reduce((acc, curr) => {
      const subType = curr.subType || 'Unknown';
      const amount = Math.abs(parseFloat(curr.amount) || 0);
      acc[subType] = (acc[subType] || 0) + amount;
      return acc;
    }, {});

    const chartData = Object.keys(subTypeSums).map((subType) => ({
      name: subType,
      value: parseFloat(subTypeSums[subType].toFixed(2)),
    }));

    setSubTypeData({ type: clickedType, data: chartData });
  };

  const availableYears = [...new Set(rawExpenses.map(e => new Date(e.date.seconds * 1000).getFullYear().toString()))];
  const availableMonths = selectedYear === 'All'
  ? [...Array(12).keys()].map(i => (i + 1).toString())
  : [...new Set(
      rawExpenses
        .filter(e => new Date(e.date.seconds * 1000).getFullYear().toString() === selectedYear)
        .map(e => (new Date(e.date.seconds * 1000).getMonth() + 1).toString())
    )].sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <Box mt={6} mb={6} px={2}>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Year</InputLabel>
            <Select value={selectedYear} label="Year" onChange={(e) => setSelectedYear(e.target.value)}>
              <MenuItem value="All">All</MenuItem>
              {availableYears.map(year => <MenuItem key={year} value={year}>{year}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Month</InputLabel>
            <Select value={selectedMonth} label="Month" onChange={(e) => setSelectedMonth(e.target.value)}>
              <MenuItem value="All">All</MenuItem>
              {availableMonths.map(month => {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthIndex = parseInt(month, 10) - 1;
  return <MenuItem key={month} value={month}>{monthNames[monthIndex]}</MenuItem>;
})}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select value={selectedType} label="Type" onChange={(e) => setSelectedType(e.target.value)}>
              <MenuItem value="All">All</MenuItem>
              {allTypes.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end">
            <Button variant="outlined" onClick={() => {
              setSelectedType('All');
              setSelectedYear('All');
              setSelectedMonth('All');
            }}>
              Reset Filters
            </Button>
          </Box>
        </Grid>
      </Grid>

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
              onClick={handleLegendClick}
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend onClick={handleLegendClick} />
          </PieChart>
        </ResponsiveContainer>
      </Paper>

      {subTypeData && (
        <Box mt={6}>
          <Typography variant="h5" gutterBottom>{`Breakdown of ${subTypeData.type} by SubType`}</Typography>
          <Paper elevation={3} sx={{ p: 4, height: 500, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subTypeData.data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label
                >
                  {subTypeData.data.map((entry, index) => (
                    <Cell key={`subtype-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      )}
    </Box>
  );
}

export default Dashboard;
