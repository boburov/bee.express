import { MobileShell } from "@/widgets/mobile-shell/MobileShell";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <MobileShell>{children}</MobileShell>;
}
