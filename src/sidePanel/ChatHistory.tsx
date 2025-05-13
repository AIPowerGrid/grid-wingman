import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area'; // Your custom ScrollArea
import { FiTrash2 } from 'react-icons/fi';
import localforage from 'localforage';
import { Input } from '@/components/ui/input'; // Added for search

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
export const ITEMS_PER_PAGE = 12;

export const ChatHistory = ({ loadChat, onDeleteAll, className }: ChatHistoryProps) => {
  const [allMessagesFromServer, setAllMessagesFromServer] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);

  const processAndSetMessages = useCallback((messages: ChatMessage[]) => {
    const sortedMessages = messages.sort((a, b) => b.last_updated - a.last_updated);
    setAllMessagesFromServer(sortedMessages);
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const keys = await localforage.keys();
        // Filter for keys that specifically belong to chat messages (e.g., start with 'chat_')
        const chatKeys = keys.filter(key => key.startsWith('chat_'));
        if (chatKeys.length === 0) {
          setAllMessagesFromServer([]);
          setCurrentPage(1);
          return;
        }
        const storedMessagesPromises = chatKeys.map(key => localforage.getItem(key));

        const storedItems = await Promise.all(storedMessagesPromises);
        const validMessages = storedItems.filter(
          item => item !== null && typeof item === 'object' && 'id' in item && 'last_updated' in item
        ) as ChatMessage[];
        processAndSetMessages(validMessages);
        setCurrentPage(1);
      } catch (error) { console.error("Error fetching messages:", error); setAllMessagesFromServer([]); }
    };
    fetchMessages();
  }, [processAndSetMessages]);
  // Filter messages based on search query
  const filteredMessages = useMemo(() => {
    if (!searchQuery) {
      return allMessagesFromServer;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return allMessagesFromServer.filter(message => {
      const titleMatch = message.title?.toLowerCase().includes(lowerCaseQuery);
      const contentMatch = message.turns.some(turn => turn.rawContent.toLowerCase().includes(lowerCaseQuery));
      return titleMatch || contentMatch;
    });
  }, [allMessagesFromServer, searchQuery]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredMessages.length / ITEMS_PER_PAGE)), [filteredMessages]);

  // Adjust currentPage if it becomes invalid after totalPages changes (e.g., due to deletion)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedMessages = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredMessages.slice(startIndex, endIndex);
  }, [filteredMessages, currentPage]);

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
      const chatKeys = keys.filter(key => key.startsWith('chat_'));
      const storedItems = await Promise.all(chatKeys.map(k => localforage.getItem(k)));
      const validMessagesAfterDelete = storedItems.filter(
          item => item && typeof item === 'object' && 'id' in item && 'last_updated' in item && 'turns' in item
      ) as ChatMessage[];
      
      processAndSetMessages(validMessagesAfterDelete); // This updates allMessagesFromServer, then filteredMessages recomputes

      // Calculate new page based on what the filtered list *will be* after state update
      const newFilteredAfterDelete = validMessagesAfterDelete.filter(message => {
        if (!searchQuery) return true;
        const lowerCaseQuery = searchQuery.toLowerCase();
        const titleMatch = message.title?.toLowerCase().includes(lowerCaseQuery);
        const contentMatch = message.turns.some(turn => turn.rawContent.toLowerCase().includes(lowerCaseQuery));
        return titleMatch || contentMatch;
      });

      const newTotalPagesCalc = Math.max(1, Math.ceil(newFilteredAfterDelete.length / ITEMS_PER_PAGE));
      let newCurrentPage = currentPage;

      if (newCurrentPage > newTotalPagesCalc) {
        newCurrentPage = newTotalPagesCalc;
      }
      
      const startIndex = (newCurrentPage - 1) * ITEMS_PER_PAGE;
      if (newFilteredAfterDelete.slice(startIndex, startIndex + ITEMS_PER_PAGE).length === 0 && newCurrentPage > 1) {
        newCurrentPage = newCurrentPage - 1;
      }
      setCurrentPage(newCurrentPage);
    } catch (e) { console.error("Error deleting message:", e); }
  }, [processAndSetMessages, currentPage, searchQuery]);

  const deleteAll = useCallback(async () => {
    try {
      const keys = await localforage.keys();
      const chatKeys = keys.filter(key => key.startsWith('chat_'));
      await Promise.all(chatKeys.map(k => localforage.removeItem(k)));
      setAllMessagesFromServer([]); // This will also empty filteredMessages
      if (onDeleteAll) onDeleteAll();
    } catch (e) { console.error("Error deleting all messages:", e); }
  }, [onDeleteAll]);

  useEffect(() => {
    window.deleteAllChats = deleteAll;
    return () => {
      if (window.deleteAllChats === deleteAll) delete window.deleteAllChats;
    };
  }, [deleteAll]);

  const handleNextPage = useCallback(() => setCurrentPage(p => Math.min(p + 1, totalPages)), [totalPages]);
  const handlePrevPage = useCallback(() => setCurrentPage(p => Math.max(p - 1, 1)), []);
  const rootComputedClassName = `flex flex-col w-full ${className || ''}`.trim();


  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Case: No messages at all and no search query
  if (allMessagesFromServer.length === 0 && !searchQuery) {
    return (
      <div className={rootComputedClassName}>
        <div className="p-1 border-b border-border">
          <Input
            type="text"
            placeholder="Search chat history..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-background text-foreground border-border placeholder:text-muted-foreground"
          />
        </div>
        <ScrollArea className="flex-1 w-full min-h-0">
          <div className="px-4 pb-4 pt-5 text-center text-foreground/70 h-full flex items-center justify-center">
            No chat history found.
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Case: Active search query yields no results (but there might be messages on the server)
  if (filteredMessages.length === 0 && searchQuery) {
    return (
      <div className={rootComputedClassName}>
        <div className="p-1 border-b border-border">
          <Input
            type="text"
            placeholder="Search chat history..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-background text-foreground border-border placeholder:text-muted-foreground"
          />
        </div>
        <ScrollArea className="flex-1 w-full min-h-0">
          <div className="px-4 pb-4 pt-5 text-center text-foreground/70 h-full flex items-center justify-center">
            No results found for "{searchQuery}".
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className={rootComputedClassName}>
       <div className="p-1 border-b border-border">
        <Input
          type="text"
          placeholder="Search chat history (titles & content)..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full bg-background text-foreground border-border placeholder:text-muted-foreground"
        />
      </div>     
      <ScrollArea
        className="flex-1 w-full min-h-0" // Message area: scrolls, takes available vertical space
      >
        <div className="px-4 pb-4"> {/* Content wrapper for messages */}
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
                      {new Date(message.last_updated).getHours().toString().padStart(2, '0')}:
                      {new Date(message.last_updated).getMinutes().toString().padStart(2, '0')}
                    </span>
                    <button className={`text-foreground text-lg font-semibold overflow-hidden px-4 py-2 text-left text-ellipsis whitespace-nowrap flex-grow hover:underline hover:underline-offset-4 hover:decoration-2 ${message.id === removeId ? 'line-through decoration-2' : ''}`} onClick={() => loadChat(message)}>
                      {message.title || 'Untitled Chat'}
                    </button>
                    <motion.div className={`shrink-0 transition-opacity duration-150 ${hoverId === message.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} whileHover={{ rotate: '15deg' }} onMouseEnter={() => setRemoveId(message.id)} onMouseLeave={() => setRemoveId(null)}>
                      <Button variant="ghost" size="sm" aria-label="Delete chat" className="rounded-full w-8 h-8" onClick={(e) => { e.stopPropagation(); deleteMessage(message.id); }}>
                        <FiTrash2 className="h-4 w-4 text-foreground" />
                      </Button>
                    </motion.div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </ScrollArea>

      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 p-2 border-t border-border">
          <Button onClick={handlePrevPage} disabled={currentPage === 1} variant="outline">Prev</Button>
          <span>Page {currentPage} of {totalPages}</span>
          <Button onClick={handleNextPage} disabled={currentPage === totalPages} variant="outline">Next</Button>
        </div>
      )}
    </div>
  );
};