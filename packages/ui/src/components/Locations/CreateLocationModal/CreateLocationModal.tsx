import { useState, useEffect } from "react";
import {
  TextInput,
  NumberInput,
  Button,
  Modal,
  Select,
  Checkbox,
  Group,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { CreateLocationDto, LocationType, GenderType } from "@domas/ts-types";

interface CreateLocationModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: CreateLocationDto) => Promise<void>;
  parentId?: number | null;
  parentType?: LocationType;
}

export function CreateLocationModal({
  opened,
  onClose,
  onSubmit,
  parentId,
  parentType,
}: CreateLocationModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<CreateLocationDto>({
    initialValues: {
      name: "",
      type: LocationType.CAMPUS, // Default, will be overridden by logic
      parentId: parentId || undefined,
      capacity: 0,
      genderLock: undefined, // Explicitly undefined to avoid sending null if not selected
      isGuestZone: false,
    },
    validate: {
      name: (val) => (val.length < 2 ? "Name is too short" : null),
      type: (val) => (!val ? "Type is required" : null),
    },
  });

  // Suggest next type based on parent
  useEffect(() => {
    if (opened) {
      form.reset();
      form.setFieldValue("parentId", parentId || undefined);
      if (!parentId) {
        form.setFieldValue("type", LocationType.UNIVERSITY);
      } else if (parentType === LocationType.UNIVERSITY) {
        form.setFieldValue("type", LocationType.CAMPUS);
      } else if (parentType === LocationType.CAMPUS) {
        form.setFieldValue("type", LocationType.BUILDING);
      } else if (parentType === LocationType.BUILDING) {
        form.setFieldValue("type", LocationType.BLOCK);
      } else if (parentType === LocationType.BLOCK) {
        form.setFieldValue("type", LocationType.FLOOR);
      } else if (parentType === LocationType.FLOOR) {
        form.setFieldValue("type", LocationType.ROOM);
      }
    }
  }, [opened, parentId, parentType]);

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await onSubmit(values);
      form.reset();
      onClose();
    } catch (error) {
      // Parent handles error
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = Object.values(LocationType).map((t) => ({
    value: t,
    label: t.toUpperCase(),
  }));
  const genderOptions = Object.values(GenderType).map((t) => ({
    value: t,
    label: t,
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={parentId ? "Add Child Location" : "Create Root Location"}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label="Name"
          placeholder="e.g. Main Campus, Block A, Room 101"
          required
          mb="md"
          {...form.getInputProps("name")}
        />

        <Select
          label="Type"
          data={typeOptions}
          required
          mb="md"
          {...form.getInputProps("type")}
        />

        <NumberInput
          label="Capacity"
          description="Max number of occupants (mainly for Rooms)"
          mb="md"
          min={0}
          {...form.getInputProps("capacity")}
        />

        <Select
          label="Gender Lock"
          placeholder="None"
          data={genderOptions}
          clearable
          mb="md"
          {...form.getInputProps("genderLock")}
        />

        <Checkbox
          label="Is Guest Zone?"
          mb="xl"
          {...form.getInputProps("isGuestZone", { type: "checkbox" })}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create
          </Button>
        </Group>
      </form>
    </Modal>
  );
}
