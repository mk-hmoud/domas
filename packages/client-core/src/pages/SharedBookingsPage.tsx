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
} from "@mantine/core";
import { IconPlus, IconSearch, IconEdit } from "@tabler/icons-react";
import {
  bookings,
  students,
  beds,
  semesters,
  locations,
} from "@domas/api-client";
import {
  Booking,
  Student,
  Semester,
  CreateBookingDto,
  CreateStudentDto,
} from "@domas/ts-types";
import { CreateBookingModal, BookingsTable } from "@domas/ui";
import { useTranslation } from "react-i18next";
import { useDebouncedValue } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";

export function SharedBookingsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);

  // Data for modal & mapping
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
  const [locationsMap, setLocationsMap] = useState<Map<number, string>>(
    new Map(),
  );
  const [bedsMap, setBedsMap] = useState<Map<number, string>>(new Map());
  const [studentsMap, setStudentsMap] = useState<Map<string, string>>(
    new Map(),
  );

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const result = await bookings.findAll();
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
      const [studentsRes, bedsRes, semestersRes, locationsRes] =
        await Promise.all([
          students.findAll({ limit: 1000 }),
          beds.findAll({ limit: 10000 }),
          semesters.findAll({ limit: 1000 }),
          locations.findAll({ limit: 10000 }), // Fetch all locations to map names
        ]);

      // Update Modal Data
      setStudentList(studentsRes.data);
      setAllSemesters(semestersRes.data);

      // Build Locations Map
      const idToName = new Map<number, string>();
      locationsRes.data.forEach((loc) =>
        idToName.set(Number(loc.id), loc.name),
      );

      const locMap = new Map<number, string>();
      locationsRes.data.forEach((loc) => {
        const pathIds = loc.treePath.split(".");
        const pathNames = pathIds
          .map((id) => idToName.get(Number(id)) || "???")
          .join(" > ");
        locMap.set(Number(loc.id), pathNames);
      });
      setLocationsMap(locMap);

      // Build Beds Map
      const bMap = new Map<number, string>();
      bedsRes.data.forEach((b) => {
        const roomName = locMap.get(b.locationId) || "Unknown Room";
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
    fetchBookings();
    fetchModalData(); // Initial fetch for mappings
  }, []);

  useEffect(() => {
    if (modalOpened) {
      fetchModalData();
    }
  }, [modalOpened]);

  const handleCreateBooking = async (values: CreateBookingDto) => {
    try {
      await bookings.create(values);
      notifications.show({
        title: t("success"),
        message: t("booking_created", "Booking created successfully"),
        color: "green",
      });
      await fetchBookings();
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

  const filteredData = useMemo(() => {
    if (!debouncedSearch) return data;
    const lowerQuery = debouncedSearch.toLowerCase();

    return data.filter((booking) => {
      const studentName =
        studentsMap.get(booking.studentId)?.toLowerCase() || "";
      const bedName = bedsMap.get(booking.bedId)?.toLowerCase() || "";
      const status = booking.status.toLowerCase();

      return (
        studentName.includes(lowerQuery) ||
        bedName.includes(lowerQuery) ||
        status.includes(lowerQuery)
      );
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
        <TextInput
          placeholder={t("search_placeholder", { defaultValue: "Search..." })}
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />
      </Card>

      <Paper withBorder radius="md">
        <BookingsTable
          data={filteredData}
          studentsMap={studentsMap}
          bedsMap={bedsMap}
          onSelect={setSelectedBooking}
          onView={setSelectedBooking}
          onEdit={(booking) => console.log("Edit", booking)}
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
        locationsMap={locationsMap}
        semesters={allSemesters.map((s) => ({
          value: s.id.toString(),
          label: s.displayName,
        }))}
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
                {t("bed")}
              </Text>
              <Text fw={500}>
                {bedsMap.get(selectedBooking.bedId) || "Unknown Bed"}
              </Text>
            </Box>

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

            <Box>
              <Text size="xs" c="dimmed">
                ID
              </Text>
              <Code>{selectedBooking.id}</Code>
            </Box>

            <Button
              variant="light"
              leftSection={<IconEdit size={16} />}
              onClick={() => console.log("Edit", selectedBooking)}
            >
              {t("edit")}
            </Button>
          </Stack>
        )}
      </Drawer>
    </Container>
  );
}
