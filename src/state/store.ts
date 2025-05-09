import {
  combineReducers,
  configureStore,
  createSerializableStateInvariantMiddleware,
  Dispatch,
  Middleware,
  Slice,
  UnknownAction // Changed from AnyAction for RTK 2.0
} from '@reduxjs/toolkit';
import { logger } from 'redux-logger';
import { thunk } from 'redux-thunk'; // Changed for redux-thunk v3
import {
 alias, applyMiddleware, Store, createWrapStore // Changed for webext-redux v3
} from 'webext-redux';

import * as contentSlice from 'src/state/slices/content';
import * as sidePanelSlice from 'src/state/slices/sidePanel';
import { State } from 'src/state/State';

type BuildStoreOptions = {
    reducers?: {
        [key in string]: Slice
    };
    channelName?: string; // Changed from portName for webext-redux v3
};

const backgroundAliases = { ...sidePanelSlice.aliases, ...contentSlice.aliases };

const middleware: Middleware[] = [
  alias(backgroundAliases) as Middleware,
  thunk as Middleware, // Use named import
  createSerializableStateInvariantMiddleware(),
  logger as Middleware
];

// Middleware for createStoreProxy (needs all explicit middleware)
const middlewareForProxy: Middleware[] = [
  alias(backgroundAliases) as Middleware,
  thunk as Middleware,
  createSerializableStateInvariantMiddleware(),
  logger as Middleware,
];

// Middleware to be added to getDefaultMiddleware for configureStore
const additionalMiddlewareForConfigureStore: Middleware[] = [
  alias(backgroundAliases) as Middleware,
  logger as Middleware,
];

const buildStoreWithDefaults = ({ channelName }: BuildStoreOptions = {}) => { // Changed from portName
  const reducer = combineReducers<State, UnknownAction>({ // Changed from AnyAction
    sidePanel: sidePanelSlice.reducer,
    content: contentSlice.reducer
  });

  const store = configureStore({
    devTools: true,
    reducer,
    middleware: (getDefaultMiddleware) => // Changed to callback for RTK 2.0
      getDefaultMiddleware().concat(additionalMiddlewareForConfigureStore),
  });

  if (channelName) { // Changed from portName
    const specificWrapStore = createWrapStore({ channelName });
    specificWrapStore(store);
  }

  return store;
};

export default buildStoreWithDefaults;

export const createStoreProxy = (channelName: string) => { // Changed from portName
  const store = new Store<State, UnknownAction>({ channelName }); // Changed from portName and AnyAction

  applyMiddleware(store, ...middlewareForProxy); // Use dedicated middleware array

  return store;
};
