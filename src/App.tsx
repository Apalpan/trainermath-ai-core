import DeckShell from './components/deck/DeckShell';
import TrainerMathApp from './components/trainer/TrainerMathApp';

function App() {
  const isDeck = window.location.pathname.startsWith('/deck') || window.location.hash.startsWith('#/slide/');
  return isDeck ? <DeckShell /> : <TrainerMathApp />;
}

export default App;
