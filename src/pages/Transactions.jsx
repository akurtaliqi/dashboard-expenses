import { useState, useEffect } from 'react';
import { Box, Button, Typography, Alert, CircularProgress, ButtonGroup } from '@mui/material';
import * as XLSX from 'xlsx';
import { collection, addDoc, getDocs, deleteDoc, doc, query, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/auth';
import ExpensesTable from '../components/expenses/ExepensesTable';
import IncomesTable from '../components/Incomes/IncomesTable';
import Stack from '@mui/material/Stack';
import AddExpenseModal from '../components/modal/AddExpenseModal';

function Transactions() {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [success, setSuccess] = useState(false);
    const [isDeleteSuccess, setIsDeleteSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [loadingData, setLoadingData] = useState(false);
    const [collectionName, setCollectionName] = useState('');
    const [collectionSize, setCollectionSize] = useState(0);
    // TODO : clean spaces before / after the type and subType values
    const fetchData = async () => {
        // if (!user) return;
        setLoadingData(true);
        try {
            const q = query(collection(db, 'expenses'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const sorted = data.sort((a, b) => new Date(b.date.seconds * 1000) - new Date(a.date.seconds * 1000));
            setExpenses(sorted);
            const incomesQuery = query(collection(db, 'incomes'));
            const incomesSnapshot = await getDocs(incomesQuery);
            const incomesData = incomesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const incomesDataSorted = incomesData.sort((a, b) => new Date(b.date.seconds * 1000) - new Date(a.date.seconds * 1000));
            setIncomes(incomesDataSorted);
        } catch (err) {
            console.error('Erreur chargement des dépenses:', err);
        } finally {
            setLoadingData(false);
        }
    };
    useEffect(() => {
        fetchData();
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
                    const targetCollection = item.type === 'Revenus du travail' ? 'incomes' : 'expenses';
                    await addDoc(collection(db, targetCollection), item);
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
                fetchData();
            }
        };
        reader.readAsArrayBuffer(file);

    };

    const purgeCollection = async (collectionName) => {
        setCollectionName(collectionName);
        setLoadingData(true);
        try {
            const snapshot = await getDocs(collection(db, collectionName));
            const deletions = snapshot.docs.map((d) => deleteDoc(doc(db, collectionName, d.id)));
            setCollectionSize(snapshot.size);
            await Promise.all(deletions);
        } catch (err) {
            setError(`Erreur lors de la purge de "${collectionName}".`, err);
        } finally {
            if (collectionName === 'expenses') {
                setExpenses([]);
            } else if (collectionName === 'incomes') {
                setIncomes([]);
            }
            setIsDeleteSuccess(true);
            setLoadingData(false);
        }
    };

    const [openModal, setOpenModal] = useState(false);
    return (
        <>
            <Box mt={4} mb={4}>

                <ButtonGroup variant="contained" aria-label="Basic button group">
                    <Stack spacing={2} direction="row">
                        <Button variant="contained" component="label" >
                            Upload data (expenses and incomes)
                            <input type="file" hidden accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
                        </Button>
                        <Button
                            variant="outlined" color="error"
                            onClick={async () => {
                                purgeCollection('expenses');
                                purgeCollection('incomes');
                            }}
                        >
                            Purge data (expenses and incomes)
                        </Button>
                    </Stack>
                </ButtonGroup>

                {success &&
                    <Alert severity="success" sx={{ mt: 2 }}>Données importées et enregistrées avec succès</Alert>
                }
                {error &&
                    <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
                }
                {isDeleteSuccess &&
                    <Alert severity="success" sx={{ mt: 2 }}>✅ Collection "{collectionName}" purgée ({collectionSize} documents supprimés).</Alert>
                }


                <Box mt={4} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h4" gutterBottom>Expenses</Typography>
                    <Button variant="contained" onClick={() => setOpenModal(true)}>Add Expense</Button>
                </Box>
                {loadingData ? (
                    <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>
                ) : <><ExpensesTable expenses={expenses} setExpenses={setExpenses} />
                    <IncomesTable incomes={incomes} setIncomes={setIncomes} /></>
                }

            </Box>
             <AddExpenseModal
                open={openModal}
                onClose={() => setOpenModal(false)}
                onSuccess={() => {
                    fetchData();
                    setOpenModal(false);
                }}
            />
        </>
    );
}

export default Transactions;