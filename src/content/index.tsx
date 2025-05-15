import { contentLoaded } from 'src/state/slices/content';
import { createStoreProxy } from 'src/state/store';
import ChannelNames from '../types/ChannelNames';

(async () => {
  try {
    if (
      window.location.protocol === 'chrome:' ||
      window.location.protocol === 'chrome-extension:'
    ) {
      console.debug('Skipping restricted URL:', window.location.protocol);
      return;
    }

    const store = createStoreProxy(ChannelNames.ContentPort);

    try {
      await store.ready();
      store.dispatch(contentLoaded());
    } catch (initError) {
      console.debug('Store initialization error:', initError);
    }
  } catch (err) {
    console.debug('Content script error:', err);
  }
})();

export {};