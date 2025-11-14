// store/index.ts - Redux Store Configuration
import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './slices/chatSlice';
import marketplaceReducer from './slices/marketplaceSlice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    marketplace: marketplaceReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for socket instances
        ignoredActions: ['chat/setSocket', 'marketplace/setSocket'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.socket'],
        // Ignore these paths in the state
        ignoredPaths: ['chat.socket', 'marketplace.socket'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;