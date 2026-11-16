import React from 'react';
import dynamic from 'next/dynamic';
import type { DateTimePickerProps } from '@mui/x-date-pickers/DateTimePicker';

// Dynamically import the DateTimePicker component (client‑side only)
const DynamicDateTimePicker = dynamic<DateTimePickerProps<any, any>>(
  async () => {
    const mod = await import('@mui/x-date-pickers/DateTimePicker');
    return mod.DateTimePicker;
  },
  {
    ssr: false,
    loading: () => <span style={{ opacity: 0.5 }}>Loading…</span>,
  },
);

export default function LazyDateTimePicker(props: DateTimePickerProps<any, any>) {
  return <DynamicDateTimePicker {...props} />;
}
