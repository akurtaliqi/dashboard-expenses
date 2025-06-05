import { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, IconButton, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

function ExpensesTable({ expenses, setExpenses }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingTypeId, setEditingTypeId] = useState(null);
  const [editedTypeValue, setEditedTypeValue] = useState('');

  const handleTypeEdit = (id, currentValue) => {
    setEditingTypeId(id);
    setEditedTypeValue(currentValue);
  };

  const handleTypeChange = (e) => {
    setEditedTypeValue(e.target.value);
  };

  const handleTypeSave = async (id) => {
    const ref = doc(db, 'expenses', id);
    await updateDoc(ref, { type: editedTypeValue });
    setExpenses(prev => prev.map(item => item.id === id ? { ...item, type: editedTypeValue } : item));
    setEditingTypeId(null);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'expenses', id));
    setExpenses(prev => prev.filter(row => row.id !== id));
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (date) => {
    if (!date) return 'Invalid Date';
    if (typeof date === 'string' || typeof date === 'number') return new Date(date).toLocaleDateString();
    if (date.seconds) return new Date(date.seconds * 1000).toLocaleDateString();
    return 'Invalid Date';
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.length > 0 ? (
              expenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{formatDate(expense.date)}</TableCell>
                  <TableCell>
                    {editingTypeId === expense.id ? (
                      <TextField
                        value={editedTypeValue}
                        onChange={handleTypeChange}
                        onBlur={() => handleTypeSave(expense.id)}
                        size="small"
                        autoFocus
                      />
                    ) : (
                      <span onClick={() => handleTypeEdit(expense.id, expense.type)} style={{ cursor: 'pointer' }}>{expense.type}</span>
                    )}
                  </TableCell>
                  <TableCell>{expense.amount}</TableCell>
                  <TableCell>
                    <IconButton color="error" onClick={() => handleDelete(expense.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">No data</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={expenses.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelDisplayedRows={({ page }) => `Page ${page + 1}`}
        />
        <IconButton onClick={() => setPage(0)} disabled={page === 0}><FirstPageIcon /></IconButton>
        <IconButton onClick={() => setPage(Math.max(0, Math.ceil(expenses.length / rowsPerPage) - 1))} disabled={page >= Math.ceil(expenses.length / rowsPerPage) - 1}><LastPageIcon /></IconButton>
      </TableContainer>
    </>
  );
}

export default ExpensesTable;