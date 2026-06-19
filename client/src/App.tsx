import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Home } from './pages/Home';
import { Room } from './pages/Room';
import { Test } from './pages/Test';
import { Result } from './pages/Result';
import { Analysis } from './pages/Analysis';
import { Chat } from './pages/Chat';

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 z-50 w-9 h-9 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:scale-110 transition-transform"
      title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
    >
      {theme === 'light' ? (
        <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
      ) : (
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      )}
    </button>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div style={{ position: 'fixed', inset: 0, overflow: 'auto' }} className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
          <ThemeToggle />
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
