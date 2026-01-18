import { useEffect, useState } from "react";
import {
  Title,
  Button,
  Group,
  Container,
  Table,
  Badge,
  LoadingOverlay,
  Paper,
  Text,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { bookings, users, beds, semesters } from "@domas/api-client";
import {
  Booking,
  User,
  Bed,
  Semester,
  UserRole,
  BedStatus,
  CreateBookingDto,
} from "@domas/ts-types";
import { CreateBookingModal } from "@domas/ui";
import { useTranslation } from "react-i18next";

export function SharedBookingsPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);

  // Data for modal
  const [students, setStudents] = useState<User[]>([]);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const result = await bookings.findAll();
      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModalData = async () => {
    try {
      const [studentsRes, bedsRes, semestersRes] = await Promise.all([
        users.findAll({ role: [UserRole.STUDENT], limit: 1000 }),
        beds.findAll({ status: BedStatus.AVAILABLE, limit: 1000 }),
        semesters.findAll({ limit: 1000 }),
      ]);
      setStudents(studentsRes.data);
      setAvailableBeds(bedsRes.data);
      setAllSemesters(semestersRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (modalOpened) {
      fetchModalData();
    }
  }, [modalOpened]);

  const handleCreateBooking = async (values: CreateBookingDto) => {
    try {
      await bookings.create(values);
      await fetchBookings();
      setModalOpened(false);
    } catch (error) {
      console.error(error);
    }
  };

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

      <Paper withBorder radius="md">
        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t("student")}</Table.Th>
              <Table.Th>{t("bed")}</Table.Th>
              <Table.Th>{t("status")}</Table.Th>
              <Table.Th>{t("start_date")}</Table.Th>
              <Table.Th>{t("end_date")}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.map((booking) => (
              <Table.Tr key={booking.id}>
                <Table.Td>{booking.studentId}</Table.Td>
                <Table.Td>{booking.bedId}</Table.Td>
                <Table.Td>
                  <Badge variant="light">{booking.status}</Badge>
                </Table.Td>
                <Table.Td>
                  {new Date(booking.startDate).toLocaleDateString()}
                </Table.Td>
                <Table.Td>
                  {new Date(booking.endDate).toLocaleDateString()}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        {data.length === 0 && !loading && (
          <Text c="dimmed" ta="center" py="xl">
            {t("no_bookings_found", { defaultValue: "No bookings found" })}
          </Text>
        )}
      </Paper>

      <CreateBookingModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onSubmit={handleCreateBooking}
        students={students.map((s) => ({ value: s.id, label: s.email }))}
        beds={availableBeds.map((b) => ({
          value: b.id.toString(),
          label: `Bed ${b.label} (ID: ${b.id})`,
        }))}
        semesters={allSemesters.map((s) => ({
          value: s.id.toString(),
          label: s.displayName,
        }))}
      />
    </Container>
  );
}
