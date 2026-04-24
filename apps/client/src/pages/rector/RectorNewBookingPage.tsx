import { useEffect, useState, useCallback } from 'react';
import { Stack, Text, Select, Button, Paper, Alert } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { rector, bookings, students, semesters } from '@domas/api-client';
import { RectorBed, Student, Semester } from '@domas/ts-types';
import { PageHeader, PageShell } from '@domas/ui';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';

export function RectorNewBookingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [availableBeds, setAvailableBeds] = useState<RectorBed[]>([]);
  const [openSemesters, setOpenSemesters] = useState<Semester[]>([]);
  const [studentResults, setStudentResults] = useState<Student[]>([]);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingBeds, setLoadingBeds] = useState(true);

  useEffect(() => {
    Promise.all([rector.getBeds(), semesters.findAll({ limit: 50, page: 1 })])
      .then(([bedsRes, semRes]) => {
        setAvailableBeds(bedsRes.beds.filter((b) => b.status === 'available'));
        setOpenSemesters(semRes.data.filter((s) => s.status === 'open'));
      })
      .finally(() => setLoadingBeds(false));
  }, []);

  const searchStudents = useCallback(async (q: string) => {
    if (q.length < 2) {
      setStudentResults([]);
      return;
    }
    const res = await students.findAll({ search: q, limit: 20, page: 1 });
    setStudentResults((res as any).data ?? res);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchStudents(studentSearch), 300);
    return () => clearTimeout(timer);
  }, [studentSearch, searchStudents]);

  const studentOptions = studentResults.map((s) => ({
    value: s.id,
    label: `${s.firstName} ${s.lastName} (${s.studentNumber})`,
  }));

  const bedOptions = availableBeds.map((b) => ({
    value: String(b.id),
    label: `${b.locationPath} — ${t('bed')} ${b.label}`,
  }));

  const semesterOptions = openSemesters.map((s) => ({
    value: String(s.id),
    label: s.displayName,
  }));

  const canSubmit = selectedStudentId && selectedBedId && selectedSemesterId;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await bookings.create({
        studentId: selectedStudentId!,
        bedId: Number(selectedBedId),
        semesterId: Number(selectedSemesterId),
      });
      notifications.show({ message: t('rector.new_booking_success'), color: 'green' });
      navigate('/rector/residents');
    } catch {
      notifications.show({ message: t('rector.new_booking_error'), color: 'red' });
    } finally {
      setSubmitting(false);
    }
  };

  const noSemesters = !loadingBeds && openSemesters.length === 0;
  const noBeds = !loadingBeds && availableBeds.length === 0;

  return (
    <>
      <PageHeader title={t('rector.new_booking_title')} />
      <PageShell size="sm">
        <Paper withBorder p="lg" radius="md">
          <Stack gap="md">
            {noSemesters && <Alert color="yellow">{t('rector.no_open_semesters')}</Alert>}
            {noBeds && <Alert color="yellow">{t('rector.no_available_beds')}</Alert>}

            <Select
              label={t('rector.new_booking_student')}
              placeholder={t('rector.new_booking_student_placeholder')}
              data={studentOptions}
              searchable
              searchValue={studentSearch}
              onSearchChange={setStudentSearch}
              value={selectedStudentId}
              onChange={setSelectedStudentId}
              nothingFoundMessage={
                studentSearch.length < 2 ? undefined : t('no_results', 'No results')
              }
            />

            <Select
              label={t('rector.new_booking_bed')}
              placeholder={t('rector.new_booking_bed_placeholder')}
              data={bedOptions}
              value={selectedBedId}
              onChange={setSelectedBedId}
              disabled={noBeds}
            />

            <Select
              label={t('rector.new_booking_semester')}
              placeholder={t('rector.new_booking_semester_placeholder')}
              data={semesterOptions}
              value={selectedSemesterId}
              onChange={setSelectedSemesterId}
              disabled={noSemesters}
            />

            <Button
              fullWidth
              disabled={!canSubmit}
              loading={submitting}
              onClick={handleSubmit}
              mt="xs"
            >
              {t('rector.new_booking_submit')}
            </Button>
          </Stack>
        </Paper>

        {!loadingBeds && availableBeds.length === 0 && openSemesters.length === 0 && (
          <Text c="dimmed" size="xs" ta="center" mt="md">
            {t('rector.no_available_beds')}
          </Text>
        )}
      </PageShell>
    </>
  );
}
