export type { RootState, AppDispatch, AppStore } from "./store";
export { useAppDispatch, useAppSelector } from "./hooks";
export { Providers } from "./Providers";
export { default as StoreProvider } from "./StoreProvider";
export { default as QueryProvider } from "./QueryProvider";
export { makeStore } from "./store";
export const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "https://i13d207.p.ssafy.io";
