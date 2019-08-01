import { Request, Response, Headers, AbortController } from "./node";

describe("node", () => {
  describe("headers", () => {
    it("should init from an array", () => {
      const headers = new Headers([["Number", 1] as [string, number]]);

      expect(headers.get("Number")).toEqual("1");
      expect(headers.get("Other")).toEqual(null);
    });

    it("should init from an object", () => {
      const headers = new Headers({
        Number: 1,
        String: "Two",
        Strings: ["One", "Two", "Three"],
        Numbers: [1, 2, 3]
      });

      expect(headers.get("Number")).toEqual("1");
      expect(headers.get("String")).toEqual("Two");
      expect(headers.get("Numbers")).toEqual("1");
      expect(headers.get("Strings")).toEqual("One");
      expect(headers.get("Other")).toEqual(null);
    });
  });

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

      it("should initialize default headers", () => {
        const req = new Request("", {
          body: "test"
        });

        expect(req.headers.get("Content-Type")).toEqual("text/plain");
        expect(req.headers.get("Content-Length")).toEqual("4");
      });

      it("should skip default header initialization", () => {
        const req = new Request("/", {
          body: "test",
          omitDefaultHeaders: true
        });

        expect(req.headers.get("Content-Length")).toEqual(null);

        const clonedReq = req.clone();

        expect(clonedReq.headers.get("Content-Length")).toEqual(null);

        const initReq = new Request(req);

        expect(initReq.headers.get("Content-Length")).toEqual(null);
      });

      it("should clone new header instances", () => {
        const req = new Request("/", {
          headers: {
            "Test": "true"
          }
        })

        expect(req.headers.get("test")).toEqual("true");

        const clonedReq = req.clone();
        clonedReq.headers.set("Test", "false");

        expect(req.headers.get("test")).toEqual("true");
        expect(clonedReq.headers.get("test")).toEqual("false");

        const initReq = new Request(req);
        initReq.headers.set("Test", "false");

        expect(req.headers.get("test")).toEqual("true");
        expect(initReq.headers.get("test")).toEqual("false");
      })
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
      });

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
      expect(req.url).toEqual(reqClone.url);
      expect(req.method).toEqual(reqClone.method);
      expect(req.headers).toEqual(reqClone.headers);
      expect(req.$rawBody).toEqual(reqClone.$rawBody);

      const fn = jest.fn();

      reqClone.signal.on("abort", fn);
      req.signal.emit("abort");

      expect(fn).toHaveBeenCalled();
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

      expect(res.status).toEqual(resClone.status);
      expect(res.statusText).toEqual(resClone.statusText);
      expect(res.headers).toEqual(resClone.headers);
      expect(res.$rawBody).toEqual(resClone.$rawBody);
    });
  });
});
