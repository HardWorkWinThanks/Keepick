// server.js
const { createServer } = require("https");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// HTTPS 옵션: 3단계에서 생성한 인증서 파일 경로를 지정합니다.
const httpsOptions = {
  key: fs.readFileSync(path.resolve(__dirname, "certs/localhost-key.pem")),
  cert: fs.readFileSync(path.resolve(__dirname, "certs/localhost.pem")),
};

const port = 3000; // 원하는 포트 번호

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> 🚀 Ready on https://localhost:${port}`);
  });
});
