import { useCallback, useState, useRef } from 'react';
import storage from 'src/util/storageUtil';
import { useConfig } from '../ConfigContext';
import { GEMINI_URL, GROQ_URL, OPENAI_URL, OPENROUTER_URL } from '../constants';
import type { Model } from 'src/types/config';
import { normalizeApiEndpoint } from 'src/background/util';

const fetchDataSilently = async (url: string, params = {}) => {
  try {
    const res = await fetch(url, params);
    if (!res.ok) {
      console.error(`[fetchDataSilently] HTTP error! Status: ${res.status} for URL: ${url}`);
      return undefined;
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`[fetchDataSilently] Fetch or JSON parse error for URL: ${url}`, error);
    return undefined;
  }
};

export const useUpdateModels = () => {
  const [chatTitle, setChatTitle] = useState('');
  const { config, updateConfig } = useConfig();

  // Helper to update models in config
  const updateModels = useCallback((newModels: Model[], host: string) => {
    const haveModelsChanged = (newModels: Model[], existingModels: Model[] = []) => {
      if (newModels.length !== existingModels.length) return true;
      const sortById = (a: Model, b: Model) => a.id.localeCompare(b.id);
      const sortedNew = [...newModels].sort(sortById);
      const sortedExisting = [...existingModels].sort(sortById);
      return JSON.stringify(sortedNew) !== JSON.stringify(sortedExisting);
    };

    const existingModels = (config?.models ?? []).filter(m => m.host !== host);
    const combinedModels = [...existingModels, ...newModels];

    if (haveModelsChanged(combinedModels, config?.models)) {
      const isSelectedAvailable = config?.selectedModel &&
        combinedModels.some(m => m.id === config?.selectedModel);

      updateConfig({
        models: combinedModels,
        selectedModel: isSelectedAvailable ? config?.selectedModel : combinedModels[0]?.id
      });
    }
  }, [config, updateConfig]);
  
  const FETCH_INTERVAL =  30 * 1000; // 30s
  const lastFetchRef = useRef(0);

  const fetchAllModels = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < FETCH_INTERVAL) {
      console.log('[useUpdateModels] Model fetch throttled');
      return;
    }
    lastFetchRef.current = now;

    if (config?.ollamaUrl && config?.ollamaConnected) {
      console.log('[useUpdateModels] Fetching Ollama models...');
      const ollamaModels = await fetchDataSilently(`${config.ollamaUrl}/api/tags`);
      if (!ollamaModels) {
        updateConfig({ ollamaConnected: false, ollamaUrl: '' });
        // Clear existing ollama models on fetch failure
        updateModels([], 'ollama');
      } else {
        const parsedModels = (ollamaModels?.models as Model[] ?? []).map(m => ({
          ...m, id: m.id, host: 'ollama'
        }));
        updateModels(parsedModels, 'ollama');
      }
    } else {
      updateModels([], 'ollama');
    }

    // Gemini
    if (config?.geminiApiKey) {
      console.log('[useUpdateModels] Fetching Gemini models...');
      const geminiModels = await fetchDataSilently(GEMINI_URL, { headers: { Authorization: `Bearer ${config.geminiApiKey}` } });
      if (geminiModels) {
        const parsedModels = (geminiModels?.data as Model[] ?? []).filter(m => m.id.startsWith('models/gemini')).map(m => ({
          ...m, id: m.id, host: 'gemini'
        }));
        updateModels(parsedModels, 'gemini');
      }
    } else {updateModels([], 'gemini');
    }

    // LM Studio

    if (config?.lmStudioUrl && config?.lmStudioConnected) {
      console.log('[useUpdateModels] Fetching LM Studio models...');
      const lmStudioModels = await fetchDataSilently(`${config.lmStudioUrl}/v1/models`);
      if (!lmStudioModels) {
        updateConfig({ lmStudioConnected: false, lmStudioUrl: '' });
        // Clear existing lmStudio models on fetch failure
        updateModels([], 'lmStudio');
      } else {
        const parsedModels = (lmStudioModels?.data as Model[] ?? []).map(m => ({
          ...m, id: m.id, host: 'lmStudio'
        }));
        updateModels(parsedModels, 'lmStudio');
      }
    } else {
      updateModels([], 'lmStudio');
    }

    // Groq
    if (config?.groqApiKey) {
      console.log('[useUpdateModels] Fetching Groq models...');
      const groqModels = await fetchDataSilently(GROQ_URL, { headers: { Authorization: `Bearer ${config.groqApiKey}` } });
      if (groqModels) {
        const parsedModels = (groqModels?.data as Model[] ?? []).map(m => ({
          ...m, id: m.id, host: 'groq'
        }));
        updateModels(parsedModels, 'groq');
      }
    } else {      
      updateModels([], 'groq');
    }
    // OpenAI
    if (config?.openAiApiKey) {
      console.log('[useUpdateModels] Fetching OpenAI models...');
      const openAiModels = await fetchDataSilently(OPENAI_URL, { headers: { Authorization: `Bearer ${config.openAiApiKey}` } });
      if (openAiModels) {
        const parsedModels = (openAiModels?.data as Model[] ?? []).filter(m => m.id.startsWith('gpt-')).map(m => ({
          ...m, id: m.id, host: 'openai'
        }));
        updateModels(parsedModels, 'openai');
      }
    } else {
      updateModels([], 'openai');
    }

    // OpenRouter
    if (config?.openRouterApiKey) {
      console.log('[useUpdateModels] Fetching OpenRouter models...');
      const openRouterModels = await fetchDataSilently(OPENROUTER_URL, { headers: { Authorization: `Bearer ${config.openRouterApiKey}` } });
      if (openRouterModels) {
        const parsedModels = (openRouterModels?.data as Model[] ?? []).map(m => ({
          ...m, id: m.id, context_length: m.context_length, host: 'openrouter'
        }));
        updateModels(parsedModels, 'openrouter');
      }
    } else {
      updateModels([], 'openrouter');
    }

    // Custom Endpoint
    if (config?.customEndpoint) { // Check only for the endpoint URL existence
      const normalizedUrl = normalizeApiEndpoint(config?.customEndpoint);
      console.log('[useUpdateModels] Fetching Custom Endpoint models...');
      const customModels = await fetchDataSilently(
        `${normalizedUrl}/v1/models`,
        { headers: { Authorization: `Bearer ${config.customApiKey}` } }
      );
      const modelsArray = Array.isArray(customModels)
        ? customModels
        : customModels?.data;
      if (modelsArray && Array.isArray(modelsArray)) {
        const parsedModels = (modelsArray as Model[]).map(m => ({
          ...m, id: m.id, host: 'custom'
        }));
        updateModels(parsedModels,'custom');
      } else {
        // Fetch failed, clear existing custom models and mark as disconnected
        console.log('[useUpdateModels] Failed to fetch from Custom Endpoint. Clearing models.');
        updateModels([], 'custom');
        // Optionally, update a 'customConnected' flag if you have one:
        // updateConfig({ customConnected: false });
      }
    } else {
      updateModels([], 'custom');
    }
  }, [config, updateModels, updateConfig]);

  return { chatTitle, setChatTitle, fetchAllModels };
};
