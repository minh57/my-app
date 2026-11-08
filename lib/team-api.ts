export type TeamMember = { name: string };

export type TeamInfo = {
  groupName: string;
  description: string;
  status: string;
  serverTime: string;
};

export type TeamSnapshot = {
  info: TeamInfo;
  members: TeamMember[];
  source: "mock" | "api";
};

export const DEFAULT_TEAM = {
  groupName: "K6 Buổi tối",
  description: "Cùng xây dựng và triển khai ứng dụng Fullstack",
  members: [
    { name: "Minh" },
    { name: "Lợi" },
    { name: "Tuấn" },
    { name: "Hoàng Anh" },
  ],
} satisfies { groupName: string; description: string; members: TeamMember[] };

export class TeamApiError extends Error {
  code: "http" | "invalid" | "network" | "timeout";

  constructor(code: TeamApiError["code"], message: string) {
    super(message);
    this.name = "TeamApiError";
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isTeamInfo(value: unknown): value is TeamInfo {
  return (
    isRecord(value) &&
    isText(value.groupName) &&
    isText(value.description) &&
    isText(value.status) &&
    isText(value.serverTime) &&
    // Require an explicit timezone to avoid interpreting server time as local time.
    /(?:Z|[+-]\d{2}:\d{2})$/i.test(value.serverTime) &&
    Number.isFinite(Date.parse(value.serverTime))
  );
}

function isMembersResponse(value: unknown): value is { members: TeamMember[] } {
  return (
    isRecord(value) &&
    Array.isArray(value.members) &&
    value.members.every(
      (member) =>
        isRecord(member) && isText(member.name),
    )
  );
}

async function fetchJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    signal,
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new TeamApiError("http", `Backend trả về lỗi HTTP ${response.status}. Vui lòng thử lại.`);
  }
  try {
    return await response.json();
  } catch (error) {
    if (signal.aborted) throw error;
    throw new TeamApiError("invalid", "Backend chưa trả về dữ liệu JSON hợp lệ.");
  }
}

export async function fetchTeamSnapshot({
  useMock,
  baseUrl,
  timeoutMs = 8_000,
}: {
  useMock: boolean;
  baseUrl: string;
  timeoutMs?: number;
}): Promise<TeamSnapshot> {
  if (useMock) {
    // A fixed, explicitly labeled fixture, never a simulated live server clock.
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      info: {
        groupName: DEFAULT_TEAM.groupName,
        description: DEFAULT_TEAM.description,
        status: "running",
        serverTime: "2026-11-08T13:30:00Z",
      },
      members: DEFAULT_TEAM.members.map((member) => ({ ...member })),
      source: "mock",
    };
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const root = baseUrl.replace(/\/+$/, "");
    const [info, membersResponse] = await Promise.all([
      fetchJson(`${root}/api/info`, controller.signal),
      fetchJson(`${root}/api/members`, controller.signal),
    ]);
    if (!isTeamInfo(info) || !isMembersResponse(membersResponse)) {
      throw new TeamApiError("invalid", "Dữ liệu API chưa đúng định dạng. Vui lòng kiểm tra hợp đồng FE–BE.");
    }
    return { info, members: membersResponse.members.map(({ name }) => ({ name })), source: "api" };
  } catch (error) {
    if (timedOut) {
      throw new TeamApiError("timeout", "Backend phản hồi quá chậm. Vui lòng thử lại.");
    }
    if (error instanceof TeamApiError) throw error;
    throw new TeamApiError("network", "Chưa kết nối được backend. Hãy kiểm tra backend và thử lại.");
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
}
