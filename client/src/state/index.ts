import { createSlice, PayloadAction } from '@reduxjs/toolkit';


export interface InitialStateTypes {
    isSidebarCollapsed: boolean;
    isDarkMode: boolean;
    selectedAccountingDate: string;
}

const initialState: InitialStateTypes = {
    isSidebarCollapsed: false,
    isDarkMode: false,
    selectedAccountingDate: new Date().toISOString().split('T')[0],
}

export const gloabalSlice = createSlice({
    name: 'global',
    initialState,
    reducers: {
        setIsSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
            state.isSidebarCollapsed = action.payload
        },
        setIsDarkMode: (state, action: PayloadAction<boolean>) => {
            state.isDarkMode = action.payload
        },
        setSelectedAccountingDate: (state, action: PayloadAction<string>) => {
            state.selectedAccountingDate = action.payload;
        }
    }
});

export const { setIsSidebarCollapsed, setIsDarkMode, setSelectedAccountingDate } = gloabalSlice.actions;

export default gloabalSlice.reducer;