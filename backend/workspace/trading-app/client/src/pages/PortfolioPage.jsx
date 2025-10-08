import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Typography, List, ListItem, ListItemText, Box } from '@mui/material';

const PortfolioPage = () => {
  const [portfolio, setPortfolio] = useState([]);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await axios.get('/api/portfolio');
        setPortfolio(response.data);
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      }
    };

    fetchPortfolio();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Portfolio</Typography>
      <List>
        {portfolio.map((item) => (
          <ListItem key={item.ticker}>
            <ListItemText
              primary={item.ticker}
              secondary={`Quantity: ${item.quantity}`}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default PortfolioPage;
