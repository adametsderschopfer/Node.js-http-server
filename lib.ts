import { ServerResponse, IncomingMessage } from "http";
import qs from "querystring";

export type Context = {
  req: Request;
  res: Response;
};

enum Methods {
  GET = "GET",
  POST = "POST",
  DELETE = "DELETE",
  PUT = "PUT",
  HEAD = "HEAD",
  PATCH = "PATCH",
}

export interface Request extends IncomingMessage {
  body?: {} | undefined;
}

export interface Response extends ServerResponse{}

class Application {
  private req: Request;
  private res: Response;
  private ctx: Context;

  constructor(req: Request, res: Response) {
    this.req = req;
    this.res = res;
    this.ctx = { req: this.req, res: this.res };
  }

  public use(...callbacks: Function[]) {
    callbacks.forEach((callback) => callback.bind(this)(this.ctx));
    return this;
  }

  public get(path: string | undefined, ...callbacks: Function[]) {
    if (this.req.method === Methods.GET) {
      if (path === this.req.url) {
        callbacks.forEach(callback => callback(this.ctx))
      }
    }
    return this;
  }

  public post(path: string | undefined, ...callbacks: Function[]) {
    let preBody: string = "";

    this.ctx.req.on("data", (_body) => {
      preBody = _body;

      if (_body.length > 1e7) {
        _body.writeHead(413, "Request Entity Too Large", {
          "Content-Type": "text/html",
        });
        _body.end(
          "<!doctype html><html><head><title>413</title></head><body>413: Request Entity Too Large</body></html>"
        );
      }
    });

    this.ctx.req.on("end", () => {
      this.ctx.req.body = { ...qs.parse(preBody.toString()) };

      if (this.req.method === Methods.POST) {
        if (path === this.req.url) {
          callbacks.forEach((cb) => cb.bind(this)(this.ctx));
        }
      }
    });

    return this;
  }
}

export default Application;
