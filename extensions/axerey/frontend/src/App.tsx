import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Container } from "reactstrap";
import KanbanBoard from "./components/KanbanBoard";
import Header from "./components/Header";
import ReasoningTools from "./pages/ReasoningTools";
import Profile from "./pages/Profile";
import MemoryDashboard from "./components/MemoryDashboard";
import SystemHealth from "./components/SystemHealth";
import OllamaChat from "./components/OllamaChat";
import PersonaManagement from "./components/PersonaManagement";
import SetupGuide from "./components/SetupGuide";
import "./App.scss";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <Header />
          <Container fluid className="main-content">
            <Routes>
              <Route path="/" element={<KanbanBoard />} />
              <Route path="/reasoning" element={<ReasoningTools />} />
              <Route path="/memories" element={<MemoryDashboard />} />
              <Route path="/system" element={<SystemHealth />} />
              <Route path="/ollama" element={<OllamaChat />} />
              <Route path="/personas" element={<PersonaManagement />} />
              <Route path="/setup" element={<SetupGuide />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </Container>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
