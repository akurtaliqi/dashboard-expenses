import { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer, List, ListItem, ListItemText, Avatar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/auth';

function NavBar({ toggleTheme, mode }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const drawerContent = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        Expense Tracker
      </Typography>
      {user && (
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: 'primary.main', mb: 1 }}>{user.email[0].toUpperCase()}</Avatar>
          <Typography variant="body2">{user.email}</Typography>
        </Box>
      )}
      <List>
        <ListItem button component={Link} to="/">
          <ListItemText primary="Home" />
        </ListItem>
        {role === 'admin' && (
          <ListItem button component={Link} to="/add-expense">
            <ListItemText primary="Add Expense" />
          </ListItem>
        )}
        <ListItem button onClick={handleLogout}>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <AppBar position="static">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Expense Tracker
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, ml: 2 }}>
            {user && (
              <>
                <Button color="inherit" component={Link} to="/">Home</Button>
                {role === 'admin' && <Button color="inherit" component={Link} to="/add-expense">Add Expense</Button>}
              </>
            )}
            {!user && <Button color="inherit" component={Link} to="/login">Login</Button>}
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {user && (
            <Box display="flex" alignItems="center" sx={{ mr: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>{user.email[0].toUpperCase()}</Avatar>
              <Typography variant="body2">{user.email}</Typography>
            </Box>
          )}
          <IconButton color="inherit" onClick={toggleTheme}>
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          {user && <Button color="inherit" onClick={handleLogout}>Logout</Button>}
        </Box>
      </Toolbar>
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{ display: { xs: 'block', sm: 'none' } }}
      >
        {drawerContent}
      </Drawer>
    </AppBar>
  );
}

export default NavBar;