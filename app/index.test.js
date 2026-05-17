process.env.APP_VERSION = "1.0.0";
const { app, server } = require("./index");
const request = require("supertest");

afterAll(() => server.close());

describe("GET /", () => {
  test("returns status ok", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("GET /health", () => {
  test("returns healthy", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("healthy");
  });
});

describe("GET /search", () => {
  test("returns query in response", async () => {
    const res = await request(app).get("/search?q=test");
    expect(res.statusCode).toBe(200);
    expect(res.body.query).toBe("test");
  });

  test("handles empty query", async () => {
    const res = await request(app).get("/search");
    expect(res.statusCode).toBe(200);
    expect(res.body.results).toEqual([]);
  });
});

describe("Security headers", () => {
  test("helmet sets X-Content-Type-Options", async () => {
    const res = await request(app).get("/");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  test("helmet sets X-Frame-Options", async () => {
    const res = await request(app).get("/");
    expect(res.headers["x-frame-options"]).toBeDefined();
  });
});
