import { getCurrentTab, injectContentScript } from 'src/background/util';
import buildStoreWithDefaults from 'src/state/store';
import storage from 'src/background/storageUtil';
import ChannelNames from '../types/ChannelNames';

buildStoreWithDefaults({ channelName: ChannelNames.ContentPort });

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error);

chrome.runtime.onConnect.addListener(port => {
  if (port.name !== ChannelNames.SidePanelPort) return;
  
  let tabListenersActive = false;

  const handleTabActivated = async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab?.url && !tab.url.startsWith('chrome')) {
      injectContentScript(activeInfo.tabId);
    }
  };

  const handleTabUpdated = async (tabId, changeInfo, tab) => {
    if (tab?.url && changeInfo.status === 'complete' && !tab.url.startsWith('chrome')) {
      injectContentScript(tabId);
    }
  };

  port.onMessage.addListener(async (msg) => {
    if (msg.type === 'init') {
      const tab = await getCurrentTab();
      if (tab?.id && tab.url && !tab.url.startsWith('chrome')) {
        injectContentScript(tab.id);
      }

      if (!tabListenersActive) {
        chrome.tabs.onActivated.addListener(handleTabActivated);
        chrome.tabs.onUpdated.addListener(handleTabUpdated);
        tabListenersActive = true;
      }
    }
  });

  port.onDisconnect.addListener(() => {
    if (tabListenersActive) {
      chrome.tabs.onActivated.removeListener(handleTabActivated);
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
      tabListenersActive = false;
    }
  });
});

// Handle content script messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PAGE_CONTENT') {
    sendResponse({
      title: document?.title || '',
      text: document?.body?.innerText?.replace(/\s\s+/g, ' ') || '',
      html: document?.body?.innerHTML || ''
    });
  }
  return true;
});

export {};
