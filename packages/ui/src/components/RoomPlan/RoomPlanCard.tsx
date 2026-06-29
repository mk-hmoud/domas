import {
  Card,
  Group,
  Text,
  Badge,
  Stack,
  Divider,
  Avatar,
  rem,
} from "@mantine/core";
import { useHover } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { PaymentStatus, RoomPlanRoom, RoomPlanBed } from "@domas/ts-types";

export type RoomPlanStudentViewKind = "occupant" | "pending";

interface RoomPlanCardProps {
  room: RoomPlanRoom;
  onCreateBooking: (bedId: number) => void;
  onViewStudent: (studentId: string, kind: RoomPlanStudentViewKind) => void;
  isHistorical?: boolean;
}

export type RoomPlanComputedStatus =
  | "vacant"
  | "partial"
  | "full"
  | "maintenance";

export function getRoomPlanStatus(room: RoomPlanRoom): RoomPlanComputedStatus {
  if (room.beds.some((b) => b.status === "maintenance")) return "maintenance";
  const occupied = room.beds.filter((b) => b.occupant).length;
  if (occupied === 0) return "vacant";
  if (occupied < room.beds.length) return "partial";
  return "full";
}

const STATUS_COLORS: Record<RoomPlanComputedStatus, string> = {
  vacant: "green",
  partial: "yellow",
  full: "blue",
  maintenance: "orange",
};

const BED_STATUS_COLORS: Record<string, string> = {
  available: "green",
  occupied: "blue",
  maintenance: "orange",
};

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: "gray",
  [PaymentStatus.PARTIAL]: "yellow",
  [PaymentStatus.PAID]: "green",
  [PaymentStatus.FAILED]: "red",
  [PaymentStatus.REFUNDED]: "grape",
};

interface EmptyBedRowProps {
  bed: RoomPlanBed;
  onCreateBooking: (bedId: number) => void;
  isHistorical?: boolean;
}

function EmptyBedRow({ bed, onCreateBooking, isHistorical }: EmptyBedRowProps) {
  const { t } = useTranslation();
  const { hovered, ref } = useHover<HTMLDivElement>();
  const bookable = bed.status === "available" && !isHistorical;

  return (
    <Group
      ref={ref}
      justify="space-between"
      wrap="nowrap"
      py={4}
      px={6}
      style={{
        borderRadius: 6,
        cursor: bookable ? "pointer" : "default",
        backgroundColor:
          bookable && hovered ? "var(--mantine-color-green-light)" : undefined,
        transition: "background-color 100ms ease",
      }}
      onClick={bookable ? () => onCreateBooking(bed.id) : undefined}
    >
      <Text size="sm" c={bookable && hovered ? "green" : "dimmed"} fw={500}>
        {bookable && hovered
          ? t("create_booking", { defaultValue: "Create Booking" })
          : t("vacant", { defaultValue: "Vacant" })}
      </Text>
      {bookable && (
        <IconPlus
          size={16}
          color={
            hovered
              ? "var(--mantine-color-green-6)"
              : "var(--mantine-color-dimmed)"
          }
        />
      )}
    </Group>
  );
}

export function RoomPlanCard({
  room,
  onCreateBooking,
  onViewStudent,
  isHistorical,
}: RoomPlanCardProps) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === "tr";
  const status = getRoomPlanStatus(room);
  const color = STATUS_COLORS[status];
  const occupiedCount = room.beds.filter((b) => b.occupant).length;

  return (
    <Card
      withBorder
      padding="lg"
      radius="md"
      style={{
        borderLeftWidth: rem(4),
        borderLeftColor: `var(--mantine-color-${color}-filled)`,
      }}
    >
      <Group justify="space-between" wrap="nowrap" mb={6}>
        <Text fw={700} size="md" truncate>
          {isTr && room.nameTr ? room.nameTr : room.name}
        </Text>
        <Group gap={6} wrap="nowrap">
          {room.genderLock && (
            <Badge
              size="sm"
              variant="light"
              color={room.genderLock === "male" ? "blue" : "pink"}
            >
              {t(room.genderLock, { defaultValue: room.genderLock })}
            </Badge>
          )}
          <Badge size="sm" variant="light" color={color}>
            {occupiedCount}/{room.capacity}
          </Badge>
        </Group>
      </Group>

      <Stack gap={0} mt="sm">
        {room.beds.map((bed, idx) => (
          <div key={bed.id}>
            {idx > 0 && <Divider my={10} />}

            <Group justify="space-between" wrap="nowrap" mb={6}>
              <Text size="sm" c="dimmed" fw={600}>
                {t("bed_word", { defaultValue: "Bed" })} {bed.label}
              </Text>
              <Badge
                size="sm"
                variant="dot"
                color={BED_STATUS_COLORS[bed.status]}
              >
                {t(`bed_status.${bed.status}`, { defaultValue: bed.status })}
              </Badge>
            </Group>

            {bed.occupant && (
              <Stack gap={6}>
                <Group
                  gap={10}
                  wrap="nowrap"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    onViewStudent(bed.occupant!.studentId, "occupant")
                  }
                >
                  <Avatar
                    size={38}
                    radius="xl"
                    color="initials"
                    name={`${bed.occupant.firstName} ${bed.occupant.lastName}`}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Text size="md" fw={600} truncate td="underline">
                      {bed.occupant.firstName} {bed.occupant.lastName}
                    </Text>
                    <Text size="sm" c="dimmed" truncate>
                      {bed.occupant.studentNumber}
                    </Text>
                  </div>
                </Group>
                <Group gap={6} wrap="wrap">
                  <Badge size="sm" variant="light" color="gray">
                    {t(bed.occupant.gender, {
                      defaultValue: bed.occupant.gender,
                    })}
                  </Badge>
                  <Badge size="sm" variant="outline" color="gray">
                    {bed.occupant.nationalityCode}
                  </Badge>
                  <Badge
                    size="sm"
                    variant="light"
                    color={PAYMENT_STATUS_COLORS[bed.occupant.paymentStatus]}
                  >
                    {t(`payment_${bed.occupant.paymentStatus}`, {
                      defaultValue: bed.occupant.paymentStatus,
                    })}
                  </Badge>
                  {bed.occupant.checkedInAt && (
                    <Text size="sm" c="dimmed">
                      {dayjs(bed.occupant.checkedInAt).format("DD/MM/YY")}
                    </Text>
                  )}
                </Group>
              </Stack>
            )}

            {!bed.occupant && bed.pendingBooking && (
              <Stack
                gap={4}
                style={{ cursor: "pointer" }}
                onClick={() =>
                  onViewStudent(bed.pendingBooking!.studentId, "pending")
                }
              >
                <Text size="sm">
                  {t("reserved_for", { defaultValue: "Reserved for" })}{" "}
                  <Text span fw={600} td="underline">
                    {bed.pendingBooking.firstName} {bed.pendingBooking.lastName}
                  </Text>
                </Text>
                <Text size="sm" c="dimmed">
                  {dayjs(bed.pendingBooking.startDate).format("DD/MM/YY")} ·{" "}
                  {t(`booking_status.${bed.pendingBooking.status}`, {
                    defaultValue: bed.pendingBooking.status,
                  })}
                </Text>
              </Stack>
            )}

            {!bed.occupant && !bed.pendingBooking && (
              <EmptyBedRow
                bed={bed}
                onCreateBooking={onCreateBooking}
                isHistorical={isHistorical}
              />
            )}
          </div>
        ))}
      </Stack>
    </Card>
  );
}
