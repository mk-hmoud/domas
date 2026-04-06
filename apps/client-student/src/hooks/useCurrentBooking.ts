import { useEffect, useState } from 'react';
import { portalBookings } from '@domas/api-client';
import { StudentCurrentBooking } from '@domas/ts-types';

interface UseCurrentBookingResult {
  booking: StudentCurrentBooking | null;
  isLoading: boolean;
  refetch: () => void;
}

export function useCurrentBooking(): UseCurrentBookingResult {
  const [booking, setBooking] = useState<StudentCurrentBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    portalBookings
      .getCurrent()
      .then(setBooking)
      .catch(() => setBooking(null))
      .finally(() => setIsLoading(false));
  }, [tick]);

  const refetch = () => setTick((t) => t + 1);

  return { booking, isLoading, refetch };
}
