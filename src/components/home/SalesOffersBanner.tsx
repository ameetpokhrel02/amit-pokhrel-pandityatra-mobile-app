import React from 'react';
import { Banner } from '@/services/banner.service';
import { useTheme } from '@/store/ThemeContext';
import { PromoBannerRow } from './PromoBannerRow';

export const SalesOffersBanner = ({ banners }: { banners?: Banner[] }) => {
  const { colors } = useTheme();
  return (
    <PromoBannerRow
      title="Special Offers"
      icon="sparkles"
      accent={colors.primary}
      defaultCta="View Offer"
      banners={banners?.filter((b) => b.banner_type === 'OFFER_BANNER' || b.banner_type === 'DISCOUNT_BANNER') ?? []}
    />
  );
};
