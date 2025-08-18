
import dotenv from "dotenv";
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// 상수 정의
const BASE_URL = process.env.BASE_URL
const DEV_URL = process.env.DEV_URL
const DEV_ORIGIN = process.env.DEV_ORIGIN
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN
const FRONTEND_VERCEL_ORIGIN = process.env.FRONTEND_VERCEL_ORIGIN
const SSL_KEY_PATH = "certs/server.key";
const SSL_CERT_PATH = "certs/server.cert";

export const serverConfig = {
  port: 8443,
  host: isProduction ? BASE_URL : DEV_URL,
  cors: {
    origin: [
      DEV_ORIGIN,
      BACKEND_ORIGIN,
      FRONTEND_VERCEL_ORIGIN,
      "https://localhost:3000",
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
  socket: {
    pingTimeout: 60000,
    pingInterval: 25000
  },
  chat: {
    maxMessageLength: 1000,
    maxUsernameLength: 30,
    minUsernameLength: 2,
    maxRoomNameLength: 50,
    defaultRoom: 'general',
    messageHistoryLimit: 100
  }
};