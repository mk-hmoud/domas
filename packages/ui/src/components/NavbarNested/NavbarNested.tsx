import { ScrollArea } from "@mantine/core";
import { LinksGroup } from "./NavbarLinksGroup";
import classes from "./NavbarNested.module.css";

interface NavSubLink {
  label: string;
  link: string;
  badge?: number;
}

interface NavbarNestedProps {
  data: {
    label: string;
    icon: React.FC<any>;
    initiallyOpened?: boolean;
    link?: string;
    links?: NavSubLink[];
  }[];
  onLinkClick?: (link: string) => void;
  activeLink?: string;
}

export function NavbarNested({
  data,
  onLinkClick,
  activeLink,
}: NavbarNestedProps) {
  const links = data.map((item) => (
    <LinksGroup
      {...item}
      key={item.label}
      onLinkClick={onLinkClick}
      activeLink={activeLink}
    />
  ));

  return (
    <nav id="domas-navbar" className={classes.navbar}>
      <ScrollArea className={classes.links} scrollbarSize={4}>
        <div className={classes.linksInner}>{links}</div>
      </ScrollArea>
    </nav>
  );
}
