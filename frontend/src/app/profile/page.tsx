'use client';

import { useState } from 'react';
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VersatileInput } from '@/components/ui/versatile-input';

interface UserProfile {
  profileImage: string;
  email: string;
  socialType: 'naver' | 'kakao' | 'google';
  nickname: string;
  aiProfileImage: string;
}

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    profileImage: '/dummy/dummy1.jpg',
    email: 'user@example.com',
    socialType: 'naver',
    nickname: '사용자123',
    aiProfileImage: '/dummy/dummy2.jpg'
  });

  const [nicknameInput, setNicknameInput] = useState(userProfile.nickname);

  const handleNicknameCheck = async (nickname: string) => {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  };

  const handleProfileImageChange = () => {
    alert('프로필 사진 변경 기능');
  };

  const handleAiProfileImageChange = () => {
    alert('AI 인식 프로필 사진 변경 기능');
  };

  const getSocialTypeLabel = (type: string) => {
    switch (type) {
      case 'naver': return '네이버';
      case 'kakao': return '카카오';
      case 'google': return '구글';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "ml-0"
        }`}
      >
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-2xl font-bold mb-6 text-gray-900">나의 프로필</h1>
            
            {/* 기본 프로필 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-gray-900">기본 프로필</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={userProfile.profileImage}
                      alt="프로필 사진"
                      className="w-32 h-32 rounded-full object-cover"
                    />
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 w-8 h-8 p-0 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg flex items-center justify-center" 
                      onClick={handleProfileImageChange}
                    >
                      <span className="text-white text-sm">📷</span>
                    </Button>
                  </div>
                  <div className="flex-1 space-y-4">
                    <VersatileInput
                      label="이메일"
                      value={userProfile.email}
                      readOnly={true}
                      inputClassName="bg-gray-50"
                    />
                    <div>
                      <Badge variant="secondary" className="text-sm">
                        {getSocialTypeLabel(userProfile.socialType)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <VersatileInput
                  label="닉네임"
                  value={nicknameInput}
                  onChange={setNicknameInput}
                  placeholder="닉네임을 입력하세요"
                  showActionButton={true}
                  actionButtonText="중복체크"
                  actionButtonLoadingText="확인중..."
                  onActionClick={handleNicknameCheck}
                  successMessage="사용 가능한 닉네임입니다."
                  errorMessage="이미 사용중인 닉네임입니다."
                />
              </CardContent>
            </Card>

            {/* AI 인식 프로필 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">AI 인식 프로필</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img
                      src={userProfile.aiProfileImage}
                      alt="AI 인식 프로필"
                      className="w-32 h-32 rounded-full object-cover"
                    />
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 w-8 h-8 p-0 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg flex items-center justify-center" 
                      onClick={handleAiProfileImageChange}
                    >
                      <span className="text-white text-sm">📷</span>
                    </Button>
                  </div>
                  <div className="flex-1">
                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                      <p className="text-sm text-pink-800">
                        AI 인식 프로필은 얼굴 프로필 사진 인식을 위한 사진입니다
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="mt-3 bg-pink-100 hover:bg-pink-200 text-pink-800"
                    >
                      적절한 사진입니다!
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}