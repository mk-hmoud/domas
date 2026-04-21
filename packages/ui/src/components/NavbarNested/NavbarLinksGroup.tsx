import { useState } from "react";
import { Group, Box, Collapse, UnstyledButton, rem } from "@mantine/core";
import { IconChevronRight } from "@tabler/icons-react";
import classes from "./NavbarLinksGroup.module.css";

interface LinksGroupProps {
  icon: React.FC<any>;
  label: string;
  initiallyOpened?: boolean;
  link?: string;
  links?: { label: string; link: string }[];
  onLinkClick?: (link: string) => void;
  activeLink?: string;
}

export function LinksGroup({
  icon: Icon,
  label,
  initiallyOpened,
  link,
  links,
  onLinkClick,
  activeLink,
}: LinksGroupProps) {
  const hasLinks = Array.isArray(links);
  const isChildActive = hasLinks && links.some((l) => l.link === activeLink);
  const [opened, setOpened] = useState(initiallyOpened || isChildActive);

  const items = (hasLinks ? links : []).map((l) => (
    <a
      className={`${classes.link} ${activeLink === l.link ? classes.linkActive : ""}`}
      href={l.link}
      key={l.label}
      onClick={(e) => {
        e.preventDefault();
        onLinkClick?.(l.link);
      }}
    >
      {l.label}
    </a>
  ));

  return (
    <>
      <UnstyledButton
        onClick={() => {
          if (hasLinks) {
            setOpened((o) => !o);
          } else if (link) {
            onLinkClick?.(link);
          }
        }}
        className={classes.control}
      >
        <Group justify="space-between" gap={0} w="100%">
          <Box style={{ display: "flex", alignItems: "center", gap: rem(10) }}>
            <Icon
              style={{
                width: rem(16),
                height: rem(16),
                flexShrink: 0,
                color: "var(--mantine-color-gray-6)",
              }}
              stroke={1.75}
            />
            <span>{label}</span>
          </Box>
          {hasLinks && (
            <IconChevronRight
              className={classes.chevron}
              stroke={1.5}
              style={{
                width: rem(14),
                height: rem(14),
                transform: opened ? "rotate(90deg)" : "none",
                color: "var(--mantine-color-gray-5)",
              }}
            />
          )}
        </Group>
      </UnstyledButton>
      {hasLinks ? <Collapse in={opened}>{items}</Collapse> : null}
    </>
  );
}
