import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux'
import { checkAuth } from './features/authSlice';
import './App.css';

import MainLayout from './components/MainLayout';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import Home from './pages/Home'
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import MyGarage from './pages/MyGarage';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path='/' element={<Home />} />
          <Route path='/register' element={<Register />} />
          <Route path='/login' element={<Login />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path='/dashboard' element={<Dashboard />} />
          <Route path='/garage' element={<MyGarage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
