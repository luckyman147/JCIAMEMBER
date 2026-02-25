// Barrel re-export — all consumers continue to import from this file as before.
export type { JPSResult, JPSDetails, JPSComparison, PerformanceCategory } from './jps/types';
export { JPS_CATEGORIES, getJPSCategory } from './jps/types';
export { jpsService } from './jps/core';
