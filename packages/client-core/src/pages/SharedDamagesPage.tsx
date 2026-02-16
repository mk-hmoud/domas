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
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { damages, locations, students } from "@domas/api-client";
import {
  DamageReport,
  CreateDamageReportDto,
  Location,
  Student,
} from "@domas/ts-types";
import {
  DamageReportTable,
  CreateDamageModal,
  DamageDetailsDrawer,
} from "@domas/ui";
import { notifications } from "@mantine/notifications";
import { useAuth } from "../context/AuthContext";

export function SharedDamagesPage() {
  const { t } = useTranslation();
  const { hasPermission } = useAuth();

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);
  const [drawerOpened, setDrawerOpened] = useState(false);
  const [selectedReport, setSelectedReport] = useState<
    | (DamageReport & {
        liabilities?: any[];
        locationName?: string;
        reportedByName?: string;
        reviewedByName?: string;
        costTry?: number;
        costForeign?: number;
        currencyCode?: string;
        culpritNames?: string;
      })
    | null
  >(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Lists for mapping
  const [locationList, setLocationList] = useState<Location[]>([]);
  const [studentList, setStudentList] = useState<Student[]>([]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [locationsRes, studentsRes] = await Promise.all([
        locations.findAll({ limit: 1000 }),
        students.findAll({ limit: 1000 }),
      ]);
      setLocationList(locationsRes.data);
      setStudentList(studentsRes.data);
      await fetchReports(locationsRes.data, studentsRes.data);
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

  const fetchReports = async (locs: Location[], studs: Student[]) => {
    try {
      const res = await damages.findAllReports();

      const locMap = new Map(locs.map((l) => [l.id, l.name]));
      const studMap = new Map(
        studs.map((s) => [s.id, `${s.firstName} ${s.lastName}`]),
      );
      // Note: We might need to handle cases where damage is linked to a bed ID via snapshot
      // but for basic listing we enrich locationName.

      const enriched = res.map((r) => ({
        ...r,
        locationName: locMap.get(r.locationId) || r.locationId,
        culpritNames: r.culpritIds
          ?.map((id: string) => studMap.get(id) || id)
          .join(", "),
      }));

      setReports(enriched);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleCreateReport = async (values: CreateDamageReportDto) => {
    setActionLoading(true);
    try {
      const canAutoApprove = hasPermission("damages.manage");
      await damages.createReport({ ...values, autoApprove: canAutoApprove });
      notifications.show({
        title: t("success"),
        message: t("report_created"),
        color: "green",
      });
      fetchReports(locationList, studentList);
      setModalOpened(false);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_save_report"),
        color: "red",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = async (report: DamageReport) => {
    setLoading(true);
    try {
      const details = await damages.getReportById(report.id);

      const studMap = new Map(
        studentList.map((s) => [s.id, `${s.firstName} ${s.lastName}`]),
      );
      const locMap = new Map(locationList.map((l) => [l.id, l.name]));

      const enrichedLiabilities = details.liabilities.map((l) => ({
        ...l,
        studentName: studMap.get(l.studentId) || l.studentId,
      }));

      setSelectedReport({
        ...details,
        liabilities: enrichedLiabilities,
        locationName:
          locMap.get(details.locationId) || details.locationId.toString(),
        culpritNames:
          details.culpritIds && details.culpritIds.length > 0
            ? details.culpritIds
                .map((id: string) => studMap.get(id) || id)
                .join(", ")
            : undefined,
      });
      setDrawerOpened(true);
    } catch (error) {
      notifications.show({
        title: t("error"),
        message: t("failed_to_fetch_data"),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await damages.approveReport(id);
      notifications.show({
        title: t("success"),
        message: t("report_approved"),
        color: "green",
      });
      setDrawerOpened(false);
      fetchReports(locationList, studentList);
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

  const handleReject = async (id: string) => {
    setActionLoading(true);
    try {
      await damages.rejectReport(id);
      notifications.show({
        title: t("success"),
        message: t("report_rejected"),
        color: "green",
      });
      setDrawerOpened(false);
      fetchReports(locationList, studentList);
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

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>{t("damages")}</Title>
            <Text c="dimmed" size="sm">
              {t("damage_reports_description")}
            </Text>
          </div>
          {hasPermission("damages.report") && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setModalOpened(true)}
            >
              {t("report_damage")}
            </Button>
          )}
        </Group>

        <Paper withBorder radius="md" style={{ position: "relative" }}>
          <LoadingOverlay visible={loading} />
          <DamageReportTable
            data={reports}
            onView={handleViewDetails}
            onApprove={(r) => handleApprove(r.id)}
            onReject={(r) => handleReject(r.id)}
            canManage={hasPermission("damages.manage")}
          />
        </Paper>
      </Stack>

      <CreateDamageModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onSubmit={handleCreateReport}
        students={studentList}
        loading={actionLoading}
      />

      <DamageDetailsDrawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        report={selectedReport}
        onApprove={handleApprove}
        onReject={handleReject}
        loading={actionLoading}
      />
    </Container>
  );
}
