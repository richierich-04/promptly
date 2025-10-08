import React, { useState } from 'react';
import axios from 'axios';
import StockChart from '../components/StockChart';
import { Button, TextField, Typography, Box } from '@mui/material';

const TradePage = ({ stocks }) => {
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [chartData, setChartData] = useState([]);

  const handleBuy = async () => {
    try {
      await axios.post('/api/trade/buy', { ticker, quantity });
      alert('Trade successful!');
    } catch (error) {
      console.error('Error buying stock:', error);
      alert('Trade failed. Please check console.');
    }
  };

  const handleSell = async () => {
    try {
      await axios.post('/api/trade/sell', { ticker, quantity });
      alert('Trade successful!');
    } catch (error) {
      console.error('Error selling stock:', error);
      alert('Trade failed. Please check console.');
    }
  };

  const handleTickerChange = (event) => {
    setTicker(event.target.value);
  }

  const handleQuantityChange = (event) => {
    setQuantity(parseInt(event.target.value, 10) || 0);
  }

  const handleFetchData = async () => {
    try {
      const response = await axios.get(`/api/stocks/chart?ticker=${ticker}`);
      setChartData(response.data);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      alert('Failed to fetch chart data.');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Trade</Typography>
      <TextField label="Ticker" value={ticker} onChange={handleTickerChange} />
      <TextField label="Quantity" type="number" value={quantity} onChange={handleQuantityChange} />
      <Button variant="contained" color="primary" onClick={handleBuy}>Buy</Button>
      <Button variant="contained" color="secondary" onClick={handleSell}>Sell</Button>
      <Button variant="contained" onClick={handleFetchData}>Get Chart Data</Button>

      {chartData.length > 0 && (
        <StockChart data={chartData} />
      )}
    </Box>
  );
};

export default TradePage;
