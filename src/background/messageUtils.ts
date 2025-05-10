import { toPng } from 'html-to-image';
import { MessageTurn } from '../sidePanel/ChatHistory'; // Adjust path if needed

// Helper function to generate a timestamp string
const getTimestamp = () => {
  return new Date().toJSON().slice(0, 19).replace('T', '_').replace(/:/g, '-');
  // Produces YYYY-MM-DD_HH-MM-SS
};

export const downloadText = (turns: MessageTurn[]) => {
  if (!turns || turns.length === 0) return;

  const text = turns.map(turn => {
    let turnText = `${turn.role}\n`;
    // Optionally include the web prefix for assistant turns if desired in the text export
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
  // Keep existing wrapper styles
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column'; // To maintain chat order in the image
  wrapper.style.paddingBottom = '1rem';
  // Adjust margin if needed based on new layout, -2rem might have been specific to Chakra layout
  // wrapper.style.marginRight = '-2rem'; // Consider removing or adjusting this
  wrapper.style.background = document.documentElement.style.getPropertyValue('--bg');
  // Ensure the wrapper itself takes up necessary width, maybe based on the first node?
  if (nodes[0]) {
      wrapper.style.width = `${nodes[0].offsetWidth}px`; // Set width based on message width
  }


  nodes.forEach(n => {
    const cloned = n.cloneNode(true);
    if (cloned instanceof HTMLElement) {
      cloned.style.marginTop = '1rem';
      // Ensure cloned messages don't exceed wrapper width if there were issues
      cloned.style.boxSizing = 'border-box'; // Include padding/border in width calculation
      wrapper.appendChild(cloned);
    } else {
      console.warn('Cloned node is not an HTMLElement:', cloned);
    }
  });

  // --- Updated Filter Function ---
  // Filter based on aria-label for copy and edit buttons
  function filter(node: Node): boolean {
    if (node instanceof Element) {
      const ariaLabel = node.getAttribute('aria-label');
      if (ariaLabel) {
        // List of aria-labels for buttons to exclude
        const labelsToExclude = [
          "Copy code",
          "Copied!",
          "Save edit",
          "Cancel edit"
          // Add any other button aria-labels you might want to exclude
        ];
        if (labelsToExclude.includes(ariaLabel)) {
          return false; // Exclude this button
        }
      }
      // You could add checks for other elements if needed
      // e.g., if (node.tagName === 'SCRIPT') return false;
    }
    return true; // Include the node by default
  }
  // --- End of Updated Filter ---

  document.body.appendChild(wrapper);

  toPng(wrapper, {
    filter, // Use the updated filter
    pixelRatio: 2, // Adjusted pixelRatio, 4 might be excessive and cause performance issues/large files
    style: {
        // Ensure styles applied directly to the wrapper for rendering are minimal
        // and don't conflict with its children's styles.
        margin: '0', // Reset margin for the snapshot if needed
        padding: wrapper.style.paddingBottom, // Keep necessary padding
        // flexGrow: 'unset' // This might not be needed anymore
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