import {
  Paper,
  Group,
  Breadcrumbs,
  Anchor,
  Title,
  ScrollArea,
  Badge,
  ThemeIcon,
  Box,
} from "@mantine/core";
import { ReactNode } from "react";
import { LocationType } from "@domas/ts-types";
import { LocationIcon } from "../LocationIcon";

interface LocationDetailProps {
  title: string;
  type?: LocationType;
  breadcrumbs?: { label: string; href?: string; onClick?: () => void }[];
  actions?: ReactNode;
  children: ReactNode;
  noScroll?: boolean;
}

export function LocationDetail({
  title,
  type,
  breadcrumbs,
  actions,
  children,
  noScroll,
}: LocationDetailProps) {
  return (
    <Paper
      withBorder
      h="100%"
      radius="md"
      style={{
        display: "flex",
        flexDirection: "column",
        padding: noScroll ? "12px 12px 8px" : "var(--mantine-spacing-md)",
      }}
    >
      {/* HEADER */}
      <Group justify="space-between" mb="sm" align="flex-start">
        <div>
          {breadcrumbs && (
            <Breadcrumbs mb="xs">
              {breadcrumbs.map((crumb, index) => (
                <Anchor
                  key={index}
                  size="sm"
                  href={crumb.href}
                  onClick={(e) => {
                    if (crumb.onClick) {
                      e.preventDefault();
                      crumb.onClick();
                    } else if (!crumb.href) {
                      e.preventDefault();
                    }
                  }}
                >
                  {crumb.label}
                </Anchor>
              ))}
            </Breadcrumbs>
          )}
          <Group gap="sm" align="center">
            {type && (
              <ThemeIcon size="md" variant="light" color="blue">
                <LocationIcon type={type} size={16} />
              </ThemeIcon>
            )}
            <Title order={4}>{title}</Title>
            {type && (
              <Badge variant="outline" color="gray" size="sm">
                {type.toUpperCase()}
              </Badge>
            )}
          </Group>
        </div>
        <Group>{actions}</Group>
      </Group>

      {/* CONTENT AREA */}
      {noScroll ? (
        <Box
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          {children}
        </Box>
      ) : (
        <ScrollArea style={{ flex: 1 }}>{children}</ScrollArea>
      )}
    </Paper>
  );
}
