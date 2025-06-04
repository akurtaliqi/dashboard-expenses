import { useState, useEffect } from 'react';
import { Box, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination, Alert, CircularProgress, IconButton, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import * as XLSX from 'xlsx';
import { collection, addDoc, getDocs, deleteDoc, doc, query, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/auth';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';


function Home() {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [success, setSuccess] = useState(false);
    const [isDeleteSuccess, setIsDeleteSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [loadingData, setLoadingData] = useState(false);
    const [collectionName, setCollectionName] = useState('');
    const [collectionSize, setCollectionSize] = useState(0);
    const [editingTypeId, setEditingTypeId] = useState(null);
    const [editedTypeValue, setEditedTypeValue] = useState('');
    const fetchExpenses = async () => {
        // if (!user) return;
        setLoadingData(true);
        try {
            const q = query(collection(db, 'expenses'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const sorted = data.sort((a, b) => new Date(b.date.seconds * 1000) - new Date(a.date.seconds * 1000));
            setExpenses(sorted);
        } catch (err) {
            console.error('Erreur chargement des dépenses:', err);
        } finally {
            setLoadingData(false);
        }
    };
    useEffect(() => {

        fetchExpenses();
    }, [user]);

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);
    useEffect(() => {
        if (isDeleteSuccess) {
            const timer = setTimeout(() => setIsDeleteSuccess(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isDeleteSuccess]);

    const parseCustomDate = (str) => {
        console.log("Parsing date:", str);
        const [day, month, year] = str.split('/');
        return new Date(`${year}-${month}-${day}`);
    };

    const excelDateToJSDate = (serial) => {
        const utcDays = Math.floor(serial - 25569);
        const utcValue = utcDays * 86400;
        return new Date(utcValue * 1000);
    };


    const handleFileUpload = (e) => {
        setLoadingData(true);
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = new Uint8Array(evt.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                const enrichedRows = json.map(expense => ({
                    date: expense.date
                        ? typeof expense.date === 'string' && expense.date.includes('/')
                            ? parseCustomDate(expense.date)
                            : typeof expense.date === 'number'
                                ? excelDateToJSDate(expense.date)
                                : new Date(expense.date)
                        : new Date(),
                    amount: parseFloat(expense.amount || 0),
                    type: expense.type || 'Unknown',
                    subType: expense.subType || 'Unknown',
                    userId: user.uid,
                }));

                console.log("Données enrichies :", enrichedRows);

                for (const item of enrichedRows) {
                    await addDoc(collection(db, 'expenses'), item);
                }

                setExpenses(enrichedRows);
                setSuccess(true);
                setError(null);
            } catch (err) {
                console.error(err);
                setError("Erreur lors de l'importation des données.");
                setSuccess(false);
            } finally {
                setLoadingData(false);
            }
        };
        reader.readAsArrayBuffer(file);
        fetchExpenses();
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleDelete = async (id) => {
        await deleteDoc(doc(db, 'expenses', id));
        setExpenses((prev) => prev.filter((row) => row.id !== id));
    };

    const purgeCollection = async (collectionName) => {
        setCollectionName(collectionName);
        setLoadingData(true);
        try {
            const snapshot = await getDocs(collection(db, collectionName));
            const deletions = snapshot.docs.map((d) => deleteDoc(doc(db, collectionName, d.id)));
            setCollectionSize(snapshot.size);
            await Promise.all(deletions);
            setIsDeleteSuccess(true);
        } catch (err) {
            setError(`Erreur lors de la purge de "${collectionName}".`, err);
        } finally {
            setExpenses([]);
            setLoadingData(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Invalid Date';
        if (typeof date === 'string' || typeof date === 'number') {
            return new Date(date).toLocaleDateString();
        }
        if (date.seconds) {
            return new Date(date.seconds * 1000).toLocaleDateString();
        }
        return 'Invalid Date';
    };
    const handleTypeEdit = (id, currentValue) => {
        setEditingTypeId(id);
        setEditedTypeValue(currentValue);
    };

    const handleTypeChange = (e) => {
        setEditedTypeValue(e.target.value);
    };

    const handleTypeSave = async (id) => {
        const expenseRef = doc(db, 'expenses', id);
        await updateDoc(expenseRef, { type: editedTypeValue });
        setExpenses((prev) => prev.map((item) => item.id === id ? { ...item, type: editedTypeValue } : item));
        setEditingTypeId(null);
    };

    return (
        <>
            <Box mt={4}>
                <Typography variant="h5" gutterBottom>Accueil</Typography>
                <Button variant="contained" component="label">
                    Importer fichier CSV/Excel
                    <input type="file" hidden accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
                </Button>
                {success && <Alert severity="success" sx={{ mt: 2 }}>Données importées et enregistrées avec succès</Alert>}
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                {isDeleteSuccess && <Alert severity="success" sx={{ mt: 2 }}>✅ Collection "{collectionName}" purgée ({collectionSize} documents supprimés).</Alert>}
                {loadingData ? (
                    <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
                ) : <TableContainer component={Paper} sx={{ mt: 2 }}>
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
                }

            </Box>
            <Box mt={4}>
                <Button
                    variant="outlined" color="error"
                    onClick={() => {
                        purgeCollection('expenses');
                    }}
                >
                    Purge data
                </Button>
            </Box>
        </>
    );
}

export default Home;