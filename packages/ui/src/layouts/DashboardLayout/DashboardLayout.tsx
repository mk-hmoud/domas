import { Flex, Box } from "@mantine/core";
import { NavbarNested } from "../../components/NavbarNested/NavbarNested";
import { ReactNode } from "react";

export interface DashboardLayoutProps {
  navData: any[];
  header?: ReactNode;
  onNavigate: (link: string) => void;
  children: ReactNode;
}

export function DashboardLayout({
  navData,
  header,
  onNavigate,
  children,
}: DashboardLayoutProps) {
  return (
    <Flex h="100vh">
      <NavbarNested data={navData} onLinkClick={onNavigate} header={header} />
      <Box style={{ flex: 1, overflowY: "auto" }}>{children}</Box>
    </Flex>
  );
}
