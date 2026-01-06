import { ScrollArea } from "@mantine/core";
import { LinksGroup } from "./NavbarLinksGroup";
import classes from "./NavbarNested.module.css";

interface NavbarNestedProps {
  data: {
    label: string;
    icon: React.FC<any>;
    initiallyOpened?: boolean;
    link?: string;
    links?: { label: string; link: string }[];
  }[];
  onLinkClick?: (link: string) => void;
}

export function NavbarNested({ data, onLinkClick }: NavbarNestedProps) {
  const links = data.map((item) => (
    <LinksGroup {...item} key={item.label} onLinkClick={onLinkClick} />
  ));

  return (
    <nav className={classes.navbar}>
      <ScrollArea className={classes.links}>
        <div className={classes.linksInner}>{links}</div>
      </ScrollArea>
    </nav>
  );
}
