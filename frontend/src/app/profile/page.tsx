'use client';

import { useState } from 'react';
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VersatileInput } from '@/components/ui/versatile-input';
import { NaverIcon } from '@/shared/assets/NaverIcon';

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

  const handleNicknameApply = () => {
    setUserProfile({
      ...userProfile,
      nickname: nicknameInput
    });
    alert('닉네임이 변경되었습니다.');
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
                <div className="flex items-start space-x-6">
                  <div className="flex flex-col items-center space-y-3">
                    <img
                      src={userProfile.profileImage}
                      alt="프로필 사진"
                      className="w-32 h-32 rounded-full object-cover"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                      onClick={handleProfileImageChange}
                    >
                      프로필 사진 변경
                    </Button>
                  </div>
                  <div className="flex-1 space-y-4">
                    <VersatileInput
                      label="이메일"
                      labelIcon={<NaverIcon />}
                      value={userProfile.email}
                      readOnly={true}
                    />
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
                      showApplyButton={true}
                      applyButtonText="적용하기"
                      onApplyClick={handleNicknameApply}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI 인식 프로필 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-gray-900">AI 인식 프로필</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-6">
                  <div className="flex flex-col items-center space-y-3">
                    <img
                      src={userProfile.aiProfileImage}
                      alt="AI 인식 프로필 사진"
                      className="w-32 h-32 rounded-full object-cover"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                      onClick={handleAiProfileImageChange}
                    >
                      AI 인식 프로필 변경
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
                      className="mt-3 bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
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