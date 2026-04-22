import { useState, useEffect } from "react";
import { PageHeader, PageShell } from "@domas/ui";
import { Button, Paper, LoadingOverlay, Tabs, Badge } from "@mantine/core";
import { IconPlus, IconListSearch, IconHistory } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import {
  damages,
  guestStays as guestStaysApi,
  locations,
  students,
} from "@domas/api-client";
import {
  DamageReport,
  CreateDamageReportDto,
  DamageStatus,
  GuestStay,
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
  const [activeGuestStays, setActiveGuestStays] = useState<GuestStay[]>([]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [locationsRes, studentsRes, activeStays, confirmedStays] =
        await Promise.all([
          locations.findAll({ limit: 1000 }),
          students.findAll({ limit: 1000 }),
          guestStaysApi.findAll({ status: "active" }),
          guestStaysApi.findAll({ status: "confirmed" }),
        ]);
      setLocationList(locationsRes.data);
      setStudentList(studentsRes.data);
      setActiveGuestStays([...activeStays, ...confirmedStays]);
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

      const enriched = res.map((r) => {
        const studentNames = (r.culpritIds ?? []).map(
          (id: string) => studMap.get(id) || id,
        );
        const guestNames = (r.culpritGuestStayIds ?? []).map((id: string) => {
          const stay = activeGuestStays.find((gs) => gs.id === id);
          return stay
            ? `${stay.guest.firstName} ${stay.guest.lastName} (guest)`
            : id;
        });
        const allNames = [...studentNames, ...guestNames];
        return {
          ...r,
          locationName: locMap.get(r.locationId) || r.locationId,
          culpritNames: allNames.length > 0 ? allNames.join(", ") : undefined,
        };
      });

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
        studentName: l.studentId
          ? studMap.get(l.studentId) || l.studentId
          : undefined,
        // guestName, guestStayCheckIn, guestStayCheckOut already returned by the server
      }));

      const studentCulpritNames = (details.culpritIds ?? []).map(
        (id: string) => studMap.get(id) || id,
      );
      const guestCulpritNames = (details.culpritGuestStayIds ?? []).map(
        (id: string) => {
          const stay = activeGuestStays.find((gs) => gs.id === id);
          return stay
            ? `${stay.guest.firstName} ${stay.guest.lastName} (guest)`
            : id;
        },
      );
      const allCulpritNames = [...studentCulpritNames, ...guestCulpritNames];

      setSelectedReport({
        ...details,
        liabilities: enrichedLiabilities,
        locationName:
          locMap.get(details.locationId) || details.locationId.toString(),
        culpritNames:
          allCulpritNames.length > 0 ? allCulpritNames.join(", ") : undefined,
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
    <>
      <PageHeader
        title={t("damages")}
        subtitle={t("damage_reports_description")}
        actions={
          hasPermission("damages.report") ? (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setModalOpened(true)}
            >
              {t("report_damage")}
            </Button>
          ) : undefined
        }
      />
      <PageShell>
        <Tabs defaultValue="reported">
          <Tabs.List mb="md">
            <Tabs.Tab
              value="reported"
              leftSection={<IconListSearch size={14} />}
              rightSection={
                reports.filter((r) => r.status === DamageStatus.PENDING)
                  .length > 0 ? (
                  <Badge size="xs" color="red" variant="filled">
                    {
                      reports.filter((r) => r.status === DamageStatus.PENDING)
                        .length
                    }
                  </Badge>
                ) : undefined
              }
            >
              {t("reported_damages", "Reported")}
            </Tabs.Tab>
            <Tabs.Tab value="processed" leftSection={<IconHistory size={14} />}>
              {t("processed_damages", "Processed")}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="reported">
            <Paper withBorder radius="md" style={{ position: "relative" }}>
              <LoadingOverlay visible={loading} />
              <DamageReportTable
                data={reports.filter((r) => r.status === DamageStatus.PENDING)}
                onView={handleViewDetails}
                onApprove={(r) => handleApprove(r.id)}
                onReject={(r) => handleReject(r.id)}
                canManage={hasPermission("damages.manage")}
              />
            </Paper>
          </Tabs.Panel>

          <Tabs.Panel value="processed">
            <Paper withBorder radius="md" style={{ position: "relative" }}>
              <LoadingOverlay visible={loading} />
              <DamageReportTable
                data={reports.filter((r) => r.status !== DamageStatus.PENDING)}
                onView={handleViewDetails}
                onApprove={(r) => handleApprove(r.id)}
                onReject={(r) => handleReject(r.id)}
                canManage={hasPermission("damages.manage")}
              />
            </Paper>
          </Tabs.Panel>
        </Tabs>

        <CreateDamageModal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          onSubmit={handleCreateReport}
          students={studentList}
          guestStays={activeGuestStays}
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
      </PageShell>
    </>
  );
}
