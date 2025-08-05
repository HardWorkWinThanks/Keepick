// src/app/invite/[inviteToken]/page.tsx

import Link from "next/link";

// 1. props 타입에서 searchParams를 완전히 제거합니다.
//    이제 이 컴포넌트는 params 객체만 신경 씁니다.
interface InvitePageProps {
  params: {
    inviteToken: string;
  };
}

// 2. 컴포넌트가 받는 props에서 searchParams를 제거합니다.
export default function InvitePage({ params }: InvitePageProps) {
  const { inviteToken } = params;

  // inviteToken은 사용되므로 경고가 발생하지 않습니다.
  console.log("초대 토큰:", inviteToken);

  const playStoreUrl =
    "https://play.google.com/store/apps/details?id=com.ssafy.keepick";

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>KeePick 그룹 초대</h1>
      <p>초대에 응하려면 KeePick 앱이 필요합니다.</p>
      <p>아래 버튼을 눌러 앱을 설치하거나 실행해주세요.</p>
      <br />
      <Link href={playStoreUrl} passHref>
        <button
          style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
        >
          Google Play Store로 이동
        </button>
      </Link>
    </div>
  );
}
