import { Grid } from "@mantine/core";
import { ReactNode } from "react";

interface LocationsManagerProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export function LocationsManager({ sidebar, children }: LocationsManagerProps) {
  return (
    <Grid h="calc(100vh - 130px)">
      <Grid.Col span={4} style={{ height: "100%" }}>
        {sidebar}
      </Grid.Col>
      <Grid.Col span={8} style={{ height: "100%" }}>
        {children}
      </Grid.Col>
    </Grid>
  );
}
