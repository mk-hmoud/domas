import { useState, useEffect } from "react";
import { PageHeader, PageShell } from "@domas/ui";
import { Button, Paper, LoadingOverlay, Tabs } from "@mantine/core";
import { IconPlus, IconCards, IconId } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  accessCards,
  locations,
  students as studentsApi,
} from "@domas/api-client";
import { useAuth } from "../context/AuthContext";
import {
  CardBatch,
  AccessCard,
  CreateCardBatchDto,
  Location,
  LocationType,
  Student,
  CardStatus,
} from "@domas/ts-types";
import {
  CardBatchModal,
  CardBatchTable,
  AccessCardTable,
  ReportLostCardModal,
} from "@domas/ui";
import { notifications } from "@mantine/notifications";

export function SharedAccessCardsPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [batches, setBatches] = useState<CardBatch[]>([]);
  const [cards, setCards] = useState<AccessCard[]>([]);
  const [locationList, setLocationList] = useState<Location[]>([]);
  const [, setStudentList] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [lostCard, setLostCard] = useState<AccessCard | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>("batches");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [batchesRes, cardsRes, locationsRes, studentsRes] =
        await Promise.all([
          accessCards.findAllBatches(),
          accessCards.findAllCards(),
          locations.findAll({ limit: 1000 }),
          studentsApi.findAll({ limit: 5000 }),
        ]);
      setBatches(batchesRes);
      setLocationList(locationsRes.data);
      setStudentList(studentsRes.data);

      const studMap = new Map(
        studentsRes.data.map((s: Student) => [
          s.id,
          `${s.firstName} ${s.lastName}`,
        ]),
      );
      setCards(
        cardsRes.map((c) => ({
          ...c,
          holderName: c.currentHolderId
            ? studMap.get(c.currentHolderId)
            : undefined,
        })),
      );
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

  const handleMarkLost = async (
    issueReplacement: boolean,
    batchId?: number,
  ) => {
    if (!lostCard) return;
    setActionLoading(true);
    try {
      await accessCards.updateStatus(lostCard.id, {
        status: CardStatus.LOST,
        notes: "Reported lost by staff",
      });

      if (
        issueReplacement &&
        lostCard.currentHolderId &&
        lostCard.currentBookingId
      ) {
        await accessCards.issueCard({
          studentId: lostCard.currentHolderId,
          bookingId: lostCard.currentBookingId,
          batchId,
        });
      }

      notifications.show({
        title: t("success"),
        message: issueReplacement
          ? t(
              "card_marked_lost_replacement_issued",
              "Card marked as lost and replacement issued.",
            )
          : t("card_marked_lost", "Card marked as lost."),
        color: "green",
      });

      setLostCard(null);
      fetchData();
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("action_failed", { defaultValue: "Action failed" }),
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const allowedLocations = locationList.filter(
    (loc) =>
      loc.type === LocationType.BUILDING || loc.type === LocationType.BLOCK,
  );

  return (
    <>
      <PageHeader
        title={t("access_cards")}
        subtitle={t("card_batches_description")}
        actions={
          hasPermission("access_cards.manage") ? (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setModalOpened(true)}
            >
              {t("create_batch")}
            </Button>
          ) : undefined
        }
      />
      <PageShell>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List mb="md">
            <Tabs.Tab value="batches" leftSection={<IconCards size={14} />}>
              {t("card_batches")}
            </Tabs.Tab>
            <Tabs.Tab value="all_cards" leftSection={<IconId size={14} />}>
              {t("all_cards", "All Cards")}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="batches">
            <Paper withBorder radius="md" style={{ position: "relative" }}>
              <LoadingOverlay visible={loading} />
              <CardBatchTable data={batches} />
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="all_cards">
            <Paper withBorder radius="md" style={{ position: "relative" }}>
              <LoadingOverlay visible={loading} />
              <AccessCardTable
                data={cards}
                onMarkLost={
                  hasPermission("access_cards.manage")
                    ? (card) => setLostCard(card)
                    : undefined
                }
              />
            </Paper>
          </Tabs.Panel>
        </Tabs>

        <CardBatchModal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          onSubmit={handleCreateBatch}
          locations={allowedLocations}
        />

        <ReportLostCardModal
          opened={lostCard !== null}
          onClose={() => setLostCard(null)}
          card={lostCard}
          batches={batches}
          loading={actionLoading}
          onConfirm={handleMarkLost}
        />
      </PageShell>
    </>
  );
}
