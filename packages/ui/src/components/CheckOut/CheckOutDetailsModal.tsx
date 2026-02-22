import {
  Modal,
  Stack,
  Group,
  Text,
  Button,
  SimpleGrid,
  Box,
  Badge,
  Loader,
  Alert,
  Paper,
  Table,
  Stepper,
  Textarea,
  Title,
} from "@mantine/core";
import {
  IconUser,
  IconBed,
  IconInfoCircle,
  IconAlertCircle,
  IconCreditCard,
  IconCheck,
  IconMessageDots,
  IconDownload,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import {
  Booking,
  Student,
  Bed,
  Location,
  BookingInventorySnapshot,
  AccessCard,
  InventoryScope,
} from "@domas/ts-types";
import {
  students,
  beds,
  locations,
  inventory,
  accessCards,
  contracts,
} from "@domas/api-client";

interface CheckOutDetailsModalProps {
  opened: boolean;
  onClose: () => void;
  booking: Booking | null;
  onConfirm: (notes: string) => Promise<any>;
  onReportDamage: (catalogId: number, locationId: number) => void;
  loading?: boolean;
}

export function CheckOutDetailsModal({
  opened,
  onClose,
  booking,
  onConfirm,
  onReportDamage,
  loading: processing,
}: CheckOutDetailsModalProps) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === "tr";

  const [activeStep, setStep] = useState(0);
  const [student, setStudent] = useState<Student | null>(null);
  const [bed, setBed] = useState<Bed | null>(null);
  const [locationPath, setLocationPath] = useState<Location[]>([]);
  const [inventorySnapshots, setSnapshots] = useState<
    BookingInventorySnapshot[]
  >([]);
  const [activeCard, setActiveCard] = useState<AccessCard | null>(null);
  const [notes, setNotes] = useState("");
  const [damagedItemIds, setDamagedItemIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (opened && booking) {
      setStep(0);
      setNotes("");
      setDamagedItemIds(new Set());
      fetchDetails();
    } else {
      setStudent(null);
      setBed(null);
      setLocationPath([]);
      setSnapshots([]);
      setActiveCard(null);
      setError(null);
    }
  }, [opened, booking]);

  const fetchDetails = async () => {
    if (!booking) return;
    setLoading(true);
    setError(null);
    try {
      const [studentData, bedData, snapshotsData, cardsRes] = await Promise.all(
        [
          students.findOne(booking.studentId),
          beds.findOne(booking.bedId),
          inventory.findSnapshotsByBooking(booking.id),
          accessCards.findAllCards({ status: "active" as any }),
        ],
      );

      setStudent(studentData);
      setBed(bedData);
      // Filter out SHARED scope items, keep only ROOM and BED
      setSnapshots(
        snapshotsData.filter((s) => s.scope !== InventoryScope.SHARED),
      );

      // Find the card for this specific booking/student
      const bookingCard = cardsRes.find(
        (c: AccessCard) => c.currentBookingId === booking.id,
      );
      setActiveCard(bookingCard || null);

      if (bedData.locationId) {
        const path = await locations.findWithAncestors(bedData.locationId);
        setLocationPath(path);
      }
    } catch (err) {
      console.error("Failed to fetch check-out details:", err);
      setError(t("failed_to_fetch_details"));
    } finally {
      setLoading(false);
    }
  };

  const fullLocationName = locationPath.map((l) => l.name).join(" / ");

  const nextStep = () =>
    setStep((current) => (current < 2 ? current + 1 : current));
  const prevStep = () =>
    setStep((current) => (current > 0 ? current - 1 : current));

  const handleFinalConfirm = async () => {
    const result = await onConfirm(notes);
    if (result) {
      setStep(3); // Success step
    }
  };

  const handleDownloadContract = async () => {
    if (booking) {
      await contracts.downloadContract(booking.id, "check_out");
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("checkout_process", "Check-out Process")}
      size="lg"
      closeOnClickOutside={activeStep !== 3}
      closeOnEscape={activeStep !== 3}
      withCloseButton={activeStep !== 3}
    >
      <Stack gap="md">
        <Stepper
          active={activeStep}
          onStepClick={setStep}
          size="sm"
          allowNextStepsSelect={false}
        >
          <Stepper.Step label={t("verify")} description={t("verify_details")}>
            {loading ? (
              <Group justify="center" py="xl">
                <Loader size="md" />
                <Text size="sm" c="dimmed">
                  {t("loading_details")}
                </Text>
              </Group>
            ) : error ? (
              <Alert icon={<IconAlertCircle size={16} />} color="red">
                {error}
              </Alert>
            ) : (
              <Stack gap="md" mt="md">
                {/* Student Section */}
                <Box>
                  <Group gap="xs" mb="xs">
                    <IconUser
                      size={18}
                      color="var(--mantine-color-blue-filled)"
                    />
                    <Text fw={700}>{t("student_information")}</Text>
                  </Group>
                  <Paper withBorder p="sm" radius="md">
                    <SimpleGrid cols={2}>
                      <Box>
                        <Text size="xs" c="dimmed">
                          {t("full_name")}
                        </Text>
                        <Text fw={500}>
                          {student
                            ? `${student.firstName} ${student.lastName}`
                            : "-"}
                        </Text>
                      </Box>
                      <Box>
                        <Text size="xs" c="dimmed">
                          {t("student_number")}
                        </Text>
                        <Text fw={500}>{student?.studentNumber || "-"}</Text>
                      </Box>
                    </SimpleGrid>
                  </Paper>
                </Box>

                <Box>
                  <Group gap="xs" mb="xs">
                    <IconBed
                      size={18}
                      color="var(--mantine-color-green-filled)"
                    />
                    <Text fw={700}>{t("assigned_location")}</Text>
                  </Group>
                  <Paper withBorder p="sm" radius="md">
                    <Stack gap="xs">
                      <Box>
                        <Text size="xs" c="dimmed">
                          {t("location_path")}
                        </Text>
                        <Text fw={500}>{fullLocationName || "-"}</Text>
                      </Box>
                      <Box>
                        <Text size="xs" c="dimmed">
                          {t("bed_label")}
                        </Text>
                        <Badge size="lg" variant="light" color="green">
                          {bed?.label || "-"}
                        </Badge>
                      </Box>
                    </Stack>
                  </Paper>
                </Box>

                {/* Card Section */}
                <Box>
                  <Group gap="xs" mb="xs">
                    <IconCreditCard
                      size={18}
                      color="var(--mantine-color-indigo-filled)"
                    />
                    <Text fw={700}>{t("access_card")}</Text>
                  </Group>
                  <Paper withBorder p="sm" radius="md">
                    {activeCard ? (
                      <Group justify="space-between">
                        <Box>
                          <Text size="xs" c="dimmed">
                            {t("assigned_card")}
                          </Text>
                          <Text fw={700}>#{activeCard.cardNumber}</Text>
                        </Box>
                        <Badge color="blue">{t("active")}</Badge>
                      </Group>
                    ) : (
                      <Text size="sm" c="dimmed">
                        {t("no_card_assigned")}
                      </Text>
                    )}
                  </Paper>
                </Box>
              </Stack>
            )}
          </Stepper.Step>

          <Stepper.Step
            label={t("inventory")}
            description={t("verify_inventory")}
          >
            <Stack gap="md" mt="md">
              <Alert icon={<IconInfoCircle size={16} />} color="blue">
                {t("checkout_inventory_instruction")}
              </Alert>

              <Paper
                withBorder
                radius="md"
                p={0}
                style={{ overflow: "hidden" }}
              >
                <Table striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t("item")}</Table.Th>
                      <Table.Th>{t("quantity")}</Table.Th>
                      <Table.Th ta="right">{t("status")}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {inventorySnapshots.map((item) => {
                      const isDamaged = damagedItemIds.has(item.id);
                      return (
                        <Table.Tr key={item.id}>
                          <Table.Td>
                            {isTr ? item.nameTr : item.nameEn}
                          </Table.Td>
                          <Table.Td>{item.quantity}</Table.Td>
                          <Table.Td>
                            <Group gap={4} justify="flex-end">
                              <Button
                                size="compact-xs"
                                variant={isDamaged ? "default" : "filled"}
                                color="green"
                                onClick={() => {
                                  const newSet = new Set(damagedItemIds);
                                  newSet.delete(item.id);
                                  setDamagedItemIds(newSet);
                                }}
                              >
                                OK
                              </Button>
                              <Button
                                size="compact-xs"
                                variant={isDamaged ? "filled" : "default"}
                                color="red"
                                onClick={() => {
                                  const newSet = new Set(damagedItemIds);
                                  newSet.add(item.id);
                                  setDamagedItemIds(newSet);
                                  onReportDamage(
                                    item.catalogId,
                                    bed!.locationId,
                                  );
                                }}
                              >
                                {t("damaged")}
                              </Button>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                    {inventorySnapshots.length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={3}>
                          <Text ta="center" size="xs" c="dimmed" py="xs">
                            {t("no_inventory_items")}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Stack>
          </Stepper.Step>

          <Stepper.Step label={t("finalize")} description={t("add_notes")}>
            <Stack gap="md" mt="md">
              <Group gap="xs" mb="xs">
                <IconMessageDots
                  size={18}
                  color="var(--mantine-color-blue-filled)"
                />
                <Text fw={700}>{t("checkout_notes")}</Text>
              </Group>

              <Alert icon={<IconInfoCircle size={16} />} color="blue">
                {t("return_card_instruction")}
              </Alert>

              <Textarea
                label={t("notes")}
                placeholder={t("add_notes_placeholder")}
                minRows={4}
                value={notes}
                onChange={(e) => setNotes(e.currentTarget.value)}
              />
            </Stack>
          </Stepper.Step>

          <Stepper.Completed>
            <Stack gap="xl" py="xl" align="center">
              <Box ta="center">
                <IconCheck
                  size={48}
                  color="var(--mantine-color-green-filled)"
                />
                <Title order={3} mt="md">
                  {t("checkout_completed_title")}
                </Title>
                <Text c="dimmed" mt="xs">
                  {t("checkout_completed_message")}
                </Text>
              </Box>

              <Group gap="sm">
                <Button
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={handleDownloadContract}
                >
                  {t("download_contract", "Download Contract")}
                </Button>
                <Button onClick={onClose} size="md">
                  {t("finish")}
                </Button>
              </Group>
            </Stack>
          </Stepper.Completed>
        </Stepper>

        {activeStep < 3 && (
          <Group justify="flex-end" mt="xl">
            {activeStep < 2 ? (
              <>
                <Button
                  variant="default"
                  onClick={onClose}
                  disabled={processing}
                >
                  {t("cancel")}
                </Button>
                <Button onClick={nextStep} disabled={loading || !!error}>
                  {t("next")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="default"
                  onClick={prevStep}
                  disabled={processing}
                >
                  {t("back")}
                </Button>
                <Button
                  color="red"
                  onClick={handleFinalConfirm}
                  loading={processing}
                >
                  {t("complete_checkout")}
                </Button>
              </>
            )}
          </Group>
        )}
      </Stack>
    </Modal>
  );
}
