import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} My Portfolio</p>
    </footer>
  );
}

export default Footer;
