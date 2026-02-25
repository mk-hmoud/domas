import { useState, useEffect } from "react";
import {
  Container,
  Stack,
  Group,
  Title,
  Text,
  Button,
  Paper,
  LoadingOverlay,
  Tabs,
} from "@mantine/core";
import { IconPlus, IconCards } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { accessCards, locations } from "@domas/api-client";
import { useAuth } from "../context/AuthContext";
import {
  CardBatch,
  AccessCard,
  CreateCardBatchDto,
  Location,
  LocationType,
} from "@domas/ts-types";
import { CardBatchModal, CardBatchTable, AccessCardTable } from "@domas/ui";
import { notifications } from "@mantine/notifications";

export function SharedAccessCardsPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [batches, setBatches] = useState<CardBatch[]>([]);
  const [cards, setCards] = useState<AccessCard[]>([]);
  const [locationList, setLocationList] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>("batches");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [batchesRes, cardsRes, locationsRes] = await Promise.all([
        accessCards.findAllBatches(),
        accessCards.findAllCards(),
        locations.findAll({ limit: 1000 }),
      ]);
      setBatches(batchesRes);
      setCards(cardsRes);
      setLocationList(locationsRes.data);
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

  const handleCreateBatch = async (values: CreateCardBatchDto) => {
    try {
      await accessCards.createBatch(values);
      notifications.show({
        title: t("success"),
        message: t("batch_created"),
        color: "green",
      });
      fetchData();
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_save_batch"),
        color: "red",
      });
    }
  };

  const allowedLocations = locationList.filter(
    (loc) =>
      loc.type === LocationType.BUILDING || loc.type === LocationType.BLOCK,
  );

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>{t("access_cards")}</Title>
            <Text c="dimmed" size="sm">
              {t("card_batches_description")}
            </Text>
          </div>
          {hasPermission("access_cards.manage") && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setModalOpened(true)}
            >
              {t("create_batch")}
            </Button>
          )}
        </Group>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="batches" leftSection={<IconCards size={14} />}>
              {t("card_batches")}
            </Tabs.Tab>
            <Tabs.Tab value="all_cards" leftSection={<IconCards size={14} />}>
              {t("all_cards", "All Cards")}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="batches" pt="md">
            <Paper withBorder radius="md" style={{ position: "relative" }}>
              <LoadingOverlay visible={loading} />
              <CardBatchTable data={batches} />
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="all_cards" pt="md">
            <Paper withBorder radius="md" style={{ position: "relative" }}>
              <LoadingOverlay visible={loading} />
              <AccessCardTable data={cards} />
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      <CardBatchModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onSubmit={handleCreateBatch}
        locations={allowedLocations}
      />
    </Container>
  );
}
