// src/shared/hooks/redux.ts
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "@/shared/config/store"; // 우리 스토어에서 정의한 타입들을 가져옵니다.

// useDispatch 대신 사용할 커스텀 훅
// 이 훅은 우리 앱의 AppDispatch 타입을 알고 있으므로, Thunk를 디스패치해도 타입 에러가 발생하지 않습니다.
export const useAppDispatch = () => useDispatch<AppDispatch>();

// useSelector도 타입이 적용된 버전으로 만들어두면 편리합니다.
// 매번 (state: RootState)라고 타입을 써줄 필요가 없어집니다.
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
