import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "K6 Buổi tối | Cùng học, cùng xây dựng",
  description: "Gặp gỡ K6 Buổi tối — cùng xây dựng và triển khai ứng dụng Fullstack với Next.js, Java, Docker và CI/CD.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
