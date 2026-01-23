import { Table, Badge, ActionIcon, Menu } from "@mantine/core";
import { IconDotsVertical, IconEye, IconEdit } from "@tabler/icons-react";
import { Student, COUNTRIES } from "@domas/ts-types";
import { useTranslation } from "react-i18next";

interface StudentsTableProps {
  data: Student[];
  onSelect: (student: Student) => void;
  onEdit: (student: Student) => void;
}

export function StudentsTable({ data, onSelect, onEdit }: StudentsTableProps) {
  const { t } = useTranslation();

  const getCountryName = (code?: string) => {
    if (!code) return "-";
    const country = COUNTRIES.find(([c]) => c === code);
    return country ? country[1] : code;
  };

  const rows = data.map((student) => (
    <Table.Tr
      key={student.id}
      onClick={() => onSelect(student)}
      style={{ cursor: "pointer" }}
    >
      <Table.Td>{student.studentNumber}</Table.Td>
      <Table.Td>
        {student.firstName} {student.lastName}
      </Table.Td>
      <Table.Td>{t(student.gender)}</Table.Td>
      <Table.Td>{getCountryName(student.nationalityCode)}</Table.Td>
      <Table.Td>
        <Badge color={student.isActive ? "green" : "gray"}>
          {student.isActive ? t("active") : t("inactive")}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Menu shadow="md" width={200} withinPortal>
          <Menu.Target>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={(e) => e.stopPropagation()}
            >
              <IconDotsVertical size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconEye size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(student);
              }}
            >
              {t("view_details", { defaultValue: "View Details" })}
            </Menu.Item>
            <Menu.Item
              leftSection={<IconEdit size={14} />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(student);
              }}
            >
              {t("edit")}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>
            {t("student_number", { defaultValue: "Student Number" })}
          </Table.Th>
          <Table.Th>{t("full_name", { defaultValue: "Full Name" })}</Table.Th>
          <Table.Th>{t("gender", { defaultValue: "Gender" })}</Table.Th>
          <Table.Th>
            {t("nationality", { defaultValue: "Nationality" })}
          </Table.Th>
          <Table.Th>{t("status", { defaultValue: "Status" })}</Table.Th>
          <Table.Th style={{ width: 80 }} />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}
