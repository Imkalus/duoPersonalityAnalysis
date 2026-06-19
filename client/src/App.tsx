import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Home } from './pages/Home';
import { Room } from './pages/Room';
import { Test } from './pages/Test';
import { Result } from './pages/Result';
import { Analysis } from './pages/Analysis';
import { Chat } from './pages/Chat';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:roomId" element={<Room />} />
            <Route path="/room/:roomId/test" element={<Test />} />
            <Route path="/room/:roomId/result" element={<Result />} />
            <Route path="/room/:roomId/analysis" element={<Analysis />} />
            <Route path="/room/:roomId/chat" element={<Chat />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}
