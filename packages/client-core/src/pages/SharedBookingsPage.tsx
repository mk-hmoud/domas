import { useEffect, useState, useMemo } from "react";
import {
  Title,
  Button,
  Group,
  Container,
  LoadingOverlay,
  Paper,
  Text,
  Drawer,
  Stack,
  Box,
  Code,
  Badge,
  TextInput,
  Card,
  Divider,
  SimpleGrid,
  Alert,
  Select,
  Modal,
  Loader,
  ThemeIcon,
} from "@mantine/core";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconInfoCircle,
  IconX,
  IconArrowsExchange,
} from "@tabler/icons-react";
import {
  bookings,
  students,
  beds,
  semesters,
  roomChanges,
} from "@domas/api-client";
import {
  Booking,
  Student,
  Semester,
  BookingOpsStatus,
  PaymentStatus,
  CreateBookingDto,
  CreateStudentDto,
  StaffAvailableBed,
} from "@domas/ts-types";
import { CreateBookingModal, BookingsTable } from "@domas/ui";
import { useTranslation } from "react-i18next";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { DatePickerInput } from "@mantine/dates";
import { useAuth } from "../context/AuthContext";
import dayjs from "dayjs";

export function SharedBookingsPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Text search (client-side, on student name / bed name)
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);

  // Server-side filters
  const [filterSemesterId, setFilterSemesterId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string | null>(
    null,
  );

  // Date Editing State (Inline Drawer)
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [editStartDate, setEditStartDate] = useState<Date | null>(null);
  const [editEndDate, setEditEndDate] = useState<Date | null>(null);

  // Data for modal & mapping
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
  const [bedsMap, setBedsMap] = useState<Map<number, string>>(new Map());
  const [studentsMap, setStudentsMap] = useState<Map<string, string>>(
    new Map(),
  );

  // Full Edit State
  const [isEditMode, setIsEditMode] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);

  // Move Bed State
  const [moveBedOpened, setMoveBedOpened] = useState(false);
  const [moveBedLoading, setMoveBedLoading] = useState(false);
  const [moveBedBeds, setMoveBedBeds] = useState<StaffAvailableBed[]>([]);
  const [moveBedSelectedId, setMoveBedSelectedId] = useState<string | null>(
    null,
  );

  const fetchBookings = async (filters?: {
    semesterId?: number;
    status?: BookingOpsStatus;
    paymentStatus?: PaymentStatus;
  }) => {
    setLoading(true);
    try {
      const result = await bookings.findAll(filters);
      setData(result);
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

  const fetchModalData = async () => {
    try {
      const [studentsRes, bedsRes, semestersRes] = await Promise.all([
        students.findAll({ limit: 1000 }),
        beds.findAll({ limit: 10000 }),
        semesters.findAll({ limit: 1000 }),
      ]);

      // Update Modal Data
      setStudentList(studentsRes.data);
      setAllSemesters(semestersRes.data);

      // Build Beds Map
      const bMap = new Map<number, string>();
      bedsRes.data.forEach((b) => {
        const roomName = b.locationName || "Unknown Room";
        bMap.set(b.id, `${roomName} - ${b.label}`);
      });
      setBedsMap(bMap);

      // Build Students Map
      const sMap = new Map<string, string>();
      studentsRes.data.forEach((s) => {
        sMap.set(s.id, `${s.firstName} ${s.lastName}`);
      });
      setStudentsMap(sMap);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_fetch_data"),
        color: "red",
      });
    }
  };

  useEffect(() => {
    fetchModalData();
  }, []);

  // Re-fetch when server-side filters change
  useEffect(() => {
    fetchBookings({
      semesterId: filterSemesterId ? parseInt(filterSemesterId, 10) : undefined,
      status: (filterStatus as BookingOpsStatus) || undefined,
      paymentStatus: (filterPaymentStatus as PaymentStatus) || undefined,
    });
  }, [filterSemesterId, filterStatus, filterPaymentStatus]);

  useEffect(() => {
    if (modalOpened) {
      fetchModalData();
    } else {
      // Clear edit info when modal closes
      setIsEditMode(false);
      setBookingToEdit(null);
    }
  }, [modalOpened]);

  useEffect(() => {
    if (selectedBooking) {
      setEditStartDate(new Date(selectedBooking.startDate));
      setEditEndDate(new Date(selectedBooking.endDate));
      setIsEditingDates(false);
    }
  }, [selectedBooking]);

  const handleUpdateDates = async () => {
    if (!selectedBooking || !editStartDate || !editEndDate) return;

    setLoading(true);
    try {
      const start = new Date(editStartDate);
      const end = new Date(editEndDate);

      await bookings.adjustDates(selectedBooking.id, {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      notifications.show({
        title: t("success"),
        message: t("stay_period_updated", "Stay period updated successfully"),
        color: "green",
      });
      await fetchBookings({
        semesterId: filterSemesterId
          ? parseInt(filterSemesterId, 10)
          : undefined,
        status: (filterStatus as BookingOpsStatus) || undefined,
        paymentStatus: (filterPaymentStatus as PaymentStatus) || undefined,
      });
      setIsEditingDates(false);
      // Update local selection to reflect new dates
      setSelectedBooking((prev) =>
        prev
          ? {
              ...prev,
              startDate: start.toISOString(),
              endDate: end.toISOString(),
            }
          : null,
      );
    } catch (error: any) {
      notifications.show({
        title: t("error"),
        message: error.response?.data?.message || t("failed_to_update_period"),
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (booking: Booking) => {
    setBookingToEdit(booking);
    setIsEditMode(true);
    setModalOpened(true);
  };

  const openMoveBed = async (booking: Booking) => {
    setMoveBedSelectedId(null);
    setMoveBedOpened(true);
    setMoveBedLoading(true);
    try {
      const available = await roomChanges.getAvailableBeds(booking.id);
      setMoveBedBeds(available);
    } catch {
      notifications.show({ message: t("failed_to_fetch_data"), color: "red" });
      setMoveBedOpened(false);
    } finally {
      setMoveBedLoading(false);
    }
  };

  const handleMoveBedSubmit = async () => {
    if (!selectedBooking || !moveBedSelectedId) return;
    setMoveBedLoading(true);
    try {
      await roomChanges.moveBed(
        selectedBooking.id,
        parseInt(moveBedSelectedId, 10),
      );
      notifications.show({ message: t("move_bed.success"), color: "green" });
      setMoveBedOpened(false);
      setMoveBedSelectedId(null);
      // Refresh booking list and update drawer
      await fetchBookings({
        semesterId: filterSemesterId
          ? parseInt(filterSemesterId, 10)
          : undefined,
        status: (filterStatus as BookingOpsStatus) || undefined,
        paymentStatus: (filterPaymentStatus as PaymentStatus) || undefined,
      });
      setSelectedBooking(null);
    } catch (e: any) {
      notifications.show({
        message: e?.response?.data?.message ?? t("move_bed.error"),
        color: "red",
      });
    } finally {
      setMoveBedLoading(false);
    }
  };

  const handleCreateBooking = async (values: CreateBookingDto) => {
    try {
      if (isEditMode && bookingToEdit) {
        await bookings.update(bookingToEdit.id, values);
        notifications.show({
          title: t("success"),
          message: t("booking_updated", "Booking updated successfully"),
          color: "green",
        });
      } else {
        await bookings.create(values);
        notifications.show({
          title: t("success"),
          message: t("booking_created", "Booking created successfully"),
          color: "green",
        });
      }
      await fetchBookings({
        semesterId: filterSemesterId
          ? parseInt(filterSemesterId, 10)
          : undefined,
        status: (filterStatus as BookingOpsStatus) || undefined,
        paymentStatus: (filterPaymentStatus as PaymentStatus) || undefined,
      });
      setModalOpened(false);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_save_role"),
        color: "red",
      });
    }
  };

  const handleCreateStudent = async (values: CreateStudentDto) => {
    try {
      await students.create(values);
      notifications.show({
        title: t("success"),
        message: t("student_created", "Student created successfully"),
        color: "green",
      });
      // Refresh list
      const studentsRes = await students.findAll({ limit: 1000 });
      setStudentList(studentsRes.data);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_save_role"),
        color: "red",
      });
    }
  };

  const hasActiveFilters =
    !!filterSemesterId || !!filterStatus || !!filterPaymentStatus;

  const clearFilters = () => {
    setFilterSemesterId(null);
    setFilterStatus(null);
    setFilterPaymentStatus(null);
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

  return (
    <Container size="lg" py="xl" style={{ position: "relative" }}>
      <LoadingOverlay visible={loading} />
      <Group justify="space-between" mb="lg">
        <Title>{t("nav.bookings", { defaultValue: "Bookings" })}</Title>
        <Button
          leftSection={<IconPlus size={14} />}
          onClick={() => setModalOpened(true)}
        >
          {t("create_booking")}
        </Button>
      </Group>

      <Card withBorder padding="md" radius="md" mb="md">
        <Stack gap="sm">
          <TextInput
            placeholder={t("search_placeholder", {
              defaultValue: "Search by student or bed...",
            })}
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
          />
          <Group grow wrap="nowrap">
            <Select
              placeholder={t("all_semesters", "All Semesters")}
              data={allSemesters.map((s) => ({
                value: String(s.id),
                label: s.displayName,
              }))}
              value={filterSemesterId}
              onChange={setFilterSemesterId}
              clearable
            />
            <Select
              placeholder={t("all_statuses", "All Statuses")}
              data={Object.values(BookingOpsStatus).map((s) => ({
                value: s,
                label: t(`booking_status.${s}`, { defaultValue: s }),
              }))}
              value={filterStatus}
              onChange={setFilterStatus}
              clearable
            />
            <Select
              placeholder={t("all_payment_statuses", "All Payment Statuses")}
              data={Object.values(PaymentStatus).map((s) => ({
                value: s,
                label: t(`portal.payment_${s}`, { defaultValue: s }),
              }))}
              value={filterPaymentStatus}
              onChange={setFilterPaymentStatus}
              clearable
            />
            {hasActiveFilters && (
              <Button
                variant="subtle"
                color="gray"
                leftSection={<IconX size={14} />}
                onClick={clearFilters}
                style={{ flexShrink: 0 }}
              >
                {t("clear_filters", "Clear")}
              </Button>
            )}
          </Group>
        </Stack>
      </Card>

      <Paper withBorder radius="md">
        <BookingsTable
          data={filteredData}
          studentsMap={studentsMap}
          bedsMap={bedsMap}
          onSelect={setSelectedBooking}
          onView={setSelectedBooking}
          onEdit={handleEditClick}
          onDelete={(booking) => console.log("Delete", booking)}
        />
        {filteredData.length === 0 && !loading && (
          <Text c="dimmed" ta="center" py="xl">
            {t("no_bookings_found", { defaultValue: "No bookings found" })}
          </Text>
        )}
      </Paper>

      <CreateBookingModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onSubmit={handleCreateBooking}
        onCreateStudent={handleCreateStudent}
        students={studentList.map((s) => ({
          value: s.id,
          label: `${s.firstName} ${s.lastName} (${s.studentNumber})`,
        }))}
        semesters={allSemesters}
        initialStudentId={isEditMode ? bookingToEdit?.studentId : null}
        initialBedId={isEditMode ? bookingToEdit?.bedId : null}
        isEdit={isEditMode}
      />

      <Drawer
        opened={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title={t("booking_details", { defaultValue: "Booking Details" })}
        position="right"
        size="md"
      >
        {selectedBooking && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="xl" fw={700}>
                {studentsMap.get(selectedBooking.studentId) ||
                  "Unknown Student"}
              </Text>
              <Badge>{selectedBooking.status}</Badge>
            </Group>

            <Box>
              <Text size="xs" c="dimmed">
                ID
              </Text>
              <Code>{selectedBooking.id}</Code>
            </Box>

            {selectedBooking.previousBookingId && (
              <Box>
                <Text size="xs" c="dimmed">
                  {t("rolled_over_from", { defaultValue: "Rolled over from" })}
                </Text>
                <Code color="blue">{selectedBooking.previousBookingId}</Code>
              </Box>
            )}

            <Divider
              label={t("stay_period", "Stay Period")}
              labelPosition="center"
            />

            {!isEditingDates ? (
              <Stack gap="xs">
                <Group grow>
                  <Box>
                    <Text size="xs" c="dimmed">
                      {t("start_date")}
                    </Text>
                    <Text>
                      {new Date(selectedBooking.startDate).toLocaleDateString()}
                    </Text>
                  </Box>
                  <Box>
                    <Text size="xs" c="dimmed">
                      {t("end_date")}
                    </Text>
                    <Text>
                      {new Date(selectedBooking.endDate).toLocaleDateString()}
                    </Text>
                  </Box>
                </Group>
                {hasPermission("bookings.update") && (
                  <Button
                    variant="subtle"
                    size="xs"
                    leftSection={<IconEdit size={14} />}
                    onClick={() => setIsEditingDates(true)}
                  >
                    {t("modify_stay_period", "Modify Stay Period")}
                  </Button>
                )}
              </Stack>
            ) : (
              <Stack gap="sm">
                {(() => {
                  const s = allSemesters.find(
                    (sem) => sem.id === selectedBooking.semesterId,
                  );
                  if (
                    s &&
                    editStartDate &&
                    editEndDate &&
                    (dayjs(editStartDate).isBefore(dayjs(s.startDate), "day") ||
                      dayjs(editEndDate).isAfter(dayjs(s.endDate), "day"))
                  ) {
                    return (
                      <Alert
                        color="orange"
                        icon={<IconInfoCircle size={16} />}
                        variant="light"
                      >
                        {t("out_of_bounds_warning")}
                      </Alert>
                    );
                  }
                  return null;
                })()}
                <SimpleGrid cols={2}>
                  <DatePickerInput
                    label={t("start_date")}
                    value={editStartDate}
                    onChange={setEditStartDate as any}
                    required
                    disabled={
                      selectedBooking.status === "active" ||
                      selectedBooking.status === "completed" ||
                      selectedBooking.status === "cancelled" ||
                      selectedBooking.status === "rejected"
                    }
                  />
                  <DatePickerInput
                    label={t("end_date")}
                    value={editEndDate}
                    onChange={setEditEndDate as any}
                    required
                    disabled={
                      selectedBooking.status === "completed" ||
                      selectedBooking.status === "cancelled" ||
                      selectedBooking.status === "rejected"
                    }
                  />
                </SimpleGrid>
                <Group grow>
                  <Button
                    variant="default"
                    onClick={() => setIsEditingDates(false)}
                  >
                    {t("cancel")}
                  </Button>
                  <Button onClick={handleUpdateDates} loading={loading}>
                    {t("save_changes", "Save Changes")}
                  </Button>
                </Group>
              </Stack>
            )}

            <Divider />

            <Box>
              <Text size="xs" c="dimmed">
                {t("bed")}
              </Text>
              <Text fw={500}>
                {bedsMap.get(selectedBooking.bedId) || "Unknown Bed"}
              </Text>
            </Box>

            {hasPermission("room_changes.manage") && (
              <Button
                variant="light"
                color="teal"
                leftSection={<IconArrowsExchange size={16} />}
                onClick={() => openMoveBed(selectedBooking)}
              >
                {t("move_bed.button")}
              </Button>
            )}

            <Button
              variant="light"
              leftSection={<IconEdit size={16} />}
              onClick={() => handleEditClick(selectedBooking)}
            >
              {t("edit")}
            </Button>
          </Stack>
        )}
      </Drawer>

      {/* Move Bed Modal */}
      <Modal
        opened={moveBedOpened}
        onClose={() => setMoveBedOpened(false)}
        title={t("move_bed.modal_title")}
        size="md"
      >
        <Stack gap="md">
          {moveBedLoading ? (
            <Group justify="center" py="lg">
              <Loader size="sm" />
            </Group>
          ) : moveBedBeds.length === 0 ? (
            <Alert icon={<IconInfoCircle size={14} />} color="blue" radius="md">
              {t("move_bed.no_available_beds")}
            </Alert>
          ) : (
            <Stack gap="xs" style={{ maxHeight: 360, overflowY: "auto" }}>
              {moveBedBeds.map((bed) => {
                const isSelected = moveBedSelectedId === String(bed.id);
                return (
                  <Paper
                    key={bed.id}
                    radius="md"
                    p="sm"
                    withBorder
                    style={{
                      cursor: "pointer",
                      background: isSelected
                        ? "var(--mantine-color-teal-light)"
                        : undefined,
                      borderColor: isSelected
                        ? "var(--mantine-color-teal-5)"
                        : undefined,
                    }}
                    onClick={() =>
                      setMoveBedSelectedId(isSelected ? null : String(bed.id))
                    }
                  >
                    <Group gap="sm" wrap="nowrap">
                      <ThemeIcon
                        size={24}
                        radius="sm"
                        variant={isSelected ? "filled" : "light"}
                        color="teal"
                      >
                        <IconArrowsExchange size={12} />
                      </ThemeIcon>
                      <Box style={{ minWidth: 0 }}>
                        <Text size="sm" fw={600} lineClamp={1}>
                          {bed.roomName} — {bed.label}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          {bed.locationPath}
                        </Text>
                      </Box>
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          )}

          <Group justify="flex-end" mt="xs">
            <Button
              variant="default"
              onClick={() => setMoveBedOpened(false)}
              disabled={moveBedLoading}
            >
              {t("cancel")}
            </Button>
            <Button
              color="teal"
              onClick={handleMoveBedSubmit}
              disabled={!moveBedSelectedId}
              loading={moveBedLoading}
              leftSection={<IconArrowsExchange size={14} />}
            >
              {t("move_bed.confirm")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
