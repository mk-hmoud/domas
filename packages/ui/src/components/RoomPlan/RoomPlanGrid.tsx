import { SimpleGrid } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { RoomPlanRoom } from "@domas/ts-types";
import { EmptyState } from "../EmptyState/EmptyState";
import { RoomPlanCard, RoomPlanStudentViewKind } from "./RoomPlanCard";

interface RoomPlanGridProps {
  rooms: RoomPlanRoom[];
  onCreateBooking: (bedId: number) => void;
  onViewStudent: (studentId: string, kind: RoomPlanStudentViewKind) => void;
}

export function RoomPlanGrid({
  rooms,
  onCreateBooking,
  onViewStudent,
}: RoomPlanGridProps) {
  const { t } = useTranslation();

  if (rooms.length === 0) {
    return (
      <EmptyState
        title={t("no_rooms_found", { defaultValue: "No rooms found" })}
      />
    );
  }

  return (
    <SimpleGrid
      cols={{ base: 1, md: 2, xl: 3 }}
      spacing="lg"
      verticalSpacing="lg"
    >
      {rooms.map((room) => (
        <RoomPlanCard
          key={room.id}
          room={room}
          onCreateBooking={onCreateBooking}
          onViewStudent={onViewStudent}
        />
      ))}
    </SimpleGrid>
  );
}
