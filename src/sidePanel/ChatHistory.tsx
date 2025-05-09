import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area'; // Your custom ScrollArea
import { FiTrash2 } from 'react-icons/fi';
import localforage from 'localforage';

const dateToString = (date: number | Date): string => new Date(date).toLocaleDateString('sv-SE');

export interface MessageTurn {
  role: 'user' | 'assistant';
  status: 'complete' | 'streaming' | 'error';
  rawContent: string;
  webDisplayContent?: string;
  timestamp: number;
}
export type ChatMessage = {
  id: string;
  last_updated: number;
  title?: string;
  model?: string;
  turns: MessageTurn[];
};

type ChatHistoryProps = {
  loadChat: (chat: ChatMessage) => void;
  onDeleteAll: () => void;
  className?: string; // Expects "flex-1 w-full overflow-y-auto min-h-0" or similar
};

declare global {
  interface Window {
    deleteAllChats?: () => void;
  }
}

// Configurable: Maximum number of chat sessions to display per page.
// You can change this value as needed. For testing, it's set to 3.
export const ITEMS_PER_PAGE = 13;

export const ChatHistory = ({ loadChat, onDeleteAll, className }: ChatHistoryProps) => {
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);

  const processAndSetMessages = useCallback((messages: ChatMessage[]) => {
    const sortedMessages = messages.sort((a, b) => b.last_updated - a.last_updated);
    setAllMessages(sortedMessages);
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const keys = await localforage.keys();
        const storedMessagesPromises = keys
          .filter(key => !key.startsWith('localforage'))
          .map(key => localforage.getItem(key));
        const storedItems = await Promise.all(storedMessagesPromises);
        const validMessages = storedItems.filter(
          item => item !== null && typeof item === 'object' && 'id' in item && 'last_updated' in item
        ) as ChatMessage[];
        processAndSetMessages(validMessages);
        setCurrentPage(1);
      } catch (error) { console.error("Error fetching messages:", error); setAllMessages([]); }
    };
    fetchMessages();
  }, [processAndSetMessages]);

  const paginatedMessages = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allMessages.slice(startIndex, endIndex);
  }, [allMessages, currentPage]);

  const messagesWithDates = useMemo(() => {
    return paginatedMessages.map(m => ({ ...m, date: dateToString(m.last_updated) }));
  }, [paginatedMessages]);

  const uniqueDates = useMemo(() => {
    return Array.from(new Set(messagesWithDates.map(m => m.date)));
  }, [messagesWithDates]);

  const deleteMessage = useCallback(async (id: string) => {
    try {
      await localforage.removeItem(id);
      const keys = await localforage.keys();
      const storedItems = await Promise.all(keys.filter(k => !k.startsWith('localforage')).map(k => localforage.getItem(k)));
      const validMessages = storedItems.filter(item => item && typeof item === 'object' && 'id' in item && 'last_updated' in item) as ChatMessage[];
      processAndSetMessages(validMessages);
      const newTotalPages = Math.max(1, Math.ceil(validMessages.length / ITEMS_PER_PAGE));
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages);
      } else {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        if (validMessages.slice(startIndex, startIndex + ITEMS_PER_PAGE).length === 0 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      }
    } catch (e) { console.error("Error deleting message:", e); }
  }, [processAndSetMessages, currentPage]);

  const deleteAll = useCallback(async () => {
    try {
      const keys = await localforage.keys();
      await Promise.all(keys.filter(k => !k.startsWith('localforage')).map(k => localforage.removeItem(k)));
      setAllMessages([]);
      setCurrentPage(1);
      if (onDeleteAll) onDeleteAll();
    } catch (e) { console.error("Error deleting all messages:", e); }
  }, [onDeleteAll]);

  useEffect(() => {
    window.deleteAllChats = deleteAll;
    return () => {
      if (window.deleteAllChats === deleteAll) delete window.deleteAllChats;
    };
  }, [deleteAll]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(allMessages.length / ITEMS_PER_PAGE)), [allMessages]);
  const handleNextPage = useCallback(() => setCurrentPage(p => Math.min(p + 1, totalPages)), [totalPages]);
  const handlePrevPage = useCallback(() => setCurrentPage(p => Math.max(p - 1, 1)), []);


  if (allMessages.length === 0) {
    return (
      <ScrollArea
        className={className || "w-full"} // Should be "flex-1 w-full overflow-y-auto min-h-0"
      >
        <div className="px-4 pb-4 pt-5 text-center text-foreground/70">
          No chat history found.
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea
      className={className} // Should be "flex-1 w-full overflow-y-auto min-h-0"
    >
      <div className="px-4 pb-4 flex flex-col justify-start"> {/* Ensures content within starts at top */}
        {uniqueDates.map(date => (
          <div key={date} className="mb-3 mt-3">
            <p
              className="text-foreground text-xl font-extrabold overflow-hidden pl-4 pb-1 text-left text-ellipsis whitespace-nowrap w-[90%]"
            >
              {date === dateToString(new Date()) ? 'Today' : date}
            </p>
            {messagesWithDates
              .filter(m => m.date === date)
              .map(message => (
                <div
                  key={message.id}
                  className="flex items-center group"
                  onMouseEnter={() => setHoverId(message.id)}
                  onMouseLeave={() => setHoverId(null)}
                >
                  <span className="text-foreground text-lg font-normal pl-4 w-[4.5rem] flex-shrink-0">
                    {(`0${(new Date(message.last_updated)).getHours()}`).slice(-2)}:{(`0${(new Date(message.last_updated)).getMinutes()}`).slice(-2)}
                  </span>
                  <button className={`text-foreground text-lg font-semibold overflow-hidden px-4 py-2 text-left text-ellipsis whitespace-nowrap flex-grow hover:underline hover:underline-offset-4 hover:decoration-2 ${message.id === removeId ? 'line-through decoration-2' : ''}`} onClick={() => loadChat(message)}>
                    {message.title || 'Untitled Chat'}
                  </button>
                  <motion.div className={`transition-opacity duration-150 ${hoverId === message.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} whileHover={{ rotate: '15deg' }} onMouseEnter={() => setRemoveId(message.id)} onMouseLeave={() => setRemoveId(null)}>
                    <Button variant="ghost" size="sm" aria-label="Delete chat" className="rounded-full w-8 h-8" onClick={(e) => { e.stopPropagation(); deleteMessage(message.id); }}>
                      <FiTrash2 className="h-4 w-4 text-foreground" />
                    </Button>
                  </motion.div>
                </div>
              ))}
          </div>
        ))}

        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-4">
            {/* ... pagination buttons ... */}
            <Button onClick={handlePrevPage} disabled={currentPage === 1} variant="outline">Prev</Button>
            <span>Page {currentPage} of {totalPages}</span>
            <Button onClick={handleNextPage} disabled={currentPage === totalPages} variant="outline">Next</Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};