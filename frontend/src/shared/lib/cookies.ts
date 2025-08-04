  // 쿠키에서 JWT 토큰 읽기
  export const getJwtFromCookie = (): string | null => {
    if (typeof document === "undefined") return null; // SSR 체크

    const cookies = document.cookie.split(';');
    const jwtCookie = cookies.find(cookie =>
      cookie.trim().startsWith('jwt=')
    );

    return jwtCookie ? jwtCookie.split('=')[1] : null;
  };

  // 쿠키에서 JWT 삭제 (로그아웃용)
  export const clearJwtCookie = () => {
    if (typeof document === "undefined") return;

    document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };