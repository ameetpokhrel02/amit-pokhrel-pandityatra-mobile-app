import React from 'react';
import { Banner } from '@/services/banner.service';
import { PromoBannerRow } from './PromoBannerRow';

export const FlashSale = ({ banners }: { banners?: Banner[] }) => (
  <PromoBannerRow
    title="Flash Sale"
    icon="flame"
    accent="#EF4444"
    defaultCta="Shop Now"
    banners={banners?.filter((b) => b.banner_type === 'SALE_BANNER') ?? []}
  />
);
