import { AuthProvider } from './context/AuthContext';
import { PropuestaDraftProvider } from './context/PropuestaDraftContext';
import AppRouter from './routes/AppRouter';

function App() {
  return (
    <AuthProvider>
      <PropuestaDraftProvider>
        <AppRouter />
      </PropuestaDraftProvider>
    </AuthProvider>
  );
}

export default App;
