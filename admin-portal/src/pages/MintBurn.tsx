import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Alert,
  useTheme
} from '@mui/material';
import { 
  Add as AddIcon,
  Remove as RemoveIcon,
  History as HistoryIcon,
  AccountBalance as ReservesIcon,
  MonetizationOn as MintIcon,
  Delete as BurnIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';

// Mock data for mint/burn history
const mockMintBurnHistory = [
  { 
    id: 1, 
    type: 'Mint', 
    amount: 1000000, 
    date: '2025-04-05', 
    authorizedBy: 'John Smith', 
    organization: 'Bank of Tanzania',
    reason: 'Initial stablecoin issuance',
    txHash: '0x1a2b3c4d5e6f...'
  },
  { 
    id: 2, 
    type: 'Mint', 
    amount: 500000, 
    date: '2025-04-03', 
    authorizedBy: 'Maria Johnson', 
    organization: 'Bank of Tanzania',
    reason: 'Increased market demand',
    txHash: '0x2b3c4d5e6f7g...'
  },
  { 
    id: 3, 
    type: 'Burn', 
    amount: 200000, 
    date: '2025-04-01', 
    authorizedBy: 'Robert Chen', 
    organization: 'NEDA Pay',
    reason: 'Excess supply adjustment',
    txHash: '0x3c4d5e6f7g8h...'
  },
  { 
    id: 4, 
    type: 'Mint', 
    amount: 300000, 
    date: '2025-03-28', 
    authorizedBy: 'John Smith', 
    organization: 'Bank of Tanzania',
    reason: 'Reserve increase',
    txHash: '0x4d5e6f7g8h9i...'
  },
  { 
    id: 5, 
    type: 'Burn', 
    amount: 100000, 
    date: '2025-03-25', 
    authorizedBy: 'Maria Johnson', 
    organization: 'NEDA Pay',
    reason: 'Market stabilization',
    txHash: '0x5e6f7g8h9i0j...'
  },
];

const MintBurn: React.FC = () => {
  const theme = useTheme();
  const [openMintDialog, setOpenMintDialog] = useState(false);
  const [openBurnDialog, setOpenBurnDialog] = useState(false);
  const [mintAmount, setMintAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [reason, setReason] = useState('');
  const [organization, setOrganization] = useState('');
  const [mintSuccess, setMintSuccess] = useState(false);
  const [burnSuccess, setBurnSuccess] = useState(false);

  // Calculate total minted and burned
  const totalMinted = mockMintBurnHistory
    .filter(item => item.type === 'Mint')
    .reduce((sum, item) => sum + item.amount, 0);
    
  const totalBurned = mockMintBurnHistory
    .filter(item => item.type === 'Burn')
    .reduce((sum, item) => sum + item.amount, 0);
    
  const netCirculating = totalMinted - totalBurned;

  // Prepare data for chart
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Total Supply',
        data: [2000000, 3500000, 5000000, 6800000, 8200000, 9500000, 10000000],
        borderColor: theme.palette.primary.main,
        backgroundColor: 'transparent',
        tension: 0.4,
      },
      {
        label: 'Circulating Supply',
        data: [1000000, 2200000, 3800000, 4500000, 5000000, 5250000, 5250000],
        borderColor: theme.palette.secondary.main,
        backgroundColor: 'transparent',
        tension: 0.4,
      },
    ],
  };

  const handleMintDialogOpen = () => {
    setOpenMintDialog(true);
    setMintSuccess(false);
  };

  const handleMintDialogClose = () => {
    setOpenMintDialog(false);
    setMintAmount('');
    setReason('');
    setOrganization('');
  };

  const handleBurnDialogOpen = () => {
    setOpenBurnDialog(true);
    setBurnSuccess(false);
  };

  const handleBurnDialogClose = () => {
    setOpenBurnDialog(false);
    setBurnAmount('');
    setReason('');
    setOrganization('');
  };

  const handleMint = () => {
    // Logic to mint tokens would go here
    // This would call the TSHC.sol contract's mint function
    setMintSuccess(true);
    setTimeout(() => {
      handleMintDialogClose();
    }, 2000);
  };

  const handleBurn = () => {
    // Logic to burn tokens would go here
    // This would call the TSHC.sol contract's burn function
    setBurnSuccess(true);
    setTimeout(() => {
      handleBurnDialogClose();
    }, 2000);
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Mint & Burn Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Control the supply of TSHC stablecoin through minting and burning operations
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              height: '100%'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MintIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="medium">
                  Total Minted
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {totalMinted.toLocaleString()} TSHC
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Last minted: {mockMintBurnHistory.find(item => item.type === 'Mint')?.date}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              height: '100%'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BurnIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="medium">
                  Total Burned
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="error.main">
                {totalBurned.toLocaleString()} TSHC
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Last burned: {mockMintBurnHistory.find(item => item.type === 'Burn')?.date}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card 
            elevation={0} 
            sx={{ 
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              height: '100%'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ReservesIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="medium">
                  Net Circulating
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                {netCirculating.toLocaleString()} TSHC
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Backed by verified reserves at 102.5%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Supply Chart */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          mb: 4
        }}
      >
        <Typography variant="h6" fontWeight="medium" gutterBottom>
          TSHC Supply History
        </Typography>
        <Box sx={{ height: 300 }}>
          <Line 
            data={chartData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </Box>
      </Paper>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="medium">
          Mint & Burn History
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            startIcon={<HistoryIcon />} 
            variant="outlined"
          >
            View All History
          </Button>
          <Button 
            startIcon={<BurnIcon />} 
            variant="outlined" 
            color="error"
            onClick={handleBurnDialogOpen}
          >
            Burn TSHC
          </Button>
          <Button 
            startIcon={<AddIcon />} 
            variant="contained" 
            color="success"
            onClick={handleMintDialogOpen}
          >
            Mint TSHC
          </Button>
        </Box>
      </Box>

      {/* Mint/Burn History Table */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Authorized By</TableCell>
              <TableCell>Organization</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Transaction Hash</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockMintBurnHistory.map((item) => (
              <TableRow key={item.id}>
                <TableCell component="th" scope="row">
                  {item.date}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={item.type} 
                    color={item.type === 'Mint' ? 'success' : 'error'} 
                    size="small" 
                    icon={item.type === 'Mint' ? <AddIcon /> : <RemoveIcon />}
                  />
                </TableCell>
                <TableCell align="right">{item.amount.toLocaleString()} TSHC</TableCell>
                <TableCell>{item.authorizedBy}</TableCell>
                <TableCell>{item.organization}</TableCell>
                <TableCell>{item.reason}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {item.txHash}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mint Dialog */}
      <Dialog open={openMintDialog} onClose={handleMintDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Mint TSHC Tokens</DialogTitle>
        <DialogContent>
          {mintSuccess ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Successfully minted TSHC tokens! Transaction has been submitted to the blockchain.
            </Alert>
          ) : (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="info">
                Minting new TSHC tokens requires proper collateral backing in the reserve.
                Make sure sufficient reserves are available before proceeding.
              </Alert>
              <TextField 
                label="Amount to Mint" 
                type="number" 
                fullWidth 
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                InputProps={{
                  endAdornment: <Typography variant="body2">TSHC</Typography>,
                }}
              />
              <FormControl fullWidth>
                <InputLabel>Organization</InputLabel>
                <Select 
                  label="Organization" 
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                >
                  <MenuItem value="Bank of Tanzania">Bank of Tanzania</MenuItem>
                  <MenuItem value="NEDA Pay">NEDA Pay</MenuItem>
                  <MenuItem value="Ministry of Finance">Ministry of Finance</MenuItem>
                </Select>
              </FormControl>
              <TextField 
                label="Reason for Minting" 
                multiline 
                rows={3} 
                fullWidth 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                This operation will call the mint function on the TSHC smart contract.
                It requires multi-signature approval and will be recorded on the blockchain.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleMintDialogClose}>Cancel</Button>
          {!mintSuccess && (
            <Button 
              variant="contained" 
              color="success" 
              onClick={handleMint}
              disabled={!mintAmount || !reason || !organization}
            >
              Mint Tokens
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Burn Dialog */}
      <Dialog open={openBurnDialog} onClose={handleBurnDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Burn TSHC Tokens</DialogTitle>
        <DialogContent>
          {burnSuccess ? (
            <Alert severity="success" sx={{ mt: 2 }}>
              Successfully burned TSHC tokens! Transaction has been submitted to the blockchain.
            </Alert>
          ) : (
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Alert severity="warning">
                Burning TSHC tokens permanently removes them from circulation.
                This action cannot be undone once confirmed.
              </Alert>
              <TextField 
                label="Amount to Burn" 
                type="number" 
                fullWidth 
                value={burnAmount}
                onChange={(e) => setBurnAmount(e.target.value)}
                InputProps={{
                  endAdornment: <Typography variant="body2">TSHC</Typography>,
                }}
              />
              <FormControl fullWidth>
                <InputLabel>Organization</InputLabel>
                <Select 
                  label="Organization" 
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                >
                  <MenuItem value="Bank of Tanzania">Bank of Tanzania</MenuItem>
                  <MenuItem value="NEDA Pay">NEDA Pay</MenuItem>
                  <MenuItem value="Ministry of Finance">Ministry of Finance</MenuItem>
                </Select>
              </FormControl>
              <TextField 
                label="Reason for Burning" 
                multiline 
                rows={3} 
                fullWidth 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                This operation will call the burn function on the TSHC smart contract.
                It requires multi-signature approval and will be recorded on the blockchain.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBurnDialogClose}>Cancel</Button>
          {!burnSuccess && (
            <Button 
              variant="contained" 
              color="error" 
              onClick={handleBurn}
              disabled={!burnAmount || !reason || !organization}
            >
              Burn Tokens
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MintBurn;
