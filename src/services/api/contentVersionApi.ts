// Stub — re-exports types from the editor layer for backward compatibility
// Components in src/ still import types from this path.
// Will be removed when components are migrated to the layer (step 5).
export type {
  GetVersionsParams,
  RateLimitInfo,
  RestoreVersionResponse,
  VersionDetail,
  VersionsResponse,
  VersionSummary,
} from '../../../layers/editor/services/contentVersionApi'
