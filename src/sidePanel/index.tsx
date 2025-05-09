// src/index.tsx
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { createStoreProxy } from 'src/state/store';
import ChannelNames from 'src/types/ChannelNames';

import Cognito from './Cognito';
import { ConfigProvider } from './ConfigContext';

// Ensure this file includes Tailwind directives and necessary global styles
import 'src/content/index.css';
// Import cn utility (adjust path if necessary)
import { cn } from '@/src/background/util'; // Using the path you provided

const store = createStoreProxy(ChannelNames.ContentPort);
const container = document.getElementById('root');

store.ready().then(() => {
  if (container == null) {
    throw new Error('Root container not found');
  }

  const root = createRoot(container);

  root.render(
    <Provider store={store}>
      <ConfigProvider>
        <Cognito />
      </ConfigProvider>
    </Provider>
  );
});