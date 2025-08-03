const isProduction = process.env.NODE_ENV === "production";

// 상수 정의
const FRONT_URL = process.env.FRONT_VERCEL_URL
const BASE_URL = process.env.BASE_URL
const PRODUCTION_PORT = Number(process.env.PORT);
const SSL_KEY_PATH = "certs/server.key";
const SSL_CERT_PATH = "certs/server.cert";

export const serverConfig = {
  port: isProduction ? PRODUCTION_PORT : 8443,
  host: isProduction ? BASE_URL : "localhost",
  cors: {
    origin: [
      BASE_URL,
      FRONT_URL,
      "https://172.30.1.82:3000",
      "https://localhost:3000"
    ].filter((url): url is string => !!url),
    credentials: true,
    methods: ["GET", "POST"],
  },
  ssl: isProduction
    ? null  // prod 환경에서는 nginx 프록시 서버를 이용
    : {
      keyPath: SSL_KEY_PATH,
      certPath: SSL_CERT_PATH,
    },
};