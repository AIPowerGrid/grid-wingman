import { MessageTurn } from '../ChatHistory';
import type { Config, Model } from 'src/types/config';
import { processQueryWithAI } from '../network'; // Assuming processQueryWithAI is in network.ts

// Delay between sub-queries in MS for Medium/High compute
const SUB_QUERY_DELAY_MS = 1000; // 1 second

// Helper function to parse numbered list results more robustly
const parseNumberedList = (text: string): string[] => {
  if (!text) return [];
  const lines = text.split('\n');
  const results: string[] = [];
  const regex = /^\s*\d+\.\s*(.*)/; // Matches lines starting with number and dot, captures the rest
  for (const line of lines) {
    const match = line.match(regex);
    if (match && match[1]) {
      results.push(match[1].trim());
    }
  }
  return results;
};

export const handleHighCompute = async (
  message: string,
  history: MessageTurn[],
  config: Config,
  currentModel: Model,
  authHeader: Record<string, string> | undefined,
  onUpdate: (content: string, isFinished?: boolean) => void
) => {
  // TODO: Implement robust error handling (try/catch around processQueryWithAI)
  // TODO: Pass relevant overall context (history, page/web content) into sub-problems
  // TODO: Implement fallback logic (e.g., to Medium) if decomposition fails
  const controlTemp = Math.max(0.1, (config.temperature || 0.7) * 0.5);

  onUpdate("Decomposing task into stages...", false);
  await new Promise(resolve => setTimeout(resolve, SUB_QUERY_DELAY_MS));

  const l1Prompt = `You are a planning agent. Given the original task: "${message}", break it down into the main sequential stages required to accomplish it. Output *only* a numbered list of stages. Example:\n1. First stage\n2. Second stage`;
  const l1DecompositionResult = await processQueryWithAI(l1Prompt, config, currentModel, authHeader, [], controlTemp);
  const stages = parseNumberedList(l1DecompositionResult); // Use helper

  if (!stages || stages.length === 0) {
    onUpdate("Error: Failed to decompose task into stages. Falling back to direct query.", true);
    return "Error: Could not decompose task.";
  }

  const stageResults: string[] = [];
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    onUpdate(`Processing Stage ${i + 1}/${stages.length}: ${stage}...`, false);

    // Level 2 Decomposition (Steps)
    const l2Prompt = `You are a planning agent. Given the stage: "${stage}", break it down into the specific sequential steps needed to complete it. Output *only* a numbered list of steps. If no further breakdown is needed, output "No breakdown needed."`;
    await new Promise(resolve => setTimeout(resolve, SUB_QUERY_DELAY_MS));
    const l2DecompositionResult = await processQueryWithAI(l2Prompt, config, currentModel, authHeader, [], controlTemp);
    const steps = parseNumberedList(l2DecompositionResult); // Use helper

    let currentStageResult = '';
    if (steps.length === 0 || l2DecompositionResult.includes("No breakdown needed")) {
      onUpdate(`Solving Stage ${i + 1} directly...`, false);
      const stageSolvePrompt = `Complete the following stage based on the original task "${message}": "${stage}"`;
      await new Promise(resolve => setTimeout(resolve, SUB_QUERY_DELAY_MS));
      currentStageResult = await processQueryWithAI(stageSolvePrompt, config, currentModel, authHeader);
    } else {
      const stepResults: string[] = [];
      const batchSize = 2; // Adjust as needed
      let accumulatedContext = ""; // Context within this stage

      for (let j = 0; j < steps.length; j += batchSize) {
        const batch = steps.slice(j, j + batchSize);
        const batchNumber = j / batchSize + 1;
        const stepNumbers = batch.map((_, index) => j + index + 1);

        onUpdate(`Solving Steps ${stepNumbers.join(', ')} for Stage ${i + 1}...`, false);

        // Construct the prompt for the batch, including accumulated context
        // TODO: Add overall history/page/web context here if needed
        const batchPrompt = `You are an expert problem solver. Given the stage: "${stage}" and the original task: "${message}", complete the following steps. Consider the accumulated context from previous steps in this stage:\n<context>\n${accumulatedContext || 'None yet.'}\n</context>\n\nSteps to solve:\n${batch.map((step, index) => `${stepNumbers[index]}. ${step}`).join('\n')}\n\nProvide your answer *only* as a numbered list corresponding to the steps provided, like this:\n1. [Result for step 1]\n2. [Result for step 2]...`;

        await new Promise(resolve => setTimeout(resolve, SUB_QUERY_DELAY_MS));
        const batchResults = await processQueryWithAI(batchPrompt, config, currentModel, authHeader);

        const parsedBatchResults = parseNumberedList(batchResults); // Use helper

        // Basic check: Does the number of results match the batch size?
        // More robust checking could be added here.
        for (let k = 0; k < parsedBatchResults.length; k++) {
          const stepResult = parsedBatchResults[k];
          stepResults.push(stepResult);
          accumulatedContext += `Step ${j + k + 1}: ${stepResult}\n`; // Update accumulated context
        }
      }

      // Synthesize Step Results into Stage Result
      onUpdate(`Synthesizing results for Stage ${i + 1}...`, false);
      await new Promise(resolve => setTimeout(resolve, SUB_QUERY_DELAY_MS));
      const stageSynthPrompt = `Synthesize the results of the following steps for stage "${stage}" into a coherent paragraph:\n\n${stepResults.map((r, idx) => `Step ${idx + 1} Result:\n${r}`).join('\n\n')}`;
      currentStageResult = await processQueryWithAI(stageSynthPrompt, config, currentModel, authHeader, [], controlTemp);
    }
    stageResults.push(currentStageResult);
  }


  // --- Final Synthesis ---
  onUpdate("Synthesizing final answer...", false);
  // Modify the prompt to ask for a summary *based on* the stages, rather than just replacing them.
  const finalSynthPrompt = `Based on the results of the following stages, provide a final comprehensive answer for the original task "${message}":\n\n${stageResults.map((r, idx) => `Stage ${idx + 1} ("${stages[idx]}") Result:\n${r}`).join('\n\n')}`;
  await new Promise(resolve => setTimeout(resolve, SUB_QUERY_DELAY_MS)); // Delay
  const finalSynthesizedAnswer = await processQueryWithAI(finalSynthPrompt, config, currentModel, authHeader, [], controlTemp);
  // Construct a detailed final output including stage summaries
  const detailedFinalOutput = `**High Compute Breakdown:**\n\n` +
                              stageResults.map((r, idx) => `**Stage ${idx + 1}: ${stages[idx]}**\n${r}`).join('\n\n---\n\n') +
                              `\n\n---\n**Final Synthesized Answer:**\n${finalSynthesizedAnswer}`;

  onUpdate(detailedFinalOutput, true); // Update with the detailed output
  return detailedFinalOutput; // Return the detailed output
};

