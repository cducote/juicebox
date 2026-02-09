// Shared response types used across admin + customer apps
// Expanded in Phase 2 when CRUD is built

export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};
