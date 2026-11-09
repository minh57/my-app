"use client";

import { useRef, useState } from "react";
import { DEFAULT_TEAM, fetchTeamSnapshot, type TeamSnapshot } from "@/lib/team-api";
import { Icon } from "./icon";

const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const clockFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});
const dayFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function initials(name: string) {
  const words = name.trim().split(/\s+/);
  return words.length === 1
    ? words[0].slice(0, 1).toUpperCase()
    : `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export function TeamHome() {
  const [snapshot, setSnapshot] = useState<TeamSnapshot | null>(null);
  const [phase, setPhase] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const checking = useRef(false);

  const members = snapshot?.members ?? DEFAULT_TEAM.members;
  const info = snapshot?.info;
  const ready = phase === "success" && snapshot !== null;
  const running = info?.status === "running";
  const rosterSource = useMock
    ? "Thông tin nhóm đã thống nhất"
    : !snapshot
      ? "Thông tin giới thiệu · Chưa xác nhận qua API"
      : phase === "success"
        ? "Danh sách đã được xác nhận qua API"
        : "Danh sách từ lần kiểm tra trước · Chưa xác nhận lại";

  async function checkSystem() {
    if (checking.current) return;
    checking.current = true;
    setPhase("loading");
    setError("");
    // Keep the last roster with a source label; metrics are gated by `ready`.
    setCheckedAt(null);
    try {
      setSnapshot(await fetchTeamSnapshot({ useMock, baseUrl }));
      setCheckedAt(new Date());
      setPhase("success");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Có lỗi xảy ra. Vui lòng thử lại.");
      setPhase("error");
    } finally {
      checking.current = false;
    }
  }

  const statusText = phase === "loading"
    ? "Đang kiểm tra…"
    : phase === "error"
      ? "Không kết nối được"
      : ready
        ? running ? (useMock ? "Hoạt động (mẫu)" : "Đang hoạt động") : info?.status
        : "Chưa kiểm tra";

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">Đến nội dung chính</a>
      <header className="site-header">
        <a className="wordmark" href="#" aria-label="K6 Buổi tối — đầu trang">
          <span className="brand-symbol">k6<span>.</span></span>
          <span className="brand-name">K6 Buổi tối<span>HỌC CÙNG NHAU, ĐI XA HƠN</span></span>
        </a>
        <nav aria-label="Điều hướng chính">
          <a href="#members">Thành viên</a>
          <a href="#system">Hệ thống</a>
          <a className="repo-link" href="https://github.com/minh57/my-app" target="_blank" rel="noreferrer">
            GitHub <Icon name="arrow-up" size={15} />
          </a>
        </nav>
      </header>

      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span /> NHÓM THỰC HÀNH FULLSTACK</div>
            <h1 id="hero-title">
              {info?.groupName ?? DEFAULT_TEAM.groupName}
              <span>Cùng học.<br />Cùng xây dựng.</span>
            </h1>
            <p>{info?.description ?? DEFAULT_TEAM.description}.<br className="desktop-break" /> Từ những dòng code đầu tiên đến một sản phẩm chạy thật.</p>
            <a className="hero-cta" href="#members">Gặp gỡ đội ngũ <Icon name="arrow" size={18} /></a>
            <div className="hero-note">
              <span className="mini-avatars" aria-hidden="true">{members.slice(0, 4).map((member, index) => <b key={`${member.name}-${index}`}>{initials(member.name)}</b>)}</span>
              <span>{members.length} thành viên. Một tinh thần đồng đội.</span>
            </div>
          </div>

          <div className="build-visual" aria-label="Hành trình từ viết code đến xây dựng và triển khai ứng dụng">
            <div className="visual-grid" />
            <div className="visual-topline">
              <span><span className="small-dot" /> HÀNH TRÌNH CỦA CHÚNG MÌNH</span>
              <Icon name="branch" size={17} />
            </div>
            <div className="code-window">
              <div className="window-bar"><span /><span /><span /><small>team / together.ts</small></div>
              <div className="code-body" aria-hidden="true">
                <span className="code-comment">{"// Bắt đầu từ tinh thần đồng đội."}</span>
                <p><i>const</i> team = &#123;</p>
                <p className="code-indent">name: <em>&quot;K6 Buổi tối&quot;</em>,</p>
                <p className="code-indent">mindset: <em>&quot;learn by building&quot;</em>,</p>
                <p className="code-indent">betterTogether: <i>true</i></p>
                <p>&#125;;</p>
              </div>
            </div>
            <div className="journey" aria-hidden="true">
              <span><Icon name="code" size={17} /> Code</span><Icon name="arrow" size={15} />
              <span><Icon name="box" size={17} /> Build</span><Icon name="arrow" size={15} />
              <span className="journey-end"><Icon name="server" size={17} /> Deploy</span>
            </div>
            <div className="visual-caption"><span />Mỗi người một thế mạnh. Cùng nhau một sản phẩm.</div>
          </div>
        </section>

        <section className="stack-strip" aria-label="Công nghệ của nhóm">
          <span className="stack-label">TỪ GIAO DIỆN ĐẾN TRIỂN KHAI</span>
          <div>
            <span className="tech"><b className="next-mark">N</b> Next.js</span>
            <span className="tech"><Icon name="code" /> Java <small>/ Spring Boot</small></span>
            <span className="tech"><Icon name="box" /> Docker</span>
            <span className="tech"><Icon name="branch" /> GitHub Actions</span>
          </div>
        </section>

        <div className="workspace-grid">
          <section className="members-section" id="members" aria-labelledby="members-title">
            <div className="section-top">
              <div>
                <span className="section-kicker">01 / CON NGƯỜI</span>
                <h2 id="members-title">Đội ngũ của chúng mình<span className="member-total">{members.length.toString().padStart(2, "0")}</span></h2>
              </div>
              <span className="section-icon"><Icon name="users" size={22} /></span>
            </div>
            <p className="section-description">Chia sẻ kiến thức, cùng giải quyết vấn đề và tiến bộ mỗi ngày.</p>
            <p className="roster-source">{rosterSource}</p>
            <div className="members-grid">
              {members.map((member, index) => (
                <article className="member-card" key={`${member.name}-${index}`}>
                  <div className="member-card-top">
                    <span className={`avatar avatar-${index % 4}`}>{initials(member.name)}</span>
                    <span className="member-number">{(index + 1).toString().padStart(2, "0")} <span>/ K6</span></span>
                  </div>
                  <h3>{member.name}</h3>
                </article>
              ))}
            </div>
            {members.length === 0 && <p className="empty-members">Chưa có thành viên trong dữ liệu backend.</p>}
            <div className="team-footnote">
              <span className="little-spark" aria-hidden="true">✳</span>
              <p>Không chỉ hoàn thành bài tập.<br /><strong>Chúng mình đang học cách làm việc cùng nhau.</strong></p>
            </div>
          </section>

          <section className="system-panel" id="system" aria-labelledby="system-title">
            <div className="system-heading">
              <span className="system-icon"><Icon name="pulse" size={23} /></span>
              <span className={`mode-badge ${useMock ? "" : "mode-live"}`}>{useMock ? "BẢN MẪU" : "API THẬT"}</span>
            </div>
            <span className="section-kicker">02 / KẾT NỐI</span>
            <h2 id="system-title">Hệ thống thế nào rồi?</h2>
            <p className="system-description">Một lần kiểm tra, nắm ngay trạng thái ứng dụng của nhóm.</p>
            <div className={`mode-notice ${useMock ? "" : "live-notice"}`}>
              <Icon name="info" size={17} />
              <p>{useMock ? "Bạn đang xem dữ liệu minh họa, chưa kết nối backend Java." : "Kết quả kiểm tra được lấy trực tiếp từ backend Java."}</p>
            </div>
            <div className="system-results" aria-live="polite" aria-atomic="true" aria-busy={phase === "loading"}>
              <dl>
                <div className="metric">
                  <dt><Icon name="server" size={17} />Trạng thái app</dt>
                  <dd className={`status-value status-${phase} ${ready && !running ? "status-warning" : ""}`}>
                    <span className="status-dot" />{statusText}
                  </dd>
                </div>
                <div className="metric">
                  <dt><Icon name="clock" size={17} />{useMock ? "Giờ server (mẫu)" : "Giờ server"}</dt>
                  <dd className="server-time">
                    {ready && info ? <><time dateTime={info.serverTime}>{clockFormat.format(new Date(info.serverTime))}</time><span>{dayFormat.format(new Date(info.serverTime))} · GMT+7</span></> : <span className="metric-placeholder">—</span>}
                  </dd>
                </div>
                <div className="metric">
                  <dt><Icon name="users" size={17} />Số thành viên</dt>
                  <dd>{ready ? <><strong className="count-value">{snapshot.members.length}</strong><span className="count-unit">thành viên{useMock ? " (mẫu)" : ""}</span></> : <span className="metric-placeholder">—</span>}</dd>
                </div>
              </dl>
            </div>
            {error && <p className="system-error" role="alert">{error}</p>}
            <button className="check-button" type="button" onClick={checkSystem} disabled={phase === "loading"}>
              <Icon name={phase === "success" ? "refresh" : "pulse"} size={18} className={phase === "loading" ? "loading-icon" : undefined} />
              {phase === "loading" ? "Đang kiểm tra…" : phase === "error" ? "Thử kiểm tra lại" : "Kiểm tra trạng thái hệ thống"}
              <Icon name="arrow" size={18} />
            </button>
            <p className="last-checked">{checkedAt ? `${useMock ? "Xem dữ liệu mẫu" : "Kiểm tra gần nhất"} lúc ${clockFormat.format(checkedAt)}` : "Sẵn sàng khi bạn muốn kiểm tra."}</p>
          </section>
        </div>

        <section className="closing-note" aria-label="Tinh thần của nhóm">
          <span className="closing-icon"><Icon name="terminal" size={21} /></span>
          <p>Từ <strong>localhost</strong> đến sản phẩm đầu tiên.<span>Mỗi lần commit là một bước tiến.</span></p>
          <span className="closing-tag">BUILD. LEARN. REPEAT. <Icon name="arrow-up" size={18} /></span>
        </section>
      </main>

      <footer className="site-footer">
        <a className="footer-brand" href="#" aria-label="K6 Buổi tối — đầu trang">k6<span>.</span></a>
        <p>Được xây dựng cùng nhau bởi <strong>K6 Buổi tối</strong>.</p>
        <span>Fullstack & DevOps <span className="footer-dot">·</span> Thực hành teamwork</span>
      </footer>
    </div>
  );
}
