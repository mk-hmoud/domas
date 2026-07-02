import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, PageShell } from "@domas/ui";
import {
  Stack,
  Paper,
  Center,
  Loader,
  Text,
  Drawer,
  Avatar,
  Badge,
  Button,
  Group,
  Divider,
  Modal,
  TextInput,
  Textarea,
  Select,
  Alert,
} from "@mantine/core";
import {
  IconBrandWhatsapp,
  IconMail,
  IconLogin,
  IconLogout,
  IconArrowsExchange,
  IconMessageCircle,
  IconClockHour4,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  RoomPlanLocationPicker,
  RoomPlanFilters,
  RoomPlanFiltersValue,
  RoomPlanGrid,
  RoomPlanStudentViewKind,
  EmptyState,
  LabelValue,
  getRoomPlanStatus,
  CreateBookingModal,
} from "@domas/ui";
import {
  locations,
  students,
  semesters as semestersApi,
  bookings,
  conversations,
} from "@domas/api-client";
import {
  RoomPlanRoom,
  RoomHistory,
  Student,
  Semester,
  CreateBookingDto,
  CreateStudentDto,
  SemesterStatus,
} from "@domas/ts-types";
import { notifications } from "@mantine/notifications";
import { useAuth } from "../context/AuthContext";
import { useCountries, useDepartments } from "../hooks/useLookups";

