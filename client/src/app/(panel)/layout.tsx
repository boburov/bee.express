import { AppShell } from "@/widgets/app-shell/AppShell";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
