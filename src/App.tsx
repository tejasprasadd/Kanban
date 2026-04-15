import "./compiled.css";
import { SeedGate } from "@/components/SeedGate";
import { KanbanBoard } from "./components/KanbanBoard";

export function App() {
  return (
    <SeedGate>
      <KanbanBoard />
    </SeedGate>
  );
}

export default App;