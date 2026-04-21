import { useEffect, useState, useMemo } from "react";
import { PageHeader, PageShell } from "@domas/ui";
import {
  Button,
  Group,
  LoadingOverlay,
  Paper,
  Text,
  TextInput,
  Card,
  Stack,
  Drawer,
  Badge,
} from "@mantine/core";
import { IconSearch, IconArrowsLeftRight } from "@tabler/icons-react";
import { bookings, students, beds, semesters } from "@domas/api-client";
import {
  Booking,
  Semester,
  TransferBookingDto,
  BookingOpsStatus,
} from "@domas/ts-types";
import { BookingsTable, TransferSemesterModal, LabelValue } from "@domas/ui";
import { useTranslation } from "react-i18next";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";

export function SharedTransfersPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [transferModalOpened, setTransferModalOpened] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);

  // Mappings
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
  const [bedsMap, setBedsMap] = useState<Map<number, string>>(new Map());
  const [studentsMap, setStudentsMap] = useState<Map<string, string>>(
    new Map(),
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      // Only fetch bookings that are eligible for transfer (Active or Ready)
      const [bookingsRes, studentsRes, bedsRes, semestersRes] =
        await Promise.all([
          bookings.findAll(),
          students.findAll({ limit: 1000 }),
          beds.findAll({ limit: 10000 }),
          semesters.findAll({ limit: 1000 }),
        ]);

      // Filter for transfer-eligible bookings
      const eligible = bookingsRes.filter(
        (b) =>
          b.status === BookingOpsStatus.ACTIVE ||
          b.status === BookingOpsStatus.READY_FOR_CHECKIN,
      );

      setData(eligible);
      setAllSemesters(semestersRes.data);

      const sMap = new Map<string, string>();
      studentsRes.data.forEach((s) =>
        sMap.set(s.id, `${s.firstName} ${s.lastName}`),
      );
      setStudentsMap(sMap);

      const bMap = new Map<number, string>();
      bedsRes.data.forEach((b) =>
        bMap.set(b.id, `${b.locationName || "???"} - ${b.label}`),
      );
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
    fetchData();
  }, []);

  const handleTransferSubmit = async (values: TransferBookingDto) => {
    if (selectedIds.length === 0) return;

    setLoading(true);
    try {
      if (selectedIds.length === 1) {
        await bookings.transfer(selectedIds[0], values);
      } else {
        await bookings.transferMany({
          bookingIds: selectedIds,
          targetSemesterId: values.targetSemesterId,
          startDate: values.startDate,
          endDate: values.endDate,
        });
      }

      notifications.show({
        title: t("success"),
        message: t("transfer_completed_success", {
          count: selectedIds.length,
          defaultValue: `Successfully processed ${selectedIds.length} transfer(s)`,
        }),
        color: "green",
      });

      setSelectedIds([]);
      await fetchData();
      setTransferModalOpened(false);
    } catch (error: any) {
      notifications.show({
        title: t("error"),
        message:
          error.response?.data?.message || t("failed_to_transfer_booking"),
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!debouncedSearch) return data;
    const lowerQuery = debouncedSearch.toLowerCase();

    return data.filter((booking) => {
      const studentName =
        studentsMap.get(booking.studentId)?.toLowerCase() || "";
      const bedName = bedsMap.get(booking.bedId)?.toLowerCase() || "";
      return studentName.includes(lowerQuery) || bedName.includes(lowerQuery);
    });
  }, [data, debouncedSearch, studentsMap, bedsMap]);

  const selectedStudentNames = selectedIds.map((id) => {
    const b = data.find((item) => item.id === id);
    return b ? studentsMap.get(b.studentId) || "???" : "???";
  });

  return (
    <>
      <PageHeader
        title={t("booking_transfers", { defaultValue: "Booking Transfers" })}
        actions={
          <Group gap="sm">
            {selectedIds.length > 0 && (
              <Button
                variant="subtle"
                color="gray"
                onClick={() => setSelectedIds([])}
              >
                {t("clear_selection", { defaultValue: "Clear Selection" })}
              </Button>
            )}
            <Button
              leftSection={<IconArrowsLeftRight size={16} />}
              disabled={selectedIds.length === 0}
              onClick={() => setTransferModalOpened(true)}
            >
              {t("transfer_selected", { defaultValue: "Transfer Selected" })} (
              {selectedIds.length})
            </Button>
          </Group>
        }
      />
      <PageShell>
        <Stack gap="lg">
          <Card withBorder padding="md" radius="md">
            <TextInput
              placeholder={t("search_by_student_or_bed", {
                defaultValue: "Search by student or bed...",
              })}
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
            />
          </Card>

          <Paper withBorder radius="md" style={{ position: "relative" }}>
            <LoadingOverlay visible={loading} />
            <BookingsTable
              data={filteredData}
              studentsMap={studentsMap}
              bedsMap={bedsMap}
              onSelect={(booking) => {
                setSelectedIds((prev) =>
                  prev.includes(booking.id)
                    ? prev.filter((id) => id !== booking.id)
                    : [...prev, booking.id],
                );
              }}
              onView={setSelectedBooking}
              onTransfer={(booking) => {
                setSelectedIds([booking.id]);
                setTransferModalOpened(true);
              }}
            />
            {filteredData.length === 0 && !loading && (
              <Text c="dimmed" ta="center" py="xl">
                {t("no_transferable_bookings", {
                  defaultValue: "No transferable bookings found",
                })}
              </Text>
            )}
          </Paper>
        </Stack>

        <TransferSemesterModal
          opened={transferModalOpened}
          onClose={() => setTransferModalOpened(false)}
          onSubmit={handleTransferSubmit}
          semesters={allSemesters}
          studentNames={selectedStudentNames}
          loading={loading}
        />

        <Drawer
          opened={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          title={t("student_details", { defaultValue: "Student Details" })}
          position="right"
        >
          {selectedBooking && (
            <Stack gap="lg">
              <Text fw={700} size="md">
                {studentsMap.get(selectedBooking.studentId)}
              </Text>
              <LabelValue
                label={t("current_bed", { defaultValue: "Current Bed" })}
              >
                {bedsMap.get(selectedBooking.bedId) || selectedBooking.bedId}
              </LabelValue>
              <LabelValue label={t("status")}>
                <Badge variant="light">{selectedBooking.status}</Badge>
              </LabelValue>
            </Stack>
          )}
        </Drawer>
      </PageShell>
    </>
  );
}
