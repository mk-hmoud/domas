import { useState, useEffect } from "react";
import { PageHeader, PageShell } from "@domas/ui";
import {
  Text,
  Paper,
  Table,
  Button,
  Group,
  Badge,
  LoadingOverlay,
  Stack,
  ActionIcon,
} from "@mantine/core";
import { IconDoorEnter, IconRefresh } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  bookings,
  students,
  beds,
  locations,
  contracts,
} from "@domas/api-client";
import { Booking, BookingOpsStatus, Student } from "@domas/ts-types";
import { notifications } from "@mantine/notifications";
import { CheckInDetailsModal } from "@domas/ui";

export function SharedCheckInPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [processLoading, setProcessLoading] = useState(false);

  // Mapping states
  const [studentsMap, setStudentsMap] = useState<Map<string, Student>>(
    new Map(),
  );
  const [bedsMap, setBedsMap] = useState<Map<number, string>>(new Map());

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const [bookingsRes, studentsRes, bedsRes, locationsRes] =
        await Promise.all([
          bookings.findAll({ status: BookingOpsStatus.READY_FOR_CHECKIN }),
          students.findAll({ limit: 1000 }),
          beds.findAll({ limit: 1000 }),
          locations.findAll({ limit: 1000 }),
        ]);

      setData(bookingsRes);

      // Map students
      const sMap = new Map<string, Student>();
      studentsRes.data.forEach((s) => sMap.set(s.id, s));
      setStudentsMap(sMap);

      // Map locations for bed display
      const locIdToName = new Map<number, string>();
      locationsRes.data.forEach((l) => locIdToName.set(Number(l.id), l.name));

      const bMap = new Map<number, string>();
      bedsRes.data.forEach((b) => {
        const roomName = locIdToName.get(b.locationId) || "???";
        bMap.set(b.id, `${roomName} - ${b.label}`);
      });
      setBedsMap(bMap);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_fetch_data"),
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCheckIn = async (
    selectedExtraCatalogIds: number[],
    specificCardNumber?: number,
    autoAssignCard?: boolean,
  ) => {
    if (!selectedBooking) return null;
    setProcessLoading(true);
    try {
      const result = await bookings.checkIn(selectedBooking.id, {
        selectedExtraCatalogIds,
        specificCardNumber,
        autoAssignCard,
      });
      notifications.show({
        title: t("success"),
        message: t("checkin_success"),
        color: "green",
      });
      fetchBookings();
      // Auto-download contract
      contracts.downloadContract(selectedBooking.id).catch(console.error);
      return result;
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_checkin"),
        color: "red",
      });
      return null;
    } finally {
      setProcessLoading(false);
    }
  };

  const rows = data.map((booking) => {
    const student = studentsMap.get(booking.studentId);
    return (
      <Table.Tr key={booking.id}>
        <Table.Td>
          <Stack gap={0}>
            <Text fw={500}>
              {student
                ? `${student.firstName} ${student.lastName}`
                : booking.studentId}
            </Text>
            <Text size="xs" c="dimmed">
              {student?.studentNumber || "-"}
            </Text>
          </Stack>
        </Table.Td>
        <Table.Td>
          <Text size="sm">{bedsMap.get(booking.bedId) || booking.bedId}</Text>
        </Table.Td>
        <Table.Td>
          <Badge variant="light" color="blue">
            {t("ready_for_checkin")}
          </Badge>
        </Table.Td>
        <Table.Td>
          <Group gap={4} justify="flex-end">
            <Button
              size="xs"
              leftSection={<IconDoorEnter size={14} />}
              onClick={() => setSelectedBooking(booking)}
            >
              {t("process_checkin")}
            </Button>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <>
      <PageHeader
        title={t("check_in")}
        subtitle={t("check_in_description")}
        actions={
          <ActionIcon
            variant="subtle"
            onClick={fetchBookings}
            loading={loading}
          >
            <IconRefresh size={20} />
          </ActionIcon>
        }
      />
      <PageShell>
        <Stack gap="lg">
          <Paper withBorder radius="md" style={{ position: "relative" }}>
            <LoadingOverlay visible={loading} />
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("student")}</Table.Th>
                  <Table.Th>{t("location")}</Table.Th>
                  <Table.Th>{t("status")}</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows}
                {data.length === 0 && !loading && (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text ta="center" py="xl" c="dimmed">
                        {t("no_bookings_ready")}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Stack>

        <CheckInDetailsModal
          opened={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          booking={selectedBooking}
          onConfirm={handleCheckIn}
          loading={processLoading}
        />
      </PageShell>
    </>
  );
}
