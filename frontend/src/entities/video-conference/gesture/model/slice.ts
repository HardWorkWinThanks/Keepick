// src/entities/video-conference/gesture/model/slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface GestureState {
  isStaticGestureOn: boolean;
  isDynamicGestureOn: boolean;
}

const initialState: GestureState = {
  isStaticGestureOn: true,
  isDynamicGestureOn: true,
};

const gestureSlice = createSlice({
  name: "gesture",
  initialState,
  reducers: {
    toggleStaticGesture: (state) => {
      state.isStaticGestureOn = !state.isStaticGestureOn;
    },
    toggleDynamicGesture: (state) => {
      state.isDynamicGestureOn = !state.isDynamicGestureOn;
    },
  },
});

export const { toggleStaticGesture, toggleDynamicGesture } =
  gestureSlice.actions;
export default gestureSlice.reducer;
