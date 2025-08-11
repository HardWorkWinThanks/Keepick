import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Photo } from "@/entities/photo";

interface PhotoSelectionState {
  selectedPhotos: Photo[];
  isFromGallery: boolean;
}

const initialState: PhotoSelectionState = {
  selectedPhotos: [],
  isFromGallery: false,
};

const photoSelectionSlice = createSlice({
  name: "photoSelection",
  initialState,
  reducers: {
    setSelectedPhotos: (state, action: PayloadAction<Photo[]>) => {
      state.selectedPhotos = action.payload;
    },
    addSelectedPhoto: (state, action: PayloadAction<Photo>) => {
      const exists = state.selectedPhotos.some(photo => photo.id === action.payload.id);
      if (!exists) {
        state.selectedPhotos.push(action.payload);
      }
    },
    removeSelectedPhoto: (state, action: PayloadAction<string>) => {
      state.selectedPhotos = state.selectedPhotos.filter(photo => photo.id !== action.payload);
    },
    clearSelectedPhotos: (state) => {
      state.selectedPhotos = [];
    },
    setIsFromGallery: (state, action: PayloadAction<boolean>) => {
      state.isFromGallery = action.payload;
    },
  },
});

export const {
  setSelectedPhotos,
  addSelectedPhoto,
  removeSelectedPhoto,
  clearSelectedPhotos,
  setIsFromGallery,
} = photoSelectionSlice.actions;

export default photoSelectionSlice.reducer;