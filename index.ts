import cluster from "cluster";
import http from "http";
import os from "os";

import Application, { Context, Response, Request } from "./lib";

const PORT = process.env.PORT || 8080;
const PID = process.pid;
const CPUsCount = os.cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < CPUsCount - 1; i++) {
    const worker = cluster.fork();
    worker.on("exit", () => {
      console.log(`Worker\'s died. PID: ${worker.process.pid}.`);
      cluster.fork();
    });
  }
} else if (cluster.isWorker) {
  http
    .createServer((req: Request, res: Response) => {
      const app = new Application(req, res);

      app
        .get("/", ({ req, res }: Context) => {
          res.end(req.url); 
        })
        .get("/about", ({ req, res }: Context) => {
          res.end("about");
        })
        .post("/", ({ req, res }: Context) => {
          console.log(req.body);
          res.end(JSON.stringify("asd"));
        });
    })
    .listen(PORT, () => {
      console.log(`Server started. Port: ${PORT}. PID: ${PID}.`);
    });
}
