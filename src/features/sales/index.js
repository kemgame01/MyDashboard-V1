// src/components/sales/index.js - Modular exports for sales components

export { default as SalesDashboard } from './SalesDashboard';
export { default as SaleModal } from './SaleModal';
export { default as SalesLineGraph } from './SalesLineGraph';
export { default as SummaryCard } from './SummaryCard';
export { default as RecentSalesSection } from './RecentSalesSection';

// Re-export utilities for convenience
export * from '../../lib/salesUtils';
export * from '../../lib/validationUtils';