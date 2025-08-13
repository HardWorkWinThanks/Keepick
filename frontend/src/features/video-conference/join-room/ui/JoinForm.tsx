"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/shadcn/button"; // shadcn/ui 또는 유사 UI 라이브러리 가정
import { Input } from "@/shared/ui/shadcn/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";

interface JoinFormProps {
  onJoin: (userName: string) => void;
  isLoading: boolean;
  error: string | null;
}

export const JoinForm = ({ onJoin, isLoading, error }: JoinFormProps) => {
  const [userName, setUserName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`[JoinForm] 폼 제출됨. 사용자 이름: ${userName}`);

    if (userName.trim() && !isLoading) {
      console.log("[JoinForm] onJoin prop 호출 직전.");
      onJoin(userName.trim());
    }
  };

  return (
    <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>그룹 통화 참여</CardTitle>
          <CardDescription>
            사용할 이름을 입력하고 통화에 참여하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            id="userName"
            placeholder="이름을 입력하세요"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            disabled={isLoading}
            required
            className="bg-gray-700 border-gray-600 placeholder-gray-400 text-white"
          />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !userName.trim()}
          >
            {isLoading ? "참여 중..." : "참여하기"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
