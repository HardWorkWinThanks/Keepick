import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/model/authSlice";
import { userReducer } from "@/entities/user";
import photoSelectionReducer from "@/features/photo-gallery/model/photoSelectionSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      user: userReducer,
      photoSelection: photoSelectionReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ["persist/PERSIST"],
        },
      }),
    devTools: true
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
