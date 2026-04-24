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
  activeLink?: string;
}

export function DashboardLayout({
  navData,
  headerLogo,
  onNavigate,
  children,
  user,
  onLogout,
  onShowHistory,
  activeLink,
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
        <NavbarNested
          data={navData}
          onLinkClick={onNavigate}
          activeLink={activeLink}
        />
        <Box
          id="domas-content"
          style={{
            flex: 1,
            overflowY: "auto",
            backgroundColor:
              "light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-8))",
          }}
        >
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
