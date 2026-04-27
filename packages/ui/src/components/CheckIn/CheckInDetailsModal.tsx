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
  Checkbox,
  Stepper,
  Select,
  Title,
} from "@mantine/core";
import {
  IconUser,
  IconBed,
  IconInfoCircle,
  IconAlertCircle,
  IconArchive,
  IconCreditCard,
  IconCheck,
  IconDownload,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import {
  Booking,
  Student,
  Bed,
  Location,
  InventoryAssignment,
  AccessCard,
  CardStatus,
} from "@domas/ts-types";
import {
  students,
  beds,
  locations,
  inventory,
  accessCards,
  contracts,
} from "@domas/api-client";

interface CheckInDetailsModalProps {
  opened: boolean;
  onClose: () => void;
  booking: Booking | null;
  onConfirm: (
    selectedExtraCatalogIds: number[],
    specificCardNumber?: number,
    autoAssignCard?: boolean,
  ) => Promise<any>;
  loading?: boolean;
}

export function CheckInDetailsModal({
  opened,
  onClose,
  booking,
  onConfirm,
  loading: processing,
}: CheckInDetailsModalProps) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === "tr";

  const [activeStep, setStep] = useState(0);
  const [student, setStudent] = useState<Student | null>(null);
  const [bed, setBed] = useState<Bed | null>(null);
  const [locationPath, setLocationPath] = useState<Location[]>([]);
  const [assignedInventory, setInventory] = useState<InventoryAssignment[]>([]);
  const [availableExtras, setAvailableExtras] = useState<any[]>([]);
  const [selectedExtraCatalogIds, setSelectedExtraCatalogIds] = useState<
    number[]
  >([]);
  const [availableCards, setAvailableCards] = useState<AccessCard[]>([]);
  const [selectedCardNumber, setSelectedCardNumber] = useState<string | null>(
    null,
  );
  const [autoAssignCard, setAutoAssignCard] = useState(false);
  const [assignedCardNumber, setAssignedCardNumber] = useState<number | null>(
    null,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (opened && booking) {
      setStep(0);
      setSelectedExtraCatalogIds([]);
      setSelectedCardNumber(null);
      setAutoAssignCard(false);
      setAssignedCardNumber(null);
      fetchDetails();
    } else {
      setStudent(null);
      setBed(null);
      setLocationPath([]);
      setInventory([]);
      setAvailableExtras([]);
      setAvailableCards([]);
      setError(null);
    }
  }, [opened, booking]);

  const fetchDetails = async () => {
    if (!booking) return;
    setLoading(true);
    setError(null);
    try {
      const [studentData, bedData, extrasData, cardsRes] = await Promise.all([
        students.findOne(booking.studentId),
        beds.findOne(booking.bedId),
        inventory.getAvailableExtras(),
        accessCards.findAllCards({ status: CardStatus.AVAILABLE }),
      ]);

      setStudent(studentData);
      setBed(bedData);
      setAvailableExtras(extrasData);
      setAvailableCards(cardsRes);

      if (bedData.locationId) {
        const path = await locations.findWithAncestors(bedData.locationId);
        setLocationPath(path);

        const locationIds = path.map((l) => l.id);
        const inventories = await Promise.all([
          inventory.findByBed(booking.bedId),
          ...locationIds.map((lid) => inventory.findByLocation(lid)),
        ]);

        const allInventory = inventories.flat();
        setInventory(allInventory);
      }
    } catch (err) {
      console.error("Failed to fetch check-in details:", err);
      setError(
        t("failed_to_fetch_details", "Failed to load check-in details."),
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleExtra = (id: number) => {
    setSelectedExtraCatalogIds((current) =>
      current.includes(id) ? current.filter((i) => i !== id) : [...current, id],
    );
  };

  const fullLocationName = locationPath.map((l) => l.name).join(" / ");

  const nextStep = () =>
    setStep((current) => (current < 2 ? current + 1 : current));
  const prevStep = () =>
    setStep((current) => (current > 0 ? current - 1 : current));

  const handleFinalConfirm = async () => {
    const result = await onConfirm(
      selectedExtraCatalogIds,
      selectedCardNumber ? parseInt(selectedCardNumber) : undefined,
      autoAssignCard,
    );
    if (result) {
      if (result.assignedCardNumber) {
        setAssignedCardNumber(result.assignedCardNumber);
      }
      setStep(3); // Go to completed step
    }
  };

  const handleDownloadContract = async () => {
    if (booking) {
      await contracts.downloadContract(booking.id);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("check_in_process", "Check-in Process")}
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
          <Stepper.Step
            label={t("verify", "Verify")}
            description={t("verify_details", "Verify details")}
          >
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
                          {t("bed_label_field", { defaultValue: "Bed Label" })}
                        </Text>
                        <Badge size="lg" variant="light" color="green">
                          {bed?.label || "-"}
                        </Badge>
                      </Box>
                    </Stack>
                  </Paper>
                </Box>

                <Box>
                  <Group gap="xs" mb="xs">
                    <IconArchive
                      size={18}
                      color="var(--mantine-color-cyan-filled)"
                    />
                    <Text fw={700}>{t("inventory_assignment_preview")}</Text>
                  </Group>
                  <Paper
                    withBorder
                    radius="md"
                    p={0}
                    style={{ overflow: "hidden" }}
                  >
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>{t("item")}</Table.Th>
                          <Table.Th>{t("quantity")}</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {assignedInventory.map((inv) => (
                          <Table.Tr key={inv.id}>
                            <Table.Td>
                              {isTr ? inv.item?.nameTr : inv.item?.nameEn}
                            </Table.Td>
                            <Table.Td>{inv.quantity}</Table.Td>
                          </Table.Tr>
                        ))}
                        {assignedInventory.length === 0 && (
                          <Table.Tr>
                            <Table.Td colSpan={2}>
                              <Text ta="center" size="xs" c="dimmed" py="xs">
                                {t("no_inventory_items")}
                              </Text>
                            </Table.Td>
                          </Table.Tr>
                        )}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                </Box>
              </Stack>
            )}
          </Stepper.Step>

          <Stepper.Step
            label={t("extras", "Extras")}
            description={t("opt_in_extras", "Optional items")}
          >
            <Stack gap="md" mt="md">
              <Alert icon={<IconInfoCircle size={16} />} color="blue">
                {t("extras_instruction")}
              </Alert>

              <Paper
                withBorder
                radius="md"
                p={0}
                style={{ overflow: "hidden" }}
              >
                <Table highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: 40 }} />
                      <Table.Th>{t("item")}</Table.Th>
                      <Table.Th>{t("price")}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {availableExtras.map((extra) => (
                      <Table.Tr
                        key={extra.id}
                        onClick={() => toggleExtra(extra.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <Table.Td>
                          <Checkbox
                            checked={selectedExtraCatalogIds.includes(extra.id)}
                            onChange={() => {}}
                            tabIndex={-1}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {isTr ? extra.nameTr : extra.nameEn}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {extra.basePriceTry} TRY / {extra.basePriceForeign}{" "}
                            {extra.foreignCurrencyCode}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    {availableExtras.length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={3}>
                          <Text ta="center" size="sm" c="dimmed" py="xl">
                            {t("no_extras_available")}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Stack>
          </Stepper.Step>

          <Stepper.Step label={t("access_card")} description={t("assign_card")}>
            <Stack gap="md" mt="md">
              <Group gap="xs" mb="xs">
                <IconCreditCard
                  size={18}
                  color="var(--mantine-color-indigo-filled)"
                />
                <Text fw={700}>{t("card_assignment")}</Text>
              </Group>

              <Alert icon={<IconInfoCircle size={16} />} color="blue">
                {t("card_instruction")}
              </Alert>

              {/* 
                Auto-assign logic: When checked, the backend will automatically 
                find the first available card in the pool for this booking's location.
              */}
              <Box>
                <Checkbox
                  label={t("auto_assign_card")}
                  checked={autoAssignCard}
                  onChange={(event) => {
                    setAutoAssignCard(event.currentTarget.checked);
                    if (event.currentTarget.checked)
                      setSelectedCardNumber(null);
                  }}
                />
                <Text size="xs" c="dimmed" ml="xl">
                  {t("auto_assign_description")}
                </Text>
              </Box>

              <Select
                label={t("available_cards")}
                placeholder={t("select_card")}
                data={availableCards.map((c) => ({
                  value: c.cardNumber.toString(),
                  label: `#${c.cardNumber}`,
                }))}
                value={selectedCardNumber}
                onChange={setSelectedCardNumber}
                searchable
                clearable
                disabled={autoAssignCard}
                nothingFoundMessage={t("no_cards_available")}
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
                  {t("checkin_completed_title")}
                </Title>
                <Text c="dimmed" mt="xs">
                  {t("checkin_completed_message")}
                </Text>
              </Box>

              {assignedCardNumber ? (
                <Paper
                  withBorder
                  p="xl"
                  radius="md"
                  bg="var(--mantine-color-indigo-0)"
                >
                  <Stack gap={0} align="center">
                    <Text size="xs" fw={700} c="blue" tt="uppercase">
                      {t("assigned_card_number")}
                    </Text>
                    <Text size="xl" fw={900}>
                      #{assignedCardNumber}
                    </Text>
                  </Stack>
                </Paper>
              ) : (
                <Alert color="orange" title={t("no_card_assigned")}>
                  {t("no_card_assigned_message")}
                </Alert>
              )}

              <Group gap="sm">
                <Button
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={handleDownloadContract}
                >
                  {t("download_contract", "Download Contract")}
                </Button>
                <Button onClick={onClose} size="md">
                  {t("finish", "Finish")}
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
                  color="blue"
                  onClick={handleFinalConfirm}
                  loading={processing}
                >
                  {t("complete_checkin")}
                </Button>
              </>
            )}
          </Group>
        )}
      </Stack>
    </Modal>
  );
}
