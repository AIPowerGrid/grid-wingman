import { useState, useLayoutEffect, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiCopy, FiRepeat, FiPlay, FiPause, FiSquare } from 'react-icons/fi';
import { MessageTurn } from './ChatHistory';
import { EditableMessage } from './Message'; 
import {
  speakMessage,
  stopSpeech,
  pauseSpeech,
  resumeSpeech,
  isCurrentlySpeaking,
  isCurrentlyPaused,
} from '../background/ttsUtils';
import { useConfig } from './ConfigContext';
import { Button } from "@/components/ui/button";
import { cn } from "@/src/background/util";

const cleanTextForTTS = (text: string): string => {
  let cleanedText = text;
  cleanedText = cleanedText.replace(/(\*\*|__|\*|_)(.*?)\1/g, '$2');
  cleanedText = cleanedText.replace(/^[*+-]\s+/gm, '');
  cleanedText = cleanedText.replace(/\*/g, '');
  cleanedText = cleanedText.replace(/:/g, '.');
  cleanedText = cleanedText.replace(/\//g, ' ');
  cleanedText = cleanedText.replace(/\s{2,}/g, ' ');
  return cleanedText.trim();
};

interface MessagesProps {
  turns?: MessageTurn[];
  isLoading?: boolean;
  onReload?: () => void;
  settingsMode?: boolean;
  onEditTurn: (index: number, newContent: string) => void;
}

export const Messages: React.FC<MessagesProps> = ({
  turns = [], isLoading = false, onReload = () => {}, settingsMode = false, onEditTurn
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [speakingIndex, setSpeakingIndex] = useState<number>(-1);
  const [ttsIsPaused, setTtsIsPaused] = useState<boolean>(false);
  const { config } = useConfig();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentlyPaused = isCurrentlyPaused();
      const currentlySpeaking = isCurrentlySpeaking();

      if (!currentlySpeaking && speakingIndex !== -1) {
        setSpeakingIndex(-1);
        setTtsIsPaused(false);
      }
      else if (currentlySpeaking && ttsIsPaused !== currentlyPaused) {
        setTtsIsPaused(currentlyPaused);
      }
      else if (currentlyPaused && speakingIndex === -1) {
         setTtsIsPaused(true);
      }

    }, 250);

    return () => clearInterval(interval);
  }, [speakingIndex, ttsIsPaused]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container) {
      const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      const isNearBottom = scrollBottom < 200;
      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [turns]);

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy'));
  };

  const handlePlay = (index: number, text: string) => {
    console.log(`Attempting to play index: ${index}`);
    const textToSpeak = cleanTextForTTS(text);
    console.log(`Cleaned text for TTS: "${textToSpeak}"`);
    speakMessage(textToSpeak, config?.tts?.selectedVoice, config?.tts?.rate, {
      onStart: () => { console.log(`Speech started for index: ${index}`); setSpeakingIndex(index); setTtsIsPaused(false); },
      onEnd: () => { console.log(`Speech ended for index: ${index}`); if (speakingIndex === index) { setSpeakingIndex(-1); setTtsIsPaused(false); } },
      onPause: () => { console.log(`Speech paused for index: ${index}`); if (speakingIndex === index) { setTtsIsPaused(true); } },
      onResume: () => { console.log(`Speech resumed for index: ${index}`); if (speakingIndex === index) { setTtsIsPaused(false); } },
    });
  };

  const handlePause = () => { console.log("Handle pause called"); pauseSpeech(); };
  const handleResume = () => { console.log("Handle resume called"); resumeSpeech(); };
  const handleStop = () => { console.log("Handle stop called"); stopSpeech(); setSpeakingIndex(-1); setTtsIsPaused(false); };

  const startEdit = (index: number, currentContent: string) => { setEditingIndex(index); setEditText(currentContent); };
  const cancelEdit = () => { setEditingIndex(null); setEditText(''); };
  const saveEdit = () => { if (editingIndex !== null && editText.trim()) { onEditTurn(editingIndex, editText); } cancelEdit(); };

  return (
    <div
      ref={containerRef}
      id="messages"
      className={cn(
        "flex flex-col flex-grow w-full overflow-y-auto pb-2 pt-2",
        "no-scrollbar"
      )}
      style={{
        background: config?.paperTexture ? 'transparent' : 'var(--bg)',
        opacity: settingsMode ? 0 : 1,
      }}
    >
      {turns.map(
        (turn, i) => turn && (
          (<div
            key={turn.timestamp || `turn_${i}`}
            className={cn(
              "flex items-start w-full mt-1 mb-1 px-2 relative",
              turn.role === 'user' ? 'justify-start' : 'justify-end'
            )}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(-1)}
          >
            {turn.role === 'assistant' && (
              (<div
                className={cn(
                  "flex flex-col items-center self-end space-y-0 mr-1 pb-3 transition-opacity duration-200",
                  (hoveredIndex === i || speakingIndex === i) ? 'opacity-100' : 'opacity-0'
                )}
              >
                {editingIndex !== i && (
                  <Button aria-label="Copy" variant="ghost" size="sm" onClick={() => copyMessage(turn.rawContent)} title="Copy message">
                    <FiCopy className="h-4 w-4 text-[var(--text)]" />
                  </Button>
                )}
                {speakingIndex === i ? (
                  ttsIsPaused ? (
                    <Button aria-label="Resume" variant="ghost" size="sm" onClick={handleResume} title="Resume speech">
                      <FiPlay className="h-4 w-4 text-[var(--text)]" />
                    </Button>
                  ) : (
                    <Button aria-label="Pause" variant="ghost" size="sm" onClick={handlePause} title="Pause speech">
                      <FiPause className="h-4 w-4 text-[var(--text)]" />
                    </Button>
                  )
                ) : (
                  <Button aria-label="Speak" variant="ghost" size="sm" onClick={() => handlePlay(i, turn.rawContent)} title="Speak message">
                    <FiPlay className="h-4 w-4 text-[var(--text)]" />
                  </Button>
                )}
                {speakingIndex === i && (
                   <Button aria-label="Stop" variant="ghost" size="sm" onClick={handleStop} title="Stop speech">
                     <FiSquare className="h-4 w-4 text-[var(--text)]" />
                   </Button>
                )}
                {i === turns.length - 1 && (
                  <Button aria-label="Reload" variant="ghost" size="sm" onClick={onReload} title="Reload last prompt">
                    <FiRepeat className="h-4 w-4 text-[var(--text)]" />
                  </Button>
                )}
              </div>)
            )}
            <EditableMessage
              turn={turn}
              index={i}
              isEditing={editingIndex === i}
              editText={editText}
              onStartEdit={startEdit}
              onSetEditText={setEditText}
              onSaveEdit={saveEdit}
              onCancelEdit={cancelEdit} />
            {turn.role === 'user' && (
              (<div
                 className={cn(
                  "flex flex-col items-center self-end space-y-0 ml-1 pb-1 transition-opacity duration-200",
                  hoveredIndex === i ? 'opacity-100' : 'opacity-0'
                )}
              >
                {editingIndex !== i && (
                  <Button aria-label="Copy" variant="ghost" size="sm" onClick={() => copyMessage(turn.rawContent)} title="Copy message">
                    <FiCopy className="h-4 w-4 text-[var(--text)]" />
                  </Button>
                )}
              </div>)
            )}
          </div>)
        )
      )}
      <div ref={messagesEndRef} style={{ height: '1px' }} />
    </div>
  );
};