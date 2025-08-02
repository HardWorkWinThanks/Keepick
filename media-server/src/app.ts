import express from "express";

class Application {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json());
  }

  private setupRoutes() {
    this.app.get("/", (req, res) => {
      res.send("Hello from Express!");
    });
  }

  public async start() {
    const PORT = process.env.PORT || 3000;

    this.app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  }
}

// 애플리케이션 시작
const app = new Application();
app.start().catch((error) => {
  console.error("💥 Failed to start application:", error);
  process.exit(1);
});