import '../content/index.css';
import type { ComponentPropsWithoutRef, ReactElement, CSSProperties, FC } from 'react';
import { Children, ClassAttributes, HTMLAttributes, ReactNode, useState } from 'react';
import Markdown from 'react-markdown';
import { FiCopy, FiCheck, FiX } from 'react-icons/fi';
import AutosizeTextarea from 'react-textarea-autosize';

import { Button } from "@/components/ui/button";
import { cn } from "@/src/background/util";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import remarkGfm from 'remark-gfm';
import remarkSupersub from 'remark-supersub';
import remarkMath from 'remark-math';

import { useConfig } from './ConfigContext';
import { MessageTurn } from './ChatHistory';

type ListProps = {
  children?: ReactNode;
  ordered?: boolean;
} & HTMLAttributes<HTMLUListElement | HTMLOListElement>;

const Ul = ({ children, ...rest }: ListProps) => (
  <ul style={{
    paddingLeft: '2rem',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    listStyleType: 'disc'
  }} {...rest}>{children}</ul>
);

const Ol = ({ children, ...rest }: ListProps) => (
  <ol style={{
    paddingLeft: '2rem',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    listStyleType: 'decimal'
  }} {...rest}>{children}</ol>
);

type ParagraphProps = { children?: ReactNode } & HTMLAttributes<HTMLParagraphElement>;
const P = ({ children, ...rest }: ParagraphProps) => (
  <p style={{
    paddingTop: 0,
    paddingBottom: '0.2rem',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    whiteSpace: 'pre-wrap'
  }} {...rest}>{children}</p>
);
type CustomPreProps = ComponentPropsWithoutRef<'pre'>;

