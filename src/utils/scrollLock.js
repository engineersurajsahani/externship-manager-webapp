// Scroll lock utility to prevent body scrolling when modals are open
let scrollBarWidth = 0;

const getScrollBarWidth = () => {
  if (scrollBarWidth) return scrollBarWidth;
  
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll';
  outer.style.msOverflowStyle = 'scrollbar';
  document.body.appendChild(outer);

  const inner = document.createElement('div');
  outer.appendChild(inner);

  scrollBarWidth = outer.offsetWidth - inner.offsetWidth;
  outer.parentNode.removeChild(outer);
  
  return scrollBarWidth;
};

let isLocked = false;
let originalStyle = '';

export const lockScroll = () => {
  if (isLocked) return;
  
  const body = document.body;
  const scrollBarWidth = getScrollBarWidth();
  
  // Store original values
  originalStyle = body.getAttribute('style') || '';
  
  // Apply scroll lock
  body.style.overflow = 'hidden';
  body.style.paddingRight = `${scrollBarWidth}px`;
  
  isLocked = true;
};

export const unlockScroll = () => {
  if (!isLocked) return;
  
  const body = document.body;
  
  // Restore original values
  if (originalStyle) {
    body.setAttribute('style', originalStyle);
  } else {
    body.removeAttribute('style');
  }
  
  isLocked = false;
};

export const isScrollLocked = () => isLocked;