import React from 'react';
import { Box, Paper, Grid, Typography, useTheme } from '@mui/material';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const theme = useTheme();

  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      {/* Left side with background image */}
      <Grid
        item
        xs={false}
        sm={4}
        md={7}
        sx={{
          backgroundImage: 'url(https://source.unsplash.com/random?tanzania,finance)',
          backgroundRepeat: 'no-repeat',
          backgroundColor: (t) =>
            t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'white',
            zIndex: 1,
            p: 4,
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
            NEDA Pay Admin Portal
          </Typography>
          <Typography variant="h6" gutterBottom>
            Secure Management of Tanzania Shilling Stablecoin
          </Typography>
          <Typography variant="body1">
            Monitor reserves, manage KYC, and oversee TSHC operations
          </Typography>
        </Box>
      </Grid>

      {/* Right side with form */}
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <Box
          sx={{
            my: 8,
            mx: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <img 
              src="/logo.png" 
              alt="NEDA Pay Logo" 
              style={{ height: 60, marginBottom: 16 }} 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://via.placeholder.com/180x60?text=NEDA+Pay';
              }}
            />
            <Typography component="h1" variant="h5" color="primary" fontWeight="bold">
              Admin Portal
            </Typography>
          </Box>
          {children}
        </Box>
      </Grid>
    </Grid>
  );
};

export default AuthLayout;
