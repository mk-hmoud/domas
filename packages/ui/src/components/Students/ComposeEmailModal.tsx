import { useEffect, useState } from "react";
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Group,
  Stack,
  Text,
  Alert,
  Loader,
  Center,
  CopyButton,
  Tooltip,
  Badge,
} from "@mantine/core";
import {
  IconInfoCircle,
  IconMail,
  IconCopy,
  IconCheck,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { students } from "@domas/api-client";
import { ResolveContactsDto, ResolvedContact } from "@domas/ts-types";

/** Above this count we skip mailto and only show the copy button. */
const MAILTO_LIMIT = 80;

export interface ComposeEmailModalProps {
  opened: boolean;
  onClose: () => void;
  resolveDto: ResolveContactsDto;
}

export function ComposeEmailModal({
  opened,
  onClose,
  resolveDto,
}: ComposeEmailModalProps) {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<ResolvedContact[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!opened) return;
    setSubject("");
    setBody("");
    setContacts([]);
    setLoading(true);
    students
      .resolveContacts(resolveDto)
      .then(setContacts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [opened]);

  const withEmail = contacts.filter((c) => c.email);
  const skipped = contacts.length - withEmail.length;
  const isOverLimit = withEmail.length > MAILTO_LIMIT;
  const emailList = withEmail.map((c) => c.email as string);
  const emailsCsv = emailList.join(", ");

  const handleSend = () => {
    const bcc = emailList.join(",");
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (body) params.set("body", body);
    const query = params.toString();
    window.open(
      `mailto:?bcc=${encodeURIComponent(bcc)}${query ? `&${query}` : ""}`,
      "_blank",
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("compose_email", { defaultValue: "Compose Email" })}
      size="lg"
    >
      {loading ? (
        <Center py="xl">
          <Loader size="sm" />
        </Center>
      ) : (
        <Stack gap="md">
          {/* Recipient summary */}
          <Alert icon={<IconInfoCircle size={16} />} color="blue" radius="md">
            <Group gap="xs" wrap="wrap">
              <Text size="sm">
                <strong>{contacts.length}</strong>{" "}
                {t("recipients_found", { defaultValue: "recipients found" })}
                {" — "}
                <strong>{withEmail.length}</strong>{" "}
                {t("have_email", { defaultValue: "have an email address" })}
                {skipped > 0 && (
                  <>
                    {", "}
                    <Badge color="orange" size="sm" variant="light">
                      {skipped}{" "}
                      {t("skipped_no_email", {
                        defaultValue: "skipped (no email)",
                      })}
                    </Badge>
                  </>
                )}
              </Text>
            </Group>
          </Alert>

          {isOverLimit && (
            <Alert
              icon={<IconInfoCircle size={16} />}
              color="orange"
              radius="md"
            >
              <Text size="sm">
                {t("too_many_for_mailto", {
                  defaultValue:
                    "Too many recipients to open directly in your email client. Copy the addresses below and paste them into the BCC field.",
                })}
              </Text>
            </Alert>
          )}

          <TextInput
            label={t("subject", { defaultValue: "Subject" })}
            placeholder={t("email_subject_placeholder", {
              defaultValue: "e.g. Important announcement",
            })}
            value={subject}
            onChange={(e) => setSubject(e.currentTarget.value)}
          />

          <Textarea
            label={t("message", { defaultValue: "Message" })}
            placeholder={t("email_body_placeholder", {
              defaultValue: "Write your message here...",
            })}
            minRows={5}
            autosize
            value={body}
            onChange={(e) => setBody(e.currentTarget.value)}
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onClose}>
              {t("cancel")}
            </Button>

            {isOverLimit ? (
              <CopyButton value={emailsCsv} timeout={2500}>
                {({ copied, copy }) => (
                  <Tooltip
                    label={t("copied", { defaultValue: "Copied!" })}
                    opened={copied}
                  >
                    <Button
                      color={copied ? "teal" : "blue"}
                      leftSection={
                        copied ? (
                          <IconCheck size={16} />
                        ) : (
                          <IconCopy size={16} />
                        )
                      }
                      onClick={copy}
                      disabled={withEmail.length === 0}
                    >
                      {copied
                        ? t("copied", { defaultValue: "Copied!" })
                        : t("copy_emails", {
                            defaultValue: "Copy Email Addresses",
                          })}
                    </Button>
                  </Tooltip>
                )}
              </CopyButton>
            ) : (
              <Button
                leftSection={<IconMail size={16} />}
                onClick={handleSend}
                disabled={withEmail.length === 0}
              >
                {t("open_in_email_client", {
                  defaultValue: "Open in Email Client",
                })}
              </Button>
            )}
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
