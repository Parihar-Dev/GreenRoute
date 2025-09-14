import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../api/apiClient';

export const getVehicles = createAsyncThunk('vehicles/getVehicles', async(_, { rejectWithValue }) => {
    try {
        const { data } = await apiClient.get('/user/vehicles');
        return data;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

export const addVehicle = createAsyncThunk('vehicles/addVehicle', async(vehicleData, { rejectWithValue }) => {
    try {
        const { data } = await apiClient.post('/user/vehicles', vehicleData);
        return data;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

export const updateVehicle = createAsyncThunk('vehicles/updateVehicle', async({ id, updatedData }, { rejectWithValue }) => {
    try {
        const { data } = await apiClient.put(`/user/vehicles/${id}`, updatedData);
        return data;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
})

export const deleteVehicle = createAsyncThunk('vehicles/deleteVehicle', async(id, { rejectWithValue }) => {
    try {
        await apiClient.delete(`/user/vehicles/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

const vehicleSlice = createSlice({
    name: 'vehicles',
    initialState: {
        items: [],
        status: 'idle',
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getVehicles.pending, (state) => { state.status = 'loading'; })
            .addCase(getVehicles.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(getVehicles.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(addVehicle.fulfilled, (state,action) => {
                state.items.push(action.payload.vehicle);
            })
            .addCase(deleteVehicle.fulfilled, (state,action) => {
                state.items = state.items.filter((item) => item.id !== action.payload);
            })
            .addCase(updateVehicle.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(updateVehicle.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const updatedVehicle = action.payload;
                const index = state.items.findIndex((item) => item.id === updatedVehicle.id);
                if (index !== -1) {
                    state.items[index] = updatedVehicle;
                }
            });
    }
});

export default vehicleSlice.reducer;