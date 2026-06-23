import { useState, useEffect } from "react";
import { PageHeader, PageShell } from "@domas/ui";
import { Button, Paper, LoadingOverlay, Tabs } from "@mantine/core";
import { IconPlus, IconCards, IconId } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  accessCards,
  locations,
  students as studentsApi,
  inventory,
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
  InventoryCatalogItem,
} from "@domas/ts-types";
import {
  CardBatchModal,
  CardBatchTable,
  AccessCardTable,
  ReportLostCardModal,
  ReportBrokenCardModal,
  ReinstateCardModal,
} from "@domas/ui";
import { notifications } from "@mantine/notifications";

export function SharedAccessCardsPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();
  const [batches, setBatches] = useState<CardBatch[]>([]);
  const [cards, setCards] = useState<AccessCard[]>([]);
  const [locationList, setLocationList] = useState<Location[]>([]);
  const [catalogItems, setCatalogItems] = useState<InventoryCatalogItem[]>([]);
  const [, setStudentList] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [lostCard, setLostCard] = useState<AccessCard | null>(null);
  const [brokenCard, setBrokenCard] = useState<AccessCard | null>(null);
  const [reinstateCard, setReinstateCard] = useState<AccessCard | null>(null);
  const [reinstateLoading, setReinstateLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>("batches");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [batchesRes, cardsRes, locationsRes, studentsRes, catalogRes] =
        await Promise.all([
          accessCards.findAllBatches(),
          accessCards.findAllCards(),
          locations.findAll({ limit: 1000 }),
          studentsApi.findAll({ limit: 5000 }),
          inventory.findAllCatalog(),
        ]);
      setBatches(batchesRes);
      setLocationList(locationsRes.data);
      setCatalogItems(catalogRes);
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

  const handleMarkBroken = async (
    issueReplacement: boolean,
    batchId?: number,
  ) => {
    if (!brokenCard) return;
    setActionLoading(true);
    try {
      await accessCards.updateStatus(brokenCard.id, {
        status: CardStatus.BROKEN,
        notes: "Reported broken by staff",
      });

      if (
        issueReplacement &&
        brokenCard.currentHolderId &&
        brokenCard.currentBookingId
      ) {
        await accessCards.issueCard({
          studentId: brokenCard.currentHolderId,
          bookingId: brokenCard.currentBookingId,
          batchId,
        });
      }

      notifications.show({
        title: t("success"),
        message: issueReplacement
          ? t(
              "card_marked_broken_replacement_issued",
              "Card marked as broken and replacement issued.",
            )
          : t("card_marked_broken", "Card marked as broken."),
        color: "green",
      });

      setBrokenCard(null);
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

  const handleReinstate = async (notes?: string) => {
    if (!reinstateCard) return;
    setReinstateLoading(true);
    try {
      await accessCards.reinstateCard(reinstateCard.id, { notes });
      notifications.show({
        title: t("success"),
        message: t(
          "card_reinstated",
          "Card reinstated and available for reuse.",
        ),
        color: "green",
      });
      setReinstateCard(null);
      fetchData();
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("action_failed", { defaultValue: "Action failed" }),
        color: "red",
      });
    } finally {
      setReinstateLoading(false);
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
                onMarkBroken={
                  hasPermission("access_cards.manage")
                    ? (card) => setBrokenCard(card)
                    : undefined
                }
                onReinstate={
                  hasPermission("access_cards.reinstate")
                    ? (card) => setReinstateCard(card)
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
          catalogItems={catalogItems}
        />

        <ReportLostCardModal
          opened={lostCard !== null}
          onClose={() => setLostCard(null)}
          card={lostCard}
          batches={batches}
          loading={actionLoading}
          onConfirm={handleMarkLost}
        />

        <ReportBrokenCardModal
          opened={brokenCard !== null}
          onClose={() => setBrokenCard(null)}
          card={brokenCard}
          batches={batches}
          loading={actionLoading}
          onConfirm={handleMarkBroken}
        />

        <ReinstateCardModal
          opened={reinstateCard !== null}
          onClose={() => setReinstateCard(null)}
          card={reinstateCard}
          loading={reinstateLoading}
          onConfirm={handleReinstate}
        />
      </PageShell>
    </>
  );
}
