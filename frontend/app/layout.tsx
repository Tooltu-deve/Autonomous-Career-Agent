export const metadata = {
  title: "Autonomous Career Agent",
  description: "Tìm việc & thiết kế CV bằng AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
