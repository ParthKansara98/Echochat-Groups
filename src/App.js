import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import "./App.css";
import ChatPage from "./components/ChatPage";
import Home from "./components/Home";
import AddGroup from './components/AddGroup';
import Admin from './components/AdminPanel';
import { SnackbarProvider } from 'notistack';

function App() {
  // Apply saved theme on initial load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);
  
  return (
    <SnackbarProvider maxSnack={3}>
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat/:groupId" element={<ChatPage />} />
            <Route path="/add-group" element={<AddGroup />} />
            <Route path="/admin/:groupid" element={<Admin />} />
          </Routes>
        </div>
      </Router>
    </SnackbarProvider>
  );
}

export default App;
