import {
  Paper,
  Group,
  Breadcrumbs,
  Anchor,
  Title,
  ScrollArea,
  Badge,
  ThemeIcon,
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
}

export function LocationDetail({
  title,
  type,
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
      <Group justify="space-between" mb="md" align="flex-start">
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
          <Group gap="sm">
            {type && (
              <ThemeIcon size="lg" variant="light" color="blue">
                <LocationIcon type={type} size={20} />
              </ThemeIcon>
            )}
            <Title order={2}>{title}</Title>
            {type && (
              <Badge variant="outline" color="gray" size="lg">
                {type.toUpperCase()}
              </Badge>
            )}
          </Group>
        </div>
        <Group>{actions}</Group>
      </Group>

      {/* CONTENT AREA */}
      <ScrollArea style={{ flex: 1 }}>{children}</ScrollArea>
    </Paper>
  );
}