export const handleMediumCompute = async (
  message: string,
  history: MessageTurn[],
  config: Config,
  currentModel: Model,
  authHeader: Record<string, string> | undefined,
  onUpdate: (content: string, isFinished?: boolean) => void
) => {
  // TODO: Implement robust error handling
  // TODO: Pass relevant overall context (history, page/web content)

  const controlTemp = Math.max(0.1, (config.temperature || 0.7) * 0.5);

  onUpdate("Decomposing task into subtasks...", false);
  await new Promise(resolve => setTimeout(resolve, SUB_QUERY_DELAY_MS));

  const decompPrompt = `You are a planning agent. Given the task: "${message}", break it down into logical subtasks needed to accomplish it. Output *only* a numbered list of subtasks.`;
  const decompositionResult = await processQueryWithAI(decompPrompt, config, currentModel, authHeader, [], controlTemp);
  const subtasks = parseNumberedList(decompositionResult); // Use helper

  if (!subtasks || subtasks.length === 0) {
    onUpdate("Warning: Failed to decompose into subtasks. Attempting direct query.", false);
    await new Promise(resolve => setTimeout(resolve, SUB_QUERY_DELAY_MS));
    const directResult = await processQueryWithAI(message, config, currentModel, authHeader);
    onUpdate(directResult, true);
    return directResult;
  }

  const batchSize = 2; // Adjust as needed based on token limits and performance
  const subtaskResults: string[] = [];
  let accumulatedContext = ""; // Context between subtask batches

  for (let i = 0; i < subtasks.length; i += batchSize) {
    const batch = subtasks.slice(i, i + batchSize);
    const batchNumber = i / batchSize + 1; // For clearer logging and updates
    const subtaskNumbers = batch.map((_, index) => i + index + 1);

    onUpdate(`Solving Subtasks ${subtaskNumbers.join(', ')}...`, false);

    // Construct the prompt for the batch
    // TODO: Add overall history/page/web context here if needed
    const batchPrompt = `You are an expert problem solver. Given the original task: "${message}", complete the following subtasks. Consider the accumulated context from previous subtasks:\n<context>\n${accumulatedContext || 'None yet.'}\n</context>\n\nSubtasks to solve:\n${batch.map((subtask, index) => `${subtaskNumbers[index]}. ${subtask}`).join('\n')}\n\nProvide your answer *only* as a numbered list corresponding to the subtasks provided, like this:\n1. [Result for subtask 1]\n2. [Result for subtask 2]...`;

    await new Promise(resolve => setTimeout(resolve, SUB_QUERY_DELAY_MS));
    const batchResults = await processQueryWithAI(batchPrompt, config, currentModel, authHeader);

    // Parse the batch results
    const parsedBatchResults = parseNumberedList(batchResults); // Use helper

    // Add the results to the subtaskResults array
    for (let j = 0; j < parsedBatchResults.length; j++) {
      const subtaskResult = parsedBatchResults[j];
      subtaskResults.push(subtaskResult);
      // Add result to accumulated context for the *next* batch
      accumulatedContext += `Subtask ${subtaskNumbers[j]}: ${subtaskResult}\n`;
    }
  }

  // Final Synthesis
  onUpdate("Synthesizing final answer...", false);
  await new Promise(resolve => setTimeout(resolve, SUB_QUERY_DELAY_MS));
  const finalSynthPrompt = `Synthesize the results of the following subtasks into a final comprehensive answer for the original task "${message}":\n\n${subtaskResults.map((r, idx) => `Subtask ${idx + 1} ("${subtasks[idx]}") Result:\n${r}`).join('\n\n')}`;
  const finalSynthesizedAnswer = await processQueryWithAI(finalSynthPrompt, config, currentModel, authHeader, [], controlTemp);

  const detailedFinalOutput = `**Medium Compute Breakdown:**\n\n` +
                              subtaskResults.map((r, idx) => `**Subtask ${idx + 1}: ${subtasks[idx]}**\n${r}`).join('\n\n---\n\n') +
                              `\n\n---\n**Final Synthesized Answer:**\n${finalSynthesizedAnswer}`;

  onUpdate(detailedFinalOutput, true);
  return detailedFinalOutput;
};
