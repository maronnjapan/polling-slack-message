declare const Buffer: any;
declare function require(name: string): any;

export function serve(opts: { fetch: (req: Request) => Promise<Response> | Response; port: number }) {
  const http = require("node:http");
  const server = http.createServer(async (incoming: any, outgoing: any) => {
    const chunks: any[] = [];
    incoming.on("data", (chunk: any) => chunks.push(chunk));
    incoming.on("end", async () => {
      const body = chunks.length ? Buffer.concat(chunks) : undefined;
      const req = new Request(`http://127.0.0.1:${opts.port}${incoming.url}`, { method: incoming.method, body });
      const res = await opts.fetch(req);
      outgoing.statusCode = res.status;
      res.headers.forEach((value, key) => outgoing.setHeader(key, value));
      outgoing.end(Buffer.from(await res.arrayBuffer()));
    });
  });
  server.listen(opts.port, "127.0.0.1");
  return server;
}
