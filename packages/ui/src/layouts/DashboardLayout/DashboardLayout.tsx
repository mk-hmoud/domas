import { Flex, Box } from "@mantine/core";
import { NavbarNested } from "../../components/NavbarNested/NavbarNested";
import { HeaderBar } from "../../components/HeaderBar/HeaderBar";
import { ReactNode } from "react";
import { User } from "@domas/ts-types";

export interface DashboardLayoutProps {
  navData: any[];
  headerLogo?: ReactNode;
  onNavigate: (link: string) => void;
  children: ReactNode;
  user?: User;
  onLogout?: () => void;
  onShowHistory?: () => void;
}

export function DashboardLayout({
  navData,
  headerLogo,
  onNavigate,
  children,
  user,
  onLogout,
  onShowHistory,
}: DashboardLayoutProps) {
  return (
    <Flex direction="column" h="100vh">
      <HeaderBar
        logo={headerLogo}
        user={user}
        onLogout={onLogout}
        onNavigate={onNavigate}
        onShowHistory={onShowHistory}
      />
      <Flex style={{ flex: 1, overflow: "hidden" }}>
        <NavbarNested data={navData} onLinkClick={onNavigate} />
        <Box style={{ flex: 1, overflowY: "auto" }}>{children}</Box>
      </Flex>
    </Flex>
  );
}
