import { CapabilityProbe } from '../../src/engine';
import type { CapabilityReport } from './types';

/**
 * Provides capability facts for the playground's explicit debug surface.
 * This bridge is intentionally not part of the package public API.
 */
export function createDebugObservability(): CapabilityReport {
  return CapabilityProbe.probe();
}
