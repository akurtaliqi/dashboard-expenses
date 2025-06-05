import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem, Grid, Button, Alert } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7f50', '#a569bd', '#5dade2'];

function Dashboard() {
  const [rawExpenses, setRawExpenses] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [lineChartData, setLineChartData] = useState([]);
  const [allTypes, setAllTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('All');
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear().toString();
  const currentMonth = (currentDate.getMonth() + 1).toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [monthWarning, setMonthWarning] = useState('');
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

  const availableYears = [...new Set(rawExpenses.map(e => new Date(e.date.seconds * 1000).getFullYear().toString()))].sort((a, b) => b - a);

  const getAvailableMonths = (year) => {
    return [...new Set(
      rawExpenses
        .filter(e => new Date(e.date.seconds * 1000).getFullYear().toString() === year)
        .map(e => (new Date(e.date.seconds * 1000).getMonth() + 1).toString())
    )].sort((a, b) => parseInt(a) - parseInt(b));
  };

  useEffect(() => {
    const monthsForYear = getAvailableMonths(selectedYear);
    if (!monthsForYear.includes(currentMonth)) {
      if (monthsForYear.length > 0) {
        setSelectedMonth(monthsForYear[monthsForYear.length - 1]);
        setMonthWarning('No data for the current month. Showing the latest available month.');
        setTimeout(() => setMonthWarning(''), 5000);
      }
    } else {
      setSelectedMonth(currentMonth);
    }
  }, [selectedYear, rawExpenses]);

  useEffect(() => {
    let filtered = [...rawExpenses];

    filtered = filtered.filter(e => new Date(e.date.seconds * 1000).getFullYear().toString() === selectedYear);
    if (selectedMonth !== 'All') {
      filtered = filtered.filter(e => (new Date(e.date.seconds * 1000).getMonth() + 1).toString() === selectedMonth);
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

    const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0 }));
    filtered.forEach((item) => {
      const date = new Date(item.date.seconds * 1000);
      const month = date.getMonth();
      const amount = Math.abs(parseFloat(item.amount) || 0);
      monthly[month].total += amount;
    });

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const lineData = monthly.map((m, idx) => ({ month: monthNames[idx], value: parseFloat(m.total.toFixed(2)) }));
    setLineChartData(lineData);
  }, [rawExpenses, selectedYear, selectedMonth, selectedType]);

  const handleLegendClick = (data) => {
    const clickedType = data.value;
    let filtered = rawExpenses.filter(e => e.type === clickedType);

    filtered = filtered.filter(e => new Date(e.date.seconds * 1000).getFullYear().toString() === selectedYear);
    if (selectedMonth !== 'All') {
      filtered = filtered.filter(e => (new Date(e.date.seconds * 1000).getMonth() + 1).toString() === selectedMonth);
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

  const availableMonths = getAvailableMonths(selectedYear);

  const handleResetFilters = () => {
    setSelectedType('All');
    setSelectedYear(currentYear);
    const months = getAvailableMonths(currentYear);
    if (months.includes(currentMonth)) {
      setSelectedMonth(currentMonth);
    } else if (months.length > 0) {
      setSelectedMonth(months[months.length - 1]);
      setMonthWarning('No data for the current month. Showing the latest available month.');
      setTimeout(() => setMonthWarning(''), 5000);
    } else {
      setSelectedMonth('All');
    }
    setSubTypeData(null);
  };

  return (
    <Box mt={6} mb={6} px={2}>
      <Grid container spacing={2} alignItems="flex-end" sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Year</InputLabel>
            <Select value={selectedYear} label="Year" onChange={(e) => setSelectedYear(e.target.value)}>
              {availableYears.map(year => <MenuItem key={year} value={year}>{year}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Month</InputLabel>
            <Select value={selectedMonth} label="Month" onChange={(e) => setSelectedMonth(e.target.value)}>
              <MenuItem value="All">All</MenuItem>
              {["1","2","3","4","5","6","7","8","9","10","11","12"].filter(m => availableMonths.includes(m)).map(month => {
                const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const monthIndex = parseInt(month, 10) - 1;
                return <MenuItem key={month} value={month}>{monthNames[monthIndex]}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select value={selectedType} label="Type" onChange={(e) => setSelectedType(e.target.value)}>
              <MenuItem value="All">All</MenuItem>
              {allTypes.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3} display="flex" justifyContent="flex-end">
          <Button variant="outlined" onClick={handleResetFilters} sx={{ height: '56px' }}>
            Reset Filters
          </Button>
        </Grid>
      </Grid>

      {monthWarning && (
        <Box mb={2}>
          <Alert severity="info">{monthWarning}</Alert>
        </Box>
      )}

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
              onClick={(e) => handleLegendClick({ value: e.name })}
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

      <Box mt={6}>
        <Typography variant="h5" gutterBottom>Monthly Spending Overview</Typography>
        <Paper elevation={3} sx={{ p: 4, height: 400, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Box>

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
          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button variant="text" onClick={() => setSubTypeData(null)}>Close breakdown</Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default Dashboard;