import { useEffect, useState } from 'react';
import { Title, Button, Group, Container, Pagination } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { users } from '@domas/api-client';
import { User, CreateUser, PaginatedResult } from '@domas/ts-types';
import { CreateUserModal, UsersTable } from '@domas/ui';

export function UsersListPage() {
  const [paginatedData, setPaginatedData] = useState<PaginatedResult<User> | null>(null);
  const [activePage, setPage] = useState(1);
  const [modalOpened, setModalOpened] = useState(false);

  const fetchData = async (page: number) => {
    try {
      const result = await users.findAll({ page, limit: 10 });
      setPaginatedData(result);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchData(activePage);
  }, [activePage]);

  const handleCreateUser = async (values: CreateUser) => {
    try {
      await users.create(values);
      await fetchData(activePage);
      setModalOpened(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="lg">
        <Title>All Users</Title>
        <Button leftSection={<IconPlus size={14} />} onClick={() => setModalOpened(true)}>
          Create User
        </Button>
      </Group>

      <UsersTable data={paginatedData?.data || []} />

      {paginatedData && paginatedData.total > paginatedData.limit && (
        <Group justify="center" mt="xl">
          <Pagination
            total={Math.ceil(paginatedData.total / paginatedData.limit)}
            value={activePage}
            onChange={setPage}
          />
        </Group>
      )}

      <CreateUserModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        onSubmit={handleCreateUser}
      />
    </Container>
  );
}
