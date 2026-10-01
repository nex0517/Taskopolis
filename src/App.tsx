import { GRID_SIZE } from './game/config';
import './App.css';

function App() {
  return (
    <main className="app">
      <h1>Taskopolis</h1>
      <p>Complete real tasks. Build a city.</p>
      <p className="app-hint">
        Your city will grow on a {GRID_SIZE}×{GRID_SIZE} grid — coming in a
        later milestone.
      </p>
    </main>
  );
}

export default App;
