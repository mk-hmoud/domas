import { Flex, Box, Drawer } from "@mantine/core";
import { NavbarNested } from "../../components/NavbarNested/NavbarNested";
import { HeaderBar } from "../../components/HeaderBar/HeaderBar";
import { ReactNode, useState } from "react";
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleNavClick = (link: string) => {
    onNavigate(link);
    setMobileNavOpen(false);
  };

  const navbar = (
    <NavbarNested
      data={navData}
      onLinkClick={handleNavClick}
      activeLink={activeLink}
    />
  );

  return (
    <Flex direction="column" h="100vh">
      <HeaderBar
        logo={headerLogo}
        user={user}
        onLogout={onLogout}
        onNavigate={onNavigate}
        onShowHistory={onShowHistory}
        mobileNavOpened={mobileNavOpen}
        onMobileNavToggle={() => setMobileNavOpen((o) => !o)}
      />
      <Flex style={{ flex: 1, overflow: "hidden" }}>
        {/* Desktop sidebar — hidden below sm breakpoint */}
        <Box visibleFrom="sm" style={{ flexShrink: 0 }}>
          {navbar}
        </Box>

        {/* Mobile nav — slide-in drawer */}
        <Drawer
          opened={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          size={240}
          withCloseButton={false}
          padding={0}
          styles={{ body: { padding: 0, height: "100%" } }}
        >
          {navbar}
        </Drawer>

        <Box
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
