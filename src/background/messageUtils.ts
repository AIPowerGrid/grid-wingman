import { toPng } from 'html-to-image';
import { MessageTurn } from '../sidePanel/ChatHistory'; // Adjust path if needed

const getTimestamp = () => {
  return new Date().toJSON().slice(0, 19).replace('T', '_').replace(/:/g, '-');
};

export const downloadText = (turns: MessageTurn[]) => {
  if (!turns || turns.length === 0) return;

  const text = turns.map(turn => {
    let turnText = `${turn.role}\n`;
    if (turn.role === 'assistant' && turn.webDisplayContent) {
        turnText += `**From the Internet**\n${turn.webDisplayContent}\n\n---\n\n`;
    }
    turnText += turn.rawContent;
    return turnText;
}).join('\n\n');

  const element = document.createElement('a');

  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
  const filename = `chat_${getTimestamp()}.txt`;

  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
};

export const downloadJson = (turns: MessageTurn[]) => {
  if (!turns || turns.length === 0) return;

  const text = JSON.stringify(turns, null, 2);

  const element = document.createElement('a');

  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
  const filename = `chat_${getTimestamp()}.json`;

  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
};


export const downloadImage = (turns: MessageTurn[]) => {
  if (!turns || turns.length === 0) return;

  const nodes = document.querySelectorAll<HTMLElement>('.chatMessage');

  if (!nodes || nodes.length === 0) {
    console.warn('No chat messages found to generate image.');
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column'; // To maintain chat order in the image
  wrapper.style.paddingBottom = '1rem';
  wrapper.style.background = document.documentElement.style.getPropertyValue('--bg');
  if (nodes[0]) {
      wrapper.style.width = `${nodes[0].offsetWidth}px`; // Set width based on message width
  }


  nodes.forEach(n => {
    const cloned = n.cloneNode(true);
    if (cloned instanceof HTMLElement) {
      cloned.style.marginTop = '1rem';
      cloned.style.boxSizing = 'border-box'; // Include padding/border in width calculation
      wrapper.appendChild(cloned);
    } else {
      console.warn('Cloned node is not an HTMLElement:', cloned);
    }
  });

  function filter(node: Node): boolean {
    if (node instanceof Element) {
      const ariaLabel = node.getAttribute('aria-label');
      if (ariaLabel) {
        const labelsToExclude = [
          "Copy code",
          "Copied!",
          "Save edit",
          "Cancel edit"
        ];
        if (labelsToExclude.includes(ariaLabel)) {
          return false; // Exclude this button
        }
      }
    }
    return true; // Include the node by default
  }

  document.body.appendChild(wrapper);

  toPng(wrapper, {
    filter, // Use the updated filter
    pixelRatio: 2, // Adjusted pixelRatio, 4 might be excessive and cause performance issues/large files
    style: {
        margin: '0', // Reset margin for the snapshot if needed
        padding: wrapper.style.paddingBottom, // Keep necessary padding
    },
    backgroundColor: document.documentElement.style.getPropertyValue('--bg') || '#ffffff' // Provide fallback bg
  })
    .then(dataUrl => {
      const element = document.createElement('a');
      element.setAttribute('href', dataUrl);
      const filename = `chat_${getTimestamp()}.png`;
      element.setAttribute('download', filename);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    })
    .catch(error => {
      console.error('Oops, something went wrong generating the image!', error);
    })
    .finally(() => {
      if (document.body.contains(wrapper)) {
        document.body.removeChild(wrapper);
      }
    });
}