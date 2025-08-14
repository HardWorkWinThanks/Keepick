import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GalleryPhoto } from "@/entities/photo";

interface PhotoSelectionState {
  selectedPhotos: GalleryPhoto[];
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
    setSelectedPhotos: (state, action: PayloadAction<GalleryPhoto[]>) => {
      state.selectedPhotos = action.payload;
    },
    addSelectedPhoto: (state, action: PayloadAction<GalleryPhoto>) => {
      const exists = state.selectedPhotos.some(photo => photo.id === action.payload.id);
      if (!exists) {
        state.selectedPhotos.push(action.payload);
      }
    },
    removeSelectedPhoto: (state, action: PayloadAction<number>) => {
      state.selectedPhotos = state.selectedPhotos.filter(photo => photo.id !== action.payload);
    },
    toggleSelectedPhoto: (state, action: PayloadAction<GalleryPhoto>) => {
      const existingIndex = state.selectedPhotos.findIndex(photo => photo.id === action.payload.id);
      if (existingIndex >= 0) {
        state.selectedPhotos.splice(existingIndex, 1);
      } else {
        state.selectedPhotos.push(action.payload);
      }
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
  toggleSelectedPhoto,
  clearSelectedPhotos,
  setIsFromGallery,
} = photoSelectionSlice.actions;

export default photoSelectionSlice.reducer;