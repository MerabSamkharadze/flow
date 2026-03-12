/**
 * Root NgRx Store — barrel file
 *
 * The root store is intentionally empty. Feature modules register
 * their own state slices via StoreModule.forFeature().
 *
 * This file provides the top-level AppState interface that combines
 * all feature state slices for type-safe store access.
 */

import { AuthState } from '../features/auth/store/auth.reducer';

/**
 * AppState — the complete shape of the NgRx store.
 *
 * Each property corresponds to a lazy-loaded feature state slice.
 * The '?' optional markers reflect that these slices only exist
 * after their feature module has been loaded.
 */
export interface AppState {
  auth?: AuthState;
  // projects?: ProjectsState;
  // tasks?: TasksState;
}
