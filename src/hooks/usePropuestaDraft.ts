import { useContext } from 'react';
import PropuestaDraftContext from '../context/PropuestaDraftContext';

const usePropuestaDraft = () => {
  const context = useContext(PropuestaDraftContext);
  if (!context) {
    throw new Error('usePropuestaDraft must be used within a PropuestaDraftProvider');
  }
  return context;
};

export default usePropuestaDraft;
