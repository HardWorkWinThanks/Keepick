import { LoginWidget } from "@/widgets/auth";

export function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* 왼쪽 섹션: 로그인 폼 */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-gray-50">
        <LoginWidget />
      </div>

      {/* 오른쪽 섹션: 이미지 그리드 */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://plus.unsplash.com/premium_photo-1696972235468-f2c019227dc0?..."
          alt="Sample background image"
        />
      </div>
    </div>
  );
}
