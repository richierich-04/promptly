import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import axios from 'axios';
import TradePage from './pages/TradePage';
import PortfolioPage from './pages/PortfolioPage';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

function App() {
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    // Fetch initial stock data from the backend
    const fetchStocks = async () => {
      try {
        const response = await axios.get('/api/stocks');
        setStocks(response.data);
      } catch (error) {
        console.error('Error fetching stocks:', error);
      }
    };

    fetchStocks();
  }, []);

  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Trading App
          </Typography>
          <Button color="inherit" component={Link} to="/">Trade</Button>
          <Button color="inherit" component={Link} to="/portfolio">Portfolio</Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 2 }}>
        <Routes>
          <Route path="/" element={<TradePage stocks={stocks} />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
        </Routes>
      </Box>
    </Router>
  );
}

export default App;