const Pre = (props: CustomPreProps) => {
  const { children, className: preClassName, ...restPreProps } = props;

  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const codeElement = Children.only(children) as ReactElement<any> | null;
  let codeString = '';
  if (codeElement?.props?.children) {
    if (Array.isArray(codeElement.props.children)) {
      codeString = codeElement.props.children.map((child: React.ReactNode) => typeof child === 'string' ? child : '').join('');
    } else {
      codeString = String(codeElement.props.children);
    }
    codeString = codeString.trim(); 
  }
  const languageClass = codeElement?.props?.className || ''; // e.g., "language-js"

  const copyToClipboard = () => {
    if (codeString) {
      setCopied(true);
      navigator.clipboard.writeText(codeString);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  const preElementStyles: CSSProperties = {
    overflow: 'auto',
    padding: '1rem', // Consistent padding for all code blocks
    margin: 0,       // Margin is handled by the outer div
    background: 'var(--markdown-pre-background)',
    color: 'var(--markdown-pre-foreground)', 
    borderRadius: '8px',
    maxWidth: '100%'
  };

  return (
    <div
      className="relative my-4" // Margin for the entire code block
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <pre
        style={preElementStyles}
        className={preClassName} // Pass through any className for the <pre> itself
        {...restPreProps}       // Pass through other <pre> props
        
      >
      {children}
    </pre>
      {codeString && ( 
          (<Button
            variant="ghost"
            size="sm"
            aria-label={copied ? "Copied!" : "Copy code"}
            title={copied ? "Copied!" : "Copy code"}
            className={cn(
              "absolute right-2 top-2 h-8 w-8 p-0", // Ensure padding doesn't make it too big
              "bg-background text-foreground hover:bg-accent hover:text-accent-foreground", // Styles from original IconButton
              "transition-opacity duration-200",
              (hovered || copied) ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
            onClick={copyToClipboard}
          >
            {copied ? <FiCheck className="h-4 w-4" /> : <FiCopy className="h-4 w-4" />}
          </Button>)
          )}
    </div>
  );
    };

type CustomCodeProps = ComponentPropsWithoutRef<'code'> & {
  inline?: boolean;
};

const Code = (props: CustomCodeProps) => {
  const { children, className, inline, ...restCodeProps } = props;

  if (inline) {
    return (
      <code
        style={{
          color: 'var(--markdown-inline-code-foreground, var(--foreground))', // Use specific inline var
          background: 'var(--markdown-code-background, var(--muted))',
          padding: '0.2rem 0.4rem',
          borderRadius: '4px'
        }}
        className={className} // Pass through className for syntax highlighting themes
        {...restCodeProps}
      >
        {children}
      </code>
    );
  }

        
return (
<code className={className} {...restCodeProps}>
{children}
</code>
);
};

type AnchorProps = { children?: ReactNode; href?: string } & HTMLAttributes<HTMLAnchorElement>;
const A = ({ children, href, ...rest }: AnchorProps) => (
  <a href={href}
    style={{
      color: 'var(--markdown-link, var(--primary))', 
      textDecoration: 'underline',
      padding: '2px 7px',
      borderRadius: '6px' 
    }}
    target="_blank"
    rel="noopener noreferrer"
    {...rest}
  >
    {children}
  </a>
);

type HeadingProps = { children?: ReactNode } & HTMLAttributes<HTMLHeadingElement>;
const H1 = ({ children, ...rest }: HeadingProps) => (
  <h1 style={{
    fontSize: '1.5rem', // text-2xl
    fontWeight: 800,    // font-extrabold
    margin: '1rem 0 1rem', // my-4
    borderBottom: '2px solid var(--markdown-h1, var(--foreground))',
    paddingBottom: '0.5rem', // pb-2
    color: 'var(--markdown-h1, var(--foreground))'
  }} {...rest}>{children}</h1>
);

const H2 = ({ children, ...rest }: HeadingProps) => (
  <h2 style={{
    fontSize: '1.25rem', // text-xl
    fontWeight: 700,     // font-bold
    margin: '1rem 0 0.75rem', // mt-4 mb-3
    borderBottom: '1px solid var(--markdown-h2, var(--foreground))',
    paddingBottom: '0.4rem', // ~pb-1.5
    color: 'var(--markdown-h2, var(--foreground))'
  }} {...rest}>{children}</h2>
);

const H3 = ({ children, ...rest }: HeadingProps) => (
  <h3 style={{
    fontSize: '1.1rem',
    fontWeight: 600,
    margin: '0.75rem 0 0.5rem',
    borderBottom: '1px dashed var(--markdown-h3, var(--foreground))',
    paddingBottom: '0.3rem', // ~pb-1
    color: 'var(--markdown-h3, var(--foreground))'
  }} {...rest}>{children}</h3>
);

type StrongProps = { children?: ReactNode } & HTMLAttributes<HTMLElement>;
const Strong = ({ children, ...rest }: StrongProps) => (
  <strong style={{
    color: 'var(--markdown-strong, var(--foreground))', // Assuming --bold (if a color) maps to --foreground or a specific theme color
    fontWeight: 700, // font-bold
    fontFamily: 'Poppins, sans-serif'
  }} {...rest}>{children}</strong>
);

type EmProps = { children?: ReactNode } & HTMLAttributes<HTMLElement>;
const Em = ({ children, ...rest }: EmProps) => (
  <em style={{
    color: 'var(--markdown-em, var(--foreground))', // Assuming --italic (if a color) maps to --foreground or a specific theme color
    fontStyle: 'italic'
  }} {...rest}>{children}</em>
);

type TableProps = { children?: ReactNode } & HTMLAttributes<HTMLTableElement>;
const Table = ({ children, ...rest }: TableProps) => (
  <table style={{
    border: `2px solid var(--markdown-table-border, var(--foreground))`,
    borderCollapse: 'collapse',
    width: '100%',
    margin: '1rem 0' // my-4
  }} {...rest}>{children}</table>
);

type THeadProps = { children?: ReactNode } & HTMLAttributes<HTMLTableSectionElement>;
const THead = ({ children, ...rest }: THeadProps) => (
  <thead style={{
    borderBottom: `2px solid var(--markdown-table-border, var(--foreground))`
  }} {...rest}>{children}</thead>
);

type TBodyProps = { children?: ReactNode } & HTMLAttributes<HTMLTableSectionElement>;
const TBody = ({ children, ...rest }: TBodyProps) => (
  <tbody {...rest}>{children}</tbody>
);

type TrProps = { children?: ReactNode } & HTMLAttributes<HTMLTableRowElement>;
const Tr = (props: TrProps) => <tr {...props} />;

type ThProps = { children?: ReactNode } & HTMLAttributes<HTMLTableCellElement>;
const Th = ({ children, ...rest }: ThProps) => (
  <th style={{
    padding: '0.5rem',
    border: `1px solid var(--markdown-table-border, var(--foreground))`,
    fontWeight: 700 // font-bold
  }} {...rest}>{children}</th>
);

type TdProps = { children?: ReactNode } & HTMLAttributes<HTMLTableCellElement>;
const Td = ({ children, ...rest }: TdProps) => (
  <td style={{
    padding: '0.5rem',
    border: `1px solid var(--markdown-table-border, var(--foreground))`
  }} {...rest}>{children}</td>
);

type BlockquoteProps = { children?: ReactNode } & HTMLAttributes<HTMLElement>;
const Blockquote = ({ children, ...rest }: BlockquoteProps) => (
  <blockquote
    style={{
      borderLeft: '4px solid var(--markdown-h2, var(--foreground))',
      margin: '1em 0', // my-4 (approx)
      padding: '0.5em 1em',
      background: 'rgba(0,0,0,0.03)', // e.g. bg-black/5 dark:bg-white/5 or bg-muted/30
      color: 'var(--markdown-h2, var(--foreground))'
    }}
    {...rest}
  >
    {children}
  </blockquote>
);

// Thinking block
const ThinkingBlock = ({ content }: { content: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "mb-1", 
              "border-foreground text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {isOpen ? 'Hide Thoughts' : 'Show Thoughts'}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div
            className={cn(
              "p-3 rounded-md border border-dashed",
              "bg-muted",
              "border-muted-foreground",
              "text-muted-foreground" 
            )}
          >
            <div className="markdown-body">
              <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                  ...markdownComponents,
                  h1: H1,
                  h2: H2,
                  h3: H3,
                }}>{content}</Markdown>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// Markdown components mapping
const markdownComponents = {
  ul: Ul,
  ol: Ol,
  p: P,
  pre: Pre,
  code: Code,
  a: A,
  strong: Strong,
  em: Em,
  h1: H1,
  h2: H2,
  h3: H3,
  table: Table,
  thead: THead,
  tbody: TBody,
  tr: Tr,
  th: Th,
  td: Td,
  blockquote: Blockquote,
};

interface MessageProps {
  turn: MessageTurn;
  index: number;
  isEditing: boolean;
  editText: string;
  onStartEdit: (index: number, currentContent: string) => void;
  onSetEditText: (text: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

export const EditableMessage: FC<MessageProps> = ({
  turn, index, isEditing, editText, onStartEdit, onSetEditText, onSaveEdit, onCancelEdit
}) => {
  const { config } = useConfig();
  const contentToRender = turn.rawContent || '';
  const parts = contentToRender.split(/(<think>[\s\S]*?<\/think>)/g).filter(part => part && part.trim() !== '');
  const thinkRegex = /<think>([\s\S]*?)<\/think>/;

  return (
    <div
      className={cn(
        "border rounded-2xl text-base font-semibold", // Chakra: border, borderRadius={16}, fontSize="md", fontWeight={600}
        "w-[calc(100%-2rem)] mx-1 my-2", // Adjusted width, ml/mr/my (Chakra uses different spacing scale)
        "pb-1 pl-4 pr-4 pt-1", 
        "shadow-lg text-left relative",
        turn.role === 'assistant' ? 'bg-accent border-accent-foreground' : 'bg-background border-foreground', // Chakra: background, borderColor
        config?.paperTexture ? 'chat-message-bubble' : '',
        'chatMessage', isEditing ? 'editing' : '' 
      )}
      onDoubleClick={() => {
        if (!isEditing) {
          onStartEdit(index, turn.rawContent);
        }
      }}
      title={"Double-click to edit"}
    >
      {isEditing ? (
        <div className="flex flex-col space-y-2 items-stretch w-full p-1">
          <AutosizeTextarea
            value={editText}
            onChange={(e) => onSetEditText(e.target.value)}
            placeholder="Edit your message..."
            className={cn("autosize-textarea",
              "flex w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "text-foreground",
              "border-input",
              "border-foreground hover:border-primary focus-visible:border-primary focus-visible:ring-0",
              "min-h-[60px]"
            )}
            minRows={3}
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <Button
              size="sm"
              onClick={onSaveEdit}
              title="Save changes"
            >
              <FiCheck className="h-4 w-4 mr-1" /> Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive hover:text-destructive-foreground hover:bg-destructive"
              onClick={onCancelEdit}
              title="Discard changes"
            >
              <FiX className="h-4 w-4 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="message-markdown markdown-body relative z-[1] text-foreground"> {/* ADDED markdown-body class */}
          {turn.role === 'assistant' && turn.webDisplayContent && (
            <div className="message-prefix">
              <Markdown remarkPlugins={[[remarkGfm, { singleTilde: false }], remarkMath, remarkSupersub]} components={markdownComponents}>
                {`**From the Internet**\n${turn.webDisplayContent}\n\n---\n\n`}
              </Markdown>
            </div>
          )}
          {parts.map((part, partIndex) => {
            const match = part.match(thinkRegex);
            if (match && match[1]) {
              return <ThinkingBlock key={`think_${partIndex}`} content={match[1]} />;
            } else {
              return (
                <div key={`content_${partIndex}`} className="message-content">
                <Markdown
                  remarkPlugins={[[remarkGfm, { singleTilde: false }], remarkMath, remarkSupersub]}
                  components={markdownComponents}
                >{part}</Markdown>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
};