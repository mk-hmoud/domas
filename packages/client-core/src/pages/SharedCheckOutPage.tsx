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
  TextInput,
  Card,
} from "@mantine/core";
import { IconDoorExit, IconRefresh, IconSearch } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  bookings,
  students,
  beds,
  locations,
  damages,
  contracts,
} from "@domas/api-client";
import {
  Booking,
  BookingOpsStatus,
  Student,
  CreateDamageReportDto,
} from "@domas/ts-types";
import { notifications } from "@mantine/notifications";
import { CheckOutDetailsModal, CreateDamageModal } from "@domas/ui";
import { useDebouncedValue } from "@mantine/hooks";
import { useAuth } from "../context/AuthContext";

export function SharedCheckOutPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [processLoading, setProcessLoading] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);

  // Mapping states
  const [studentsMap, setStudentsMap] = useState<Map<string, Student>>(
    new Map(),
  );
  const [bedsMap, setBedsMap] = useState<Map<number, string>>(new Map());

  // Damage Modal State
  const [damageModalOpened, setDamageModalOpened] = useState(false);
  const [damageInitialValues, setDamageInitialValues] = useState<
    Partial<CreateDamageReportDto>
  >({});
  const [damageActionLoading, setDamageActionLoading] = useState(false);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const [bookingsRes, studentsRes, bedsRes, locationsRes] =
        await Promise.all([
          bookings.findAll({ status: BookingOpsStatus.ACTIVE }),
          students.findAll({ limit: 1000 }),
          beds.findAll({ limit: 1000 }),
          locations.findAll({ limit: 1000 }),
        ]);

      setData(bookingsRes);

      const sMap = new Map<string, Student>();
      studentsRes.data.forEach((s) => sMap.set(s.id, s));
      setStudentsMap(sMap);

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

  const handleCheckOut = async (notes: string) => {
    if (!selectedBooking) return null;
    setProcessLoading(true);
    try {
      const result = await bookings.checkOut(selectedBooking.id, { notes });
      notifications.show({
        title: t("success"),
        message: t("checkout_success"),
        color: "green",
      });
      fetchBookings();
      // Auto-download contract
      contracts
        .downloadContract(selectedBooking.id, "check_out")
        .catch(console.error);
      return result;
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_checkout"),
        color: "red",
      });
      return null;
    } finally {
      setProcessLoading(false);
    }
  };

  const handleReportDamage = (catalogId: number, locationId: number) => {
    setDamageInitialValues({
      catalogId,
      locationId,
      culpritIds: selectedBooking ? [selectedBooking.studentId] : [],
    });
    setDamageModalOpened(true);
  };

  const handleCreateDamageReport = async (values: CreateDamageReportDto) => {
    setDamageActionLoading(true);
    try {
      const canAutoApprove = hasPermission("damages.manage");
      await damages.createReport({ ...values, autoApprove: canAutoApprove });
      notifications.show({
        title: t("success"),
        message: t("report_created"),
        color: "green",
      });
      setDamageModalOpened(false);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_save_report"),
        color: "red",
      });
    } finally {
      setDamageActionLoading(false);
    }
  };

  const filteredData = data.filter((booking) => {
    if (!debouncedSearch) return true;
    const student = studentsMap.get(booking.studentId);
    const searchLower = debouncedSearch.toLowerCase();
    const fullName = student
      ? `${student.firstName} ${student.lastName}`.toLowerCase()
      : "";
    const studentNumber = student?.studentNumber.toLowerCase() || "";
    const bedLabel = bedsMap.get(booking.bedId)?.toLowerCase() || "";

    return (
      fullName.includes(searchLower) ||
      studentNumber.includes(searchLower) ||
      bedLabel.includes(searchLower)
    );
  });

  const rows = filteredData.map((booking) => {
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
          <Badge variant="light" color="green">
            {t("active")}
          </Badge>
        </Table.Td>
        <Table.Td>
          <Group gap={4} justify="flex-end">
            <Button
              size="xs"
              color="red"
              leftSection={<IconDoorExit size={14} />}
              onClick={() => setSelectedBooking(booking)}
            >
              {t("process_checkout")}
            </Button>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <>
      <PageHeader
        title={t("check_out")}
        subtitle={t("check_out_description")}
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
          <Card withBorder p="md" radius="md">
            <TextInput
              placeholder={t("search_placeholder")}
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
            />
          </Card>

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
                {filteredData.length === 0 && !loading && (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text ta="center" py="xl" c="dimmed">
                        {t("no_active_bookings")}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        </Stack>

        <CheckOutDetailsModal
          opened={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          booking={selectedBooking}
          onConfirm={handleCheckOut}
          onReportDamage={handleReportDamage}
          loading={processLoading}
        />

        <CreateDamageModal
          opened={damageModalOpened}
          onClose={() => setDamageModalOpened(false)}
          onSubmit={handleCreateDamageReport}
          students={Array.from(studentsMap.values())}
          loading={damageActionLoading}
          initialValues={damageInitialValues}
        />
      </PageShell>
    </>
  );
}
