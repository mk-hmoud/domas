import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Box,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@domas/ui';
import {
  IconWifi,
  IconAirConditioning,
  IconFridge,
  IconBath,
  IconDoor,
  IconDesk,
  IconHanger,
  IconDeviceTv,
  IconFlame,
  IconToolsKitchen2,
  IconTag,
  IconPhoto,
} from '@tabler/icons-react';
import { StudentCurrentBooking } from '@domas/ts-types';

// ─── Amenity icon map ─────────────────────────────────────────────────────────

const AMENITY_ICONS: Record<string, React.ElementType> = {
  wifi: IconWifi,
  ac: IconAirConditioning,
  'air conditioning': IconAirConditioning,
  heating: IconFlame,
  mini_fridge: IconFridge,
  fridge: IconFridge,
  refrigerator: IconFridge,
  ensuite: IconBath,
  en_suite: IconBath,
  bathroom: IconBath,
  balcony: IconDoor,
  desk: IconDesk,
  wardrobe: IconHanger,
  closet: IconHanger,
  tv: IconDeviceTv,
  television: IconDeviceTv,
  kitchen: IconToolsKitchen2,
  kitchen_access: IconToolsKitchen2,
};

function AmenityBadge({ label }: { label: string }) {
  const key = label.toLowerCase().replace(/\s+/g, '_');
  const Icon = AMENITY_ICONS[key] ?? AMENITY_ICONS[label.toLowerCase()] ?? IconTag;
  return (
    <Badge
      size="md"
      variant="light"
      color="blue"
      leftSection={
        <ThemeIcon size={14} variant="transparent" color="blue">
          <Icon size={12} />
        </ThemeIcon>
      }
    >
      {label}
    </Badge>
  );
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

function PhotoGallery({ urls }: { urls: string[] }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(0);

  if (urls.length === 0) {
    return (
      <Box
        style={{
          height: 180,
          borderRadius: 8,
          background: 'var(--mantine-color-default-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <ThemeIcon size={40} radius="xl" variant="light" color="gray">
          <IconPhoto size={22} />
        </ThemeIcon>
        <Text size="sm" c="dimmed">
          {t('portal.no_room_photos', { defaultValue: 'No photos available yet.' })}
        </Text>
      </Box>
    );
  }

  return (
    <Stack gap="xs">
      {/* Hero */}
      <Image
        src={urls[selected]}
        height={220}
        radius="md"
        fit="cover"
        fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='220'%3E%3Crect fill='%23eee' width='400' height='220'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='14'%3EPhoto unavailable%3C/text%3E%3C/svg%3E"
      />

      {/* Thumbnails */}
      {urls.length > 1 && (
        <SimpleGrid cols={Math.min(urls.length, 5)} spacing={6}>
          {urls.map((url, i) => (
            <UnstyledButton key={i} onClick={() => setSelected(i)}>
              <Image
                src={url}
                height={52}
                radius="sm"
                fit="cover"
                style={{
                  opacity: i === selected ? 1 : 0.55,
                  outline:
                    i === selected
                      ? '2px solid var(--mantine-color-blue-filled)'
                      : '2px solid transparent',
                  borderRadius: 6,
                  transition: 'opacity 120ms, outline 120ms',
                }}
                fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='52'%3E%3Crect fill='%23eee' width='80' height='52'/%3E%3C/svg%3E"
              />
            </UnstyledButton>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface RoomShowcaseProps {
  booking: StudentCurrentBooking;
}

export function RoomShowcase({ booking }: RoomShowcaseProps) {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language === 'tr';

  const hasType = !!booking.roomTypeId;
  const galleryUrls = booking.roomTypeGalleryUrls ?? [];
  const amenities = booking.roomTypeAmenities ?? [];
  const description =
    isTr && booking.roomTypeDescriptionTr
      ? booking.roomTypeDescriptionTr
      : booking.roomTypeDescription;
  const typeName = isTr && booking.roomTypeNameTr ? booking.roomTypeNameTr : booking.roomTypeName;
  const roomName = isTr && booking.roomNameTr ? booking.roomNameTr : booking.roomName;

  return (
    <Stack gap="lg">
      {/* Room type name */}
      {hasType && (
        <Group gap="xs">
          <Text fw={600} size="sm">
            {roomName}
          </Text>
          <Badge variant="outline" color="blue" size="sm">
            {typeName}
          </Badge>
        </Group>
      )}

      {/* Gallery */}
      <PhotoGallery urls={galleryUrls} />

      {/* Description */}
      {description && (
        <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
          {description}
        </Text>
      )}

      {/* Amenities */}
      {amenities.length > 0 && (
        <Box>
          <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={8}>
            {t('portal.amenities', { defaultValue: 'Amenities' })}
          </Text>
          <Group gap="xs" wrap="wrap">
            {amenities.map((a) => (
              <AmenityBadge key={a} label={a} />
            ))}
          </Group>
        </Box>
      )}

      {/* No type assigned */}
      {!hasType && galleryUrls.length === 0 && amenities.length === 0 && (
        <Text size="sm" c="dimmed" ta="center" py="md">
          {t('portal.room_info_pending', {
            defaultValue: 'Room details will appear here once your room type is configured.',
          })}
        </Text>
      )}
    </Stack>
  );
}
