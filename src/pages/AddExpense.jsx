import { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Alert, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import { collection, addDoc, Timestamp, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/auth';

function AddExpense() {
  const { user } = useAuth();
  const [date, setDate] = useState('');
  const [type, setType] = useState('');
  const [amount, setAmount] = useState('');
  const [typesOptions, setTypesOptions] = useState([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'types'));
        const typesList = snapshot.docs.map(doc => doc.data().label);
        setTypesOptions(typesList);
      } catch (err) {
        console.error('Erreur chargement des types:', err);
      }
    };
    fetchTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      await addDoc(collection(db, 'expenses'), {
        date: new Date(date),
        type,
        amount: Number(amount),
        userId: user.uid,
        createdAt: Timestamp.now()
      });
      setSuccess(true);
      setDate('');
      setType('');
      setAmount('');
    } catch (err) {
      setError("Erreur lors de l'ajout de la dépense.");
    }
  };

  return (
    <Box maxWidth={500} mx="auto" mt={4}>
      <Typography variant="h5" mb={3}>Add expense</Typography>
      {success && <Alert severity="success">Expense successfully added</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Date"
          type="date"
          fullWidth
          margin="normal"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          required
        />
        <FormControl fullWidth margin="normal">
          <InputLabel id="type-label">Type</InputLabel>
          <Select
            labelId="type-label"
            value={type}
            label="Type"
            onChange={(e) => setType(e.target.value)}
            required
          >
            {typesOptions.map((option, index) => (
              <MenuItem key={index} value={option}>{option}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Amount"
          type="number"
          fullWidth
          margin="normal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Add
        </Button>
      </form>
    </Box>
  );
}

export default AddExpense;