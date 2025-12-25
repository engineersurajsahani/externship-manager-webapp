import { createPortal } from 'react-dom';

const Portal = ({ children, target = document.body }) => {
  return createPortal(children, target);
};

export default Portal;