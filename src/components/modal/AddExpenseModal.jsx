import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../services/auth';

function AddExpenseModal({ open, onClose, onSuccess }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    date: '',
    type: '',
    subType: '',
    amount: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      await addDoc(collection(db, 'expenses'), {
        date: new Date(form.date),
        type: form.type,
        subType: form.subType,
        amount: parseFloat(form.amount),
        userId: user.uid
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add Expense</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          name="date"
          label="Date"
          type="date"
          fullWidth
          variant="standard"
          InputLabelProps={{ shrink: true }}
          value={form.date}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="type"
          label="Type"
          fullWidth
          variant="standard"
          value={form.type}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="subType"
          label="Sub Type"
          fullWidth
          variant="standard"
          value={form.subType}
          onChange={handleChange}
        />
        <TextField
          margin="dense"
          name="amount"
          label="Amount"
          type="number"
          fullWidth
          variant="standard"
          value={form.amount}
          onChange={handleChange}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Add</Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddExpenseModal;
