import {
  IconBuildingSkyscraper,
  IconBuilding,
  IconLayoutDashboard,
  IconStairs,
  IconBed,
  IconSchool,
} from "@tabler/icons-react";
import { LocationType } from "@domas/ts-types";

interface LocationIconProps {
  type: LocationType;
  size?: number;
}

export function LocationIcon({ type, size = 16 }: LocationIconProps) {
  switch (type) {
    case LocationType.UNIVERSITY:
      return <IconSchool size={size} />;
    case LocationType.CAMPUS:
      return <IconBuildingSkyscraper size={size} />;
    case LocationType.BUILDING:
      return <IconBuilding size={size} />;
    case LocationType.BLOCK:
      return <IconLayoutDashboard size={size} />;
    case LocationType.FLOOR:
      return <IconStairs size={size} />;
    case LocationType.ROOM:
      return <IconBed size={size} />;
    default:
      return null;
  }
}
