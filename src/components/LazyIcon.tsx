import React from 'react';
import dynamic from 'next/dynamic';
import type { LucideProps } from 'lucide-react';

type IconName = keyof typeof import('lucide-react');

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
};

const LazyIcon = ({ name, size = 20, color = 'currentColor', className }: Props) => {
  const Icon = dynamic<LucideProps>(
    async () => {
      const icons = await import('lucide-react');
      // @ts-ignore – dynamic key access (name is guaranteed by IconName)
      return icons[name] as React.ComponentType<LucideProps>;
    },
    { ssr: false, loading: () => null }
  );

  return <Icon size={size} color={color} className={className} />;
};

export default LazyIcon;
