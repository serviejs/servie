import { Request, Response, Headers, AbortController } from "./node";

describe("node", () => {
  describe("request", () => {
    it("should contain base properties", () => {
      const req = new Request("/test");

      expect(req.url).toBe("/test");
      expect(req.headers).toBeInstanceOf(Headers);
      expect(req.trailer).toBeInstanceOf(Promise); // tslint:disable-line
    });

    describe("headers", () => {
      it("should accept instance of headers", () => {
        const headers = new Headers([["Test", "1"] as [string, string]]);
        const req = new Request("/", { headers });

        expect(req.headers).not.toBe(headers);
        expect(req.headers.get("Test")).toEqual("1");
        expect(req.headers.get("Other")).toEqual(null);
      });

      it("should accept a map of headers", () => {
        const req = new Request("/", {
          headers: { Test: "1" }
        });

        expect(req.headers.get("Test")).toEqual("1");
        expect(req.headers.get("Other")).toEqual(null);
      });
    });

    describe("body", () => {
      it("should allow null bodies to be re-used", async () => {
        const req = new Request("/", { body: null });

        expect(await req.text()).toEqual("");
        expect(await req.text()).toEqual(""); // Second read.
      });

      it("should allow undefined bodies to be re-used", async () => {
        const req = new Request("/", { body: undefined });

        expect(await req.text()).toEqual("");
        expect(await req.text()).toEqual(""); // Second read.
      })

      describe("init headers", () => {
        it("should initialize from string body", () => {
          const req = new Request("/", { body: "test" });

          expect(req.headers.get("Content-Type")).toEqual("text/plain");
        });
      });
    });

    it("should be able to clone", () => {
      const req = new Request("/");
      const reqClone = new Request(req);

      expect(req).not.toBe(reqClone);
      expect(req).toEqual(reqClone);
    });
  });

  describe("response", () => {
    it("should create 200 responses by default", () => {
      const res = new Response(null, { statusText: "Awesome job!" });

      expect(res.status).toBe(200);
      expect(res.ok).toBe(true);
      expect(res.statusText).toBe("Awesome job!");
    });

    it("should create custom status code responses", async () => {
      const res = new Response("test", { status: 404 });

      expect(res.status).toBe(404);
      expect(res.ok).toBe(false);
      expect(res.statusText).toBe("");
      expect(await res.text()).toBe("test");
    });

    it("should be able to clone", () => {
      const res = new Response(null, { status: 201 });
      const resClone = new Response(null, res);

      expect(res).not.toBe(resClone);
      expect(res).toEqual(resClone);
    });
  });
});