export function SharedRoomPlanPage() {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === "tr";
  const { countries } = useCountries();
  const { departments } = useDepartments();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canMessage = hasPermission("messages.manage");

  const [locationId, setLocationId] = useState<number | null>(null);
  const [rooms, setRooms] = useState<RoomPlanRoom[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<RoomPlanFiltersValue>({
    gender: "all",
    status: "all",
    search: "",
  });

  const [bookingModalOpened, setBookingModalOpened] = useState(false);
  const [bookingBedId, setBookingBedId] = useState<number | null>(null);
  const [bookingRoomGenderLock, setBookingRoomGenderLock] = useState<
    string | null
  >(null);
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
  const [selectedSemesterId, setSelectedSemesterId] = useState<number | null>(
    null,
  );

  const [studentDetailId, setStudentDetailId] = useState<string | null>(null);
  const [studentDetailKind, setStudentDetailKind] =
    useState<RoomPlanStudentViewKind | null>(null);
  const [studentDetail, setStudentDetail] = useState<Student | null>(null);
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);

  const [messageModalOpened, setMessageModalOpened] = useState(false);
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageSending, setMessageSending] = useState(false);

  const [historyRoomId, setHistoryRoomId] = useState<number | null>(null);
  const [historyRoomName, setHistoryRoomName] = useState<string>("");
  const [roomHistory, setRoomHistory] = useState<RoomHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchRoomPlan = async (id: number, semId?: number | null) => {
    setLoading(true);
    try {
      const data = await locations.getRoomPlan(id, semId ?? undefined);
      setRooms(data);
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
    if (locationId) {
      fetchRoomPlan(locationId, selectedSemesterId);
    } else {
      setRooms([]);
    }
  }, [locationId, selectedSemesterId]);

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        const [studentsRes, semestersRes] = await Promise.all([
          students.findAll({ limit: 1000, eligible: true }),
          semestersApi.findAll({ limit: 1000 }),
        ]);
        setStudentList(studentsRes.data);
        setAllSemesters(semestersRes.data);
        const active = semestersRes.data.find(
          (s) => s.status === SemesterStatus.ACTIVE,
        );
        if (active) setSelectedSemesterId(active.id);
      } catch (error) {
        console.error("Failed to fetch booking data:", error);
      }
    };
    fetchBookingData();
  }, []);

  const filteredRooms = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return rooms.filter((room) => {
      if (filters.gender !== "all" && room.genderLock !== filters.gender) {
        return false;
      }
      if (filters.status !== "all") {
        const status = getRoomPlanStatus(room);
        if (filters.status !== status) return false;
      }
      if (search) {
        const matchesRoom = room.name.toLowerCase().includes(search);
        const matchesOccupant = room.beds.some((b) =>
          b.occupant
            ? `${b.occupant.firstName} ${b.occupant.lastName} ${b.occupant.studentNumber}`
                .toLowerCase()
                .includes(search)
            : false,
        );
        if (!matchesRoom && !matchesOccupant) return false;
      }
      return true;
    });
  }, [rooms, filters]);

  // When the selected scope spans more than one floor (e.g. a whole building),
  // group rooms by their immediate parent location for readability.
  const groupedRooms = useMemo(() => {
    const groups = new Map<
      number,
      { id: number; name: string; rooms: RoomPlanRoom[] }
    >();
    for (const room of filteredRooms) {
      const group = groups.get(room.parentLocationId);
      if (group) {
        group.rooms.push(room);
      } else {
        groups.set(room.parentLocationId, {
          id: room.parentLocationId,
          name:
            isTr && room.parentLocationNameTr
              ? room.parentLocationNameTr
              : room.parentLocationName,
          rooms: [room],
        });
      }
    }
    return Array.from(groups.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [filteredRooms]);

  const handleCreateBooking = useCallback(
    (bedId: number) => {
      setBookingBedId(bedId);
      const room = rooms.find((r) => r.beds.some((b) => b.id === bedId));
      setBookingRoomGenderLock(room?.genderLock ?? null);
      setBookingModalOpened(true);
    },
    [rooms],
  );

  const handleViewHistory = useCallback(
    async (roomId: number) => {
      const room = rooms.find((r) => r.id === roomId);
      setHistoryRoomId(roomId);
      setHistoryRoomName(
        isTr && room?.nameTr ? room.nameTr : (room?.name ?? ""),
      );
      setRoomHistory(null);
      setHistoryLoading(true);
      try {
        const data = await locations.getRoomHistory(roomId);
        setRoomHistory(data);
      } catch {
        notifications.show({
          title: t("error"),
          message: t("failed_to_fetch_data"),
          color: "red",
        });
      } finally {
        setHistoryLoading(false);
      }
    },
    [rooms, isTr, t],
  );

  const handleSubmitBooking = async (values: CreateBookingDto) => {
    try {
      await bookings.create(values);
      notifications.show({
        title: t("success"),
        message: t("booking_created", {
          defaultValue: "Booking created successfully",
        }),
        color: "green",
      });
      setBookingModalOpened(false);
      if (locationId) await fetchRoomPlan(locationId, selectedSemesterId);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_create_booking", {
          defaultValue: "Failed to create booking",
        }),
        color: "red",
      });
    }
  };

  const handleViewStudent = useCallback(
    async (studentId: string, kind: RoomPlanStudentViewKind) => {
      setStudentDetailId(studentId);
      setStudentDetailKind(kind);
      setStudentDetailLoading(true);
      try {
        const detail = await students.findOne(studentId);
        setStudentDetail(detail);
      } catch (error) {
        notifications.show({
          title: t("error"),
          message: t("failed_to_fetch_data"),
          color: "red",
        });
      } finally {
        setStudentDetailLoading(false);
      }
    },
    [t],
  );

  const handleSendMessage = async () => {
    if (!studentDetail || !messageBody.trim()) return;
    setMessageSending(true);
    try {
      await conversations.start({
        studentId: studentDetail.id,
        subject: messageSubject.trim() || undefined,
        body: messageBody.trim(),
      });
      notifications.show({
        title: t("success"),
        message: t("message_sent", { defaultValue: "Message sent" }),
        color: "green",
      });
      setMessageModalOpened(false);
      setMessageSubject("");
      setMessageBody("");
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_send_message", {
          defaultValue: "Failed to send message",
        }),
        color: "red",
      });
    } finally {
      setMessageSending(false);
    }
  };

  const getCountryName = (code?: string) => {
    if (!code) return "—";
    const found = countries.find((c) => c.code === code);
    return found ? (isTr ? found.nameTr : found.nameEn) : code;
  };

  const handleCreateStudent = async (values: CreateStudentDto) => {
    try {
      await students.create(values);
      notifications.show({
        title: t("success"),
        message: t("student_created", {
          defaultValue: "Student created successfully",
        }),
        color: "green",
      });
      const studentsRes = await students.findAll({
        limit: 1000,
        eligible: true,
      });
      setStudentList(studentsRes.data);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_create_student", {
          defaultValue: "Failed to create student",
        }),
        color: "red",
      });
    }
  };

  const selectedSemester = allSemesters.find(
    (s) => s.id === selectedSemesterId,
  );
  const isHistorical = selectedSemester
    ? selectedSemester.status !== SemesterStatus.ACTIVE
    : false;

  return (
    <>
      <PageHeader title={t("room_plan", { defaultValue: "Room Plan" })} />
      <PageShell size="xl">
        <Stack gap="md">
          <Paper withBorder p="sm" radius="md">
            <Group align="flex-end" gap="sm" wrap="wrap">
              <Select
                label={t("semester_label")}
                placeholder={t("select_semester")}
                data={allSemesters.map((s) => ({
                  value: s.id.toString(),
                  label: s.displayName,
                }))}
                value={selectedSemesterId?.toString() ?? null}
                onChange={(val) => {
                  setSelectedSemesterId(val ? parseInt(val, 10) : null);
                  setLocationId(null);
                }}
                w={220}
              />
              <RoomPlanLocationPicker
                onChange={setLocationId}
                key={selectedSemesterId ?? "none"}
              />
            </Group>
          </Paper>

          {isHistorical && selectedSemester && (
            <Alert
              icon={<IconClockHour4 size={16} />}
              color="blue"
              variant="light"
              radius="md"
            >
              {t("viewing_historical_semester", {
                defaultValue:
                  "Viewing historical data for {{name}} — read only",
                name: selectedSemester.displayName,
              })}
            </Alert>
          )}

          {locationId && (
            <RoomPlanFilters value={filters} onChange={setFilters} />
          )}

          {!locationId ? (
            <EmptyState
              title={t("select_floor_prompt", {
                defaultValue: "Select a location to view its room plan",
              })}
            />
          ) : loading ? (
            <Center h={200}>
              <Loader />
            </Center>
          ) : groupedRooms.length > 1 ? (
            <Stack gap="lg">
              {groupedRooms.map((group) => (
                <Stack key={group.id} gap="xs">
                  <Text fw={700} size="sm">
                    {group.name}
                  </Text>
                  <RoomPlanGrid
                    rooms={group.rooms}
                    onCreateBooking={handleCreateBooking}
                    onViewStudent={handleViewStudent}
                    onViewHistory={handleViewHistory}
                    isHistorical={isHistorical}
                  />
                </Stack>
              ))}
            </Stack>
          ) : (
            <RoomPlanGrid
              rooms={filteredRooms}
              onCreateBooking={handleCreateBooking}
              onViewStudent={handleViewStudent}
              onViewHistory={handleViewHistory}
              isHistorical={isHistorical}
            />
          )}
        </Stack>

        <CreateBookingModal
          opened={bookingModalOpened && !isHistorical}
          onClose={() => setBookingModalOpened(false)}
          onSubmit={handleSubmitBooking}
          onCreateStudent={handleCreateStudent}
          students={studentList
            .filter(
              (s) =>
                !bookingRoomGenderLock || s.gender === bookingRoomGenderLock,
            )
            .map((s) => ({
              value: s.id,
              label: `${s.firstName} ${s.lastName} (${s.studentNumber}) · ${s.nationalityCode}`,
            }))}
          semesters={allSemesters}
          countries={countries}
          departments={departments}
          initialBedId={bookingBedId}
        />

        <Drawer
          opened={!!studentDetailId}
          onClose={() => {
            setStudentDetailId(null);
            setStudentDetailKind(null);
            setStudentDetail(null);
          }}
          title={t("student_details", { defaultValue: "Student Details" })}
          position="right"
          size="md"
        >
          {studentDetailLoading || !studentDetail ? (
            <Center h={200}>
              <Loader />
            </Center>
          ) : (
            <Stack gap="lg">
              <Center>
                <Avatar
                  src={studentDetail.photoUrl}
                  size={96}
                  radius="xl"
                  color="initials"
                  name={`${studentDetail.firstName} ${studentDetail.lastName}`}
                />
              </Center>

              <Group justify="space-between" align="flex-start">
                <Text fw={700} size="md">
                  {studentDetail.firstName} {studentDetail.lastName}
                </Text>
                <Group gap={4}>
                  {studentDetail.enrollmentStatus === "pending" && (
                    <Badge color="yellow" size="sm">
                      {t("pending_approval", {
                        defaultValue: "Pending Approval",
                      })}
                    </Badge>
                  )}
                  {studentDetail.enrollmentStatus === "enrolled" &&
                    studentDetail.hasActiveBooking && (
                      <Badge color="teal" size="sm">
                        {t("active", { defaultValue: "Active" })}
                      </Badge>
                    )}
                  <Badge
                    color={studentDetail.isActive ? "green" : "gray"}
                    size="sm"
                  >
                    {studentDetail.isActive
                      ? t("enabled", { defaultValue: "Enabled" })
                      : t("disabled", { defaultValue: "Disabled" })}
                  </Badge>
                </Group>
              </Group>

              <Group grow>
                <LabelValue label={t("student_number")}>
                  {studentDetail.studentNumber}
                </LabelValue>
                <LabelValue label={t("national_id")}>
                  {studentDetail.nationalId}
                </LabelValue>
              </Group>

              <Group grow>
                <LabelValue label={t("gender")}>
                  {t(studentDetail.gender)}
                </LabelValue>
                <LabelValue label={t("nationality")}>
                  {getCountryName(studentDetail.nationalityCode)}
                </LabelValue>
              </Group>

              <Group grow>
                <LabelValue label={t("birth_date")}>
                  {studentDetail.birthDate
                    ? new Date(studentDetail.birthDate).toLocaleDateString(
                        "en-GB",
                      )
                    : "—"}
                </LabelValue>
                <LabelValue
                  label={t("birth_place", { defaultValue: "Birth Place" })}
                >
                  {studentDetail.birthPlace || "—"}
                </LabelValue>
              </Group>

              <LabelValue label={t("department")}>
                {studentDetail.department || "—"}
              </LabelValue>

              <LabelValue label={t("email")}>
                {studentDetail.email || "—"}
              </LabelValue>

              <Group grow>
                <LabelValue label={t("phone_number")}>
                  {studentDetail.phoneNumber || "—"}
                </LabelValue>
                <LabelValue
                  label={t("whatsapp_number", { defaultValue: "WhatsApp" })}
                >
                  {studentDetail.whatsappNumber || "—"}
                </LabelValue>
              </Group>

              <Divider />

              <Group grow>
                {studentDetail.email && (
                  <Button
                    variant="light"
                    color="blue"
                    leftSection={<IconMail size={16} />}
                    onClick={() =>
                      window.open(`mailto:${studentDetail.email}`, "_blank")
                    }
                  >
                    {t("email_verb", { defaultValue: "Email" })}
                  </Button>
                )}
                {studentDetail.whatsappNumber && (
                  <Button
                    variant="light"
                    color="green"
                    leftSection={<IconBrandWhatsapp size={16} />}
                    onClick={() =>
                      window.open(
                        `https://wa.me/${studentDetail.whatsappNumber!.replace(/\D/g, "")}`,
                        "_blank",
                      )
                    }
                  >
                    {t("whatsapp", { defaultValue: "WhatsApp" })}
                  </Button>
                )}
                {canMessage && (
                  <Button
                    variant="light"
                    color="indigo"
                    leftSection={<IconMessageCircle size={16} />}
                    onClick={() => setMessageModalOpened(true)}
                  >
                    {t("message", { defaultValue: "Message" })}
                  </Button>
                )}
              </Group>

              <Button
                variant="default"
                onClick={() => navigate("/dashboard/students")}
              >
                {t("open_in_students", { defaultValue: "Open in Students" })}
              </Button>

              {studentDetailKind && (
                <>
                  <Divider
                    label={t("quick_operations", {
                      defaultValue: "Quick Operations",
                    })}
                    labelPosition="center"
                  />
                  <Group grow>
                    {studentDetailKind === "pending" && (
                      <Button
                        variant="light"
                        color="green"
                        leftSection={<IconLogin size={16} />}
                        onClick={() => navigate("/dashboard/check-in")}
                      >
                        {t("check_in", { defaultValue: "Check In" })}
                      </Button>
                    )}
                    {studentDetailKind === "occupant" && (
                      <>
                        <Button
                          variant="light"
                          color="orange"
                          leftSection={<IconArrowsExchange size={16} />}
                          onClick={() => navigate("/dashboard/transfers")}
                        >
                          {t("transfer", { defaultValue: "Transfer" })}
                        </Button>
                        <Button
                          variant="light"
                          color="red"
                          leftSection={<IconLogout size={16} />}
                          onClick={() => navigate("/dashboard/check-out")}
                        >
                          {t("check_out", { defaultValue: "Check Out" })}
                        </Button>
                      </>
                    )}
                  </Group>
                </>
              )}
            </Stack>
          )}
        </Drawer>

        <Modal
          opened={messageModalOpened}
          onClose={() => setMessageModalOpened(false)}
          title={t("message_student", {
            defaultValue: "Message {{name}}",
            name: studentDetail
              ? `${studentDetail.firstName} ${studentDetail.lastName}`
              : "",
          })}
          size="md"
        >
          <Stack gap="md">
            <TextInput
              label={t("subject", { defaultValue: "Subject (optional)" })}
              value={messageSubject}
              onChange={(e) => setMessageSubject(e.currentTarget.value)}
            />
            <Textarea
              label={t("message", { defaultValue: "Message" })}
              required
              minRows={4}
              autosize
              value={messageBody}
              onChange={(e) => setMessageBody(e.currentTarget.value)}
            />
            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => setMessageModalOpened(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                onClick={handleSendMessage}
                loading={messageSending}
                disabled={!messageBody.trim()}
              >
                {t("send", { defaultValue: "Send" })}
              </Button>
            </Group>
          </Stack>
        </Modal>

        <Drawer
          opened={!!historyRoomId}
          onClose={() => {
            setHistoryRoomId(null);
            setRoomHistory(null);
          }}
          title={
            historyRoomName ||
            t("room_history", { defaultValue: "Room History" })
          }
          position="right"
          size="lg"
        >
          <Stack gap="md">
            <Alert
              icon={<IconClockHour4 size={16} />}
              color="yellow"
              variant="light"
            >
              {t("flag_history_limit_notice", {
                defaultValue:
                  "Flag change history is available for up to 3 years. Older changes may not appear.",
              })}
            </Alert>

            {historyLoading ? (
              <Center h={200}>
                <Loader />
              </Center>
            ) : roomHistory ? (
              <>
                <Text fw={700} size="sm">
                  {t("flag_changes", { defaultValue: "Flag Changes" })}
                </Text>
                {roomHistory.flagChanges.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    {t("no_flag_changes", {
                      defaultValue: "No flag changes recorded.",
                    })}
                  </Text>
                ) : (
                  <Stack gap="xs">
                    {roomHistory.flagChanges.map((entry, i) => (
                      <Paper key={i} withBorder p="xs" radius="md">
                        <Group justify="space-between" mb={4}>
                          <Text size="xs" c="dimmed">
                            {new Date(entry.eventTimestamp).toLocaleString()}
                          </Text>
                          {entry.performedBy && (
                            <Badge size="xs" variant="light" color="gray">
                              {entry.performedBy}
                            </Badge>
                          )}
                        </Group>
                        <Stack gap={2}>
                          {entry.changedFields.map((cf) => (
                            <Text key={cf.field} size="xs">
                              <Text span fw={600}>
                                {cf.field}
                              </Text>
                              {": "}
                              <Text span c="red">
                                {String(cf.oldValue ?? "—")}
                              </Text>
                              {" → "}
                              <Text span c="green">
                                {String(cf.newValue ?? "—")}
                              </Text>
                            </Text>
                          ))}
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}

                <Divider />

                <Text fw={700} size="sm">
                  {t("resident_history", { defaultValue: "Resident History" })}
                </Text>
                {roomHistory.residents.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    {t("no_resident_history", {
                      defaultValue: "No residents recorded.",
                    })}
                  </Text>
                ) : (
                  <Stack gap="xs">
                    {roomHistory.residents.map((entry) => (
                      <Paper
                        key={entry.bookingId}
                        withBorder
                        p="xs"
                        radius="md"
                      >
                        <Group justify="space-between" wrap="nowrap" mb={4}>
                          <Group gap={6} wrap="nowrap">
                            <Avatar
                              size={28}
                              radius="xl"
                              color="initials"
                              name={entry.studentName}
                            />
                            <div>
                              <Text size="sm" fw={600}>
                                {entry.studentName}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {entry.studentNumber} · {entry.nationalityCode}
                              </Text>
                            </div>
                          </Group>
                          <Stack gap={2} align="flex-end">
                            <Badge size="xs" variant="light" color="blue">
                              {t("bed_word", { defaultValue: "Bed" })}{" "}
                              {entry.bedLabel}
                            </Badge>
                            <Badge size="xs" variant="light" color="gray">
                              {entry.semesterName}
                            </Badge>
                          </Stack>
                        </Group>
                        <Text size="xs" c="dimmed">
                          {new Date(entry.startDate).toLocaleDateString()} –{" "}
                          {new Date(entry.endDate).toLocaleDateString()}
                          {entry.checkedInAt &&
                            ` · ${t("checked_in", { defaultValue: "Checked in" })}: ${new Date(entry.checkedInAt).toLocaleDateString()}`}
                          {entry.checkedOutAt &&
                            ` · ${t("checked_out", { defaultValue: "Checked out" })}: ${new Date(entry.checkedOutAt).toLocaleDateString()}`}
                        </Text>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </>
            ) : null}
          </Stack>
        </Drawer>
      </PageShell>
    </>
  );
}
