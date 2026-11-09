import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import test from "node:test";

import {
  DEFAULT_TEAM,
  fetchTeamSnapshot,
  TeamApiError,
} from "../lib/team-api.ts";

const info = {
  groupName: "K6 Buổi tối",
  description: "Cùng xây dựng và triển khai ứng dụng Fullstack",
  status: "running",
  serverTime: "2026-11-08T13:30:00Z",
};

const members = [
  { name: "Minh" },
  { name: "Lợi" },
  { name: "Tuấn" },
  { name: "Hoàng Anh" },
];

function json(response, body, status = 200) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

async function startApi(t, handler) {
  const requests = [];
  const server = createServer((request, response) => {
    requests.push({ method: request.method, path: request.url });
    if (handler) {
      handler(request, response);
    } else if (request.url === "/api/info") {
      json(response, info);
    } else if (request.url === "/api/members") {
      json(response, { members });
    } else {
      json(response, { message: "Not found" }, 404);
    }
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
  );

  return { baseUrl: `http://127.0.0.1:${server.address().port}`, requests };
}

function hasCode(code) {
  return (error) => error instanceof TeamApiError && error.code === code;
}

test("mock mode labels its source and does not contact the backend", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", () => {
    throw new Error("Mock mode must not make a network request");
  });

  const snapshot = await fetchTeamSnapshot({
    useMock: true,
    baseUrl: "https://unused.invalid",
  });

  assert.equal(snapshot.source, "mock");
  assert.equal(snapshot.info.groupName, DEFAULT_TEAM.groupName);
  assert.deepEqual(snapshot.members, DEFAULT_TEAM.members);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("live mode gets both Java endpoints and preserves server data", async (t) => {
  const api = await startApi(t);
  const snapshot = await fetchTeamSnapshot({
    useMock: false,
    baseUrl: `${api.baseUrl}/`,
  });

  assert.equal(snapshot.source, "api");
  assert.deepEqual(snapshot.info, info);
  assert.deepEqual(snapshot.members, members);
  assert.deepEqual(
    api.requests.sort((a, b) => a.path.localeCompare(b.path)),
    [
      { method: "GET", path: "/api/info" },
      { method: "GET", path: "/api/members" },
    ],
  );
});

test("HTTP failures reject without falling back to sample data", async (t) => {
  const api = await startApi(t, (request, response) => {
    if (request.url === "/api/info") {
      json(response, { message: "Service unavailable" }, 503);
    } else {
      json(response, { members });
    }
  });

  await assert.rejects(
    () => fetchTeamSnapshot({ useMock: false, baseUrl: api.baseUrl }),
    hasCode("http"),
  );
});

const invalidResponses = [
  {
    name: "malformed JSON",
    respond: (request, response) => {
      if (request.url === "/api/info") {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end("{broken");
      } else {
        json(response, { members });
      }
    },
  },
  {
    name: "missing info fields",
    respond: (request, response) =>
      json(response, request.url === "/api/info" ? { status: "running" } : { members }),
  },
  {
    name: "invalid server time",
    respond: (request, response) =>
      json(
        response,
        request.url === "/api/info"
          ? { ...info, serverTime: "not-a-timestamp" }
          : { members },
      ),
  },
  {
    name: "members returned as strings instead of objects",
    respond: (request, response) =>
      json(response, request.url === "/api/info" ? info : { members: ["Minh"] }),
  },
  {
    name: "member name is empty",
    respond: (request, response) =>
      json(
        response,
        request.url === "/api/info"
          ? info
          : { members: [{ name: "   " }] },
      ),
  },
];

for (const scenario of invalidResponses) {
  test(`invalid API contract: ${scenario.name}`, async (t) => {
    const api = await startApi(t, scenario.respond);
    await assert.rejects(
      () => fetchTeamSnapshot({ useMock: false, baseUrl: api.baseUrl }),
      hasCode("invalid"),
    );
  });
}

test("an empty member list is valid live data with a count of zero", async (t) => {
  const api = await startApi(t, (request, response) => {
    json(response, request.url === "/api/info" ? info : { members: [] });
  });
  const snapshot = await fetchTeamSnapshot({ useMock: false, baseUrl: api.baseUrl });

  assert.equal(snapshot.source, "api");
  assert.deepEqual(snapshot.members, []);
  assert.equal(snapshot.members.length, 0);
});

test("a stopped backend produces a network error instead of sample data", async () => {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  await new Promise((resolve) => server.close(resolve));

  await assert.rejects(
    () => fetchTeamSnapshot({ useMock: false, baseUrl }),
    hasCode("network"),
  );
});

test("an unresponsive backend times out so the user can retry", { timeout: 2000 }, async (t) => {
  const api = await startApi(t, () => {
    // Leave both responses open to exercise the client's timeout and cleanup.
  });

  await assert.rejects(
    () => fetchTeamSnapshot({ useMock: false, baseUrl: api.baseUrl, timeoutMs: 40 }),
    hasCode("timeout"),
  );
});
