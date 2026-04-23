import { Table, Badge, ActionIcon, Menu, Checkbox } from "@mantine/core";
import {
  IconDotsVertical,
  IconEye,
  IconEdit,
  IconTrash,
  IconCheck,
  IconUserOff,
  IconBrandWhatsapp,
} from "@tabler/icons-react";
import { Student, COUNTRIES } from "@domas/ts-types";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../EmptyState";
import classes from "../Table/table.module.css";

interface StudentsTableProps {
  data: Student[];
  onSelect: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onToggleStatus: (student: Student) => void;
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  onToggleSelectAll: () => void;
  emptyMessage?: string;
}

export function StudentsTable({
  data,
  onSelect,
  onEdit,
  onDelete,
  onToggleStatus,
  selectedIds,
  onToggleSelection,
  onToggleSelectAll,
  emptyMessage,
}: StudentsTableProps) {
  const { t } = useTranslation();

  const getCountryName = (code?: string) => {
    if (!code) return "-";
    const country = COUNTRIES.find(([c]) => c === code);
    return country ? country[1] : code;
  };

  const allSelected =
    data.length > 0 &&
    data.every((student) => selectedIds.includes(student.id));
  const someSelected =
    data.some((student) => selectedIds.includes(student.id)) && !allSelected;

  const rows = data.map((student) => {
    const isSelected = selectedIds.includes(student.id);
    return (
      <Table.Tr
        key={student.id}
        onClick={() => onSelect(student)}
        style={{ cursor: "pointer" }}
        bg={isSelected ? "var(--mantine-color-indigo-0)" : undefined}
      >
        <Table.Td onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onChange={() => onToggleSelection(student.id)}
          />
        </Table.Td>
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
        <Table.Td onClick={(e) => e.stopPropagation()}>
          <Menu shadow="md" width={200} withinPortal position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEye size={14} />}
                onClick={() => onSelect(student)}
              >
                {t("view_details", { defaultValue: "View Details" })}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconEdit size={14} />}
                onClick={() => onEdit(student)}
              >
                {t("edit")}
              </Menu.Item>
              <Menu.Item
                leftSection={
                  student.isActive ? (
                    <IconUserOff size={14} />
                  ) : (
                    <IconCheck size={14} />
                  )
                }
                color={student.isActive ? "orange" : "green"}
                onClick={() => onToggleStatus(student)}
              >
                {student.isActive
                  ? t("deactivate", { defaultValue: "Deactivate" })
                  : t("activate", { defaultValue: "Activate" })}
              </Menu.Item>
              {student.whatsappNumber && (
                <>
                  <Menu.Divider />
                  <Menu.Item
                    color="green"
                    leftSection={<IconBrandWhatsapp size={14} />}
                    onClick={() =>
                      window.open(
                        `https://wa.me/${student.whatsappNumber!.replace(/\D/g, "")}`,
                        "_blank",
                      )
                    }
                  >
                    {t("whatsapp", { defaultValue: "WhatsApp" })}
                  </Menu.Item>
                </>
              )}
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => onDelete(student)}
              >
                {t("delete")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Table highlightOnHover>
      <Table.Thead className={classes.thead}>
        <Table.Tr>
          <Table.Th className={classes.th} style={{ width: 40 }}>
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={onToggleSelectAll}
            />
          </Table.Th>
          <Table.Th className={classes.th}>
            {t("student_number", { defaultValue: "Student No." })}
          </Table.Th>
          <Table.Th className={classes.th}>
            {t("full_name", { defaultValue: "Full Name" })}
          </Table.Th>
          <Table.Th className={classes.th}>
            {t("gender", { defaultValue: "Gender" })}
          </Table.Th>
          <Table.Th className={classes.th}>
            {t("nationality", { defaultValue: "Nationality" })}
          </Table.Th>
          <Table.Th className={classes.th}>
            {t("status", { defaultValue: "Status" })}
          </Table.Th>
          <Table.Th className={classes.th} style={{ width: 48 }} />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows}
        {data.length === 0 && (
          <Table.Tr>
            <Table.Td colSpan={7} style={{ padding: 0 }}>
              <EmptyState
                title={
                  emptyMessage ||
                  t("no_students_found", {
                    defaultValue: "No students found",
                  })
                }
              />
            </Table.Td>
          </Table.Tr>
        )}
      </Table.Tbody>
    </Table>
  );
}
