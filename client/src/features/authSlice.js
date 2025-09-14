import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../api/apiClient';

export const loginUser = createAsyncThunk('auth/login', async({ email, password }, {rejectWithValue }) => {
    try {
        const response = await apiClient.post('/auth/login', { email, password });
        const { user, token } = response.data;
        localStorage.setItem('userToken', token);
        return user;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

export const checkAuth = createAsyncThunk('auth/checkAuth', async(_, { rejectWithValue }) => {
    try {
        const token = localStorage.getItem('userToken');
        if (!token) return rejectWithValue('No token found');
        const { data } = await apiClient.get('/user/profile');
        return data;
    } catch (error) {
        localStorage.removeItem('userToken');
        return rejectWithValue(error.response.data);
    }
});

const initialState = {
    user: null,
    token: localStorage.getItem('userToken') || null,
    status: 'idle',
    error: null
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            localStorage.removeItem('userToken');
            state.user = null;
            state.token = null;
            state.status = 'idle';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.user = action.payload;
                state.token = localStorage.getItem('userToken');
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(checkAuth.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.user = action.payload;
            })
            .addCase(checkAuth.rejected, (state) => {
                state.status = 'idle';
                state.user = null;
                state.token = null;
            });
    },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;