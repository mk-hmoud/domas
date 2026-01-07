import {
  Paper,
  Group,
  Breadcrumbs,
  Anchor,
  Text,
  Title,
  Button,
  ScrollArea,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { ReactNode } from "react";

interface LocationDetailProps {
  title: string;
  breadcrumbs?: { label: string; href?: string; onClick?: () => void }[];
  actions?: ReactNode;
  children: ReactNode;
}

export function LocationDetail({
  title,
  breadcrumbs,
  actions,
  children,
}: LocationDetailProps) {
  return (
    <Paper
      withBorder
      h="100%"
      p="md"
      radius="md"
      style={{ display: "flex", flexDirection: "column" }}
    >
      {/* HEADER */}
      <Group justify="space-between" mb="md">
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
          <Title order={2}>{title}</Title>
        </div>
        <Group>{actions}</Group>
      </Group>

      {/* CONTENT AREA */}
      <ScrollArea style={{ flex: 1 }}>{children}</ScrollArea>
    </Paper>
  );
}
