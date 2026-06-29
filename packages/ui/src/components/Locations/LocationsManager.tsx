import { useState, ReactNode } from "react";
import { Box, ActionIcon, Tooltip } from "@mantine/core";
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from "@tabler/icons-react";

interface LocationsManagerProps {
  sidebar: ReactNode;
  children: ReactNode;
}

const EXPANDED_WIDTH = 300;
const RAIL_WIDTH = 40;

export function LocationsManager({ sidebar, children }: LocationsManagerProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Box
      style={{
        display: "flex",
        height: "calc(100vh - 130px)",
        gap: 12,
        alignItems: "stretch",
        overflow: "hidden",
      }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <Box
        style={{
          width: collapsed ? RAIL_WIDTH : EXPANDED_WIDTH,
          minWidth: collapsed ? RAIL_WIDTH : EXPANDED_WIDTH,
          transition: "width 200ms ease, min-width 200ms ease",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Toggle button row */}
        <Box
          style={{
            display: "flex",
            justifyContent: collapsed ? "center" : "flex-end",
            paddingBottom: 6,
            flexShrink: 0,
          }}
        >
          <Tooltip
            label={collapsed ? "Expand tree" : "Collapse tree"}
            position={collapsed ? "right" : "bottom"}
          >
            <ActionIcon
              variant="default"
              size="sm"
              onClick={() => setCollapsed((c) => !c)}
            >
              {collapsed ? (
                <IconLayoutSidebarLeftExpand size={14} />
              ) : (
                <IconLayoutSidebarLeftCollapse size={14} />
              )}
            </ActionIcon>
          </Tooltip>
        </Box>

        {/* Tree — stays mounted so expanded state survives toggling */}
        <Box
          style={{
            flex: 1,
            overflow: "hidden",
            visibility: collapsed ? "hidden" : "visible",
            opacity: collapsed ? 0 : 1,
            transition: "opacity 150ms ease",
          }}
        >
          {sidebar}
        </Box>
      </Box>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <Box style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>{children}</Box>
    </Box>
  );
}
