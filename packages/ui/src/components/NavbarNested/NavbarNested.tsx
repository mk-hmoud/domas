import { ScrollArea } from "@mantine/core";
import { LinksGroup } from "./NavbarLinksGroup";
import classes from "./NavbarNested.module.css";
import { ReactNode } from "react";

interface NavbarNestedProps {
  data: {
    label: string;
    icon: React.FC<any>;
    initiallyOpened?: boolean;
    links?: { label: string; link: string }[];
  }[];
  header?: ReactNode;
  onLinkClick?: (link: string) => void;
}

export function NavbarNested({ data, header, onLinkClick }: NavbarNestedProps) {
  const links = data.map((item) => (
    <LinksGroup {...item} key={item.label} onLinkClick={onLinkClick} />
  ));

  return (
    <nav className={classes.navbar}>
      {header && <div className={classes.header}>{header}</div>}

      <ScrollArea className={classes.links}>
        <div className={classes.linksInner}>{links}</div>
      </ScrollArea>
    </nav>
  );
}
