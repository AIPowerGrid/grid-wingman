import { useCallback, useRef, useState } from 'react';
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

  // Throttled fetch function
  const lastFetchRef = useRef(0);
  const FETCH_INTERVAL = 5000; // 5s

  const fetchAllModels = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < FETCH_INTERVAL) {
      console.log('[useUpdateModels] Model fetch throttled.');
      return;
    }
    lastFetchRef.current = now;

    // Ollama
    if (config?.ollamaUrl) {
      console.log('[useUpdateModels] Fetching Ollama models...');
      const ollamaModels = await fetchDataSilently(`${config.ollamaUrl}/api/tags`);
      if (ollamaModels) {
        const parsedModels = (ollamaModels?.models as Model[] ?? []).map(m => ({
          ...m, id: m.id, host: 'ollama'
        }));
        updateModels(parsedModels, 'ollama');
      }
    }

    // LM Studio
    if (config?.lmStudioUrl) {
      console.log('[useUpdateModels] Fetching LM Studio models...');
      const lmStudioModels = await fetchDataSilently(`${config.lmStudioUrl}/v1/models`);
      if (lmStudioModels) {
        const parsedModels = (lmStudioModels?.data as Model[] ?? []).map(m => ({
          ...m, id: m.id, host: 'lmStudio'
        }));
        updateModels(parsedModels, 'lmStudio');
      }
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
    }

    // Custom Endpoint
    if (config?.customEndpoint || config?.customApiKey) {
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
        updateModels(parsedModels, 'custom');
      }
    }
  }, [config, updateModels, updateConfig]);

  return { chatTitle, setChatTitle, fetchAllModels };
};
