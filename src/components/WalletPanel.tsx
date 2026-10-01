import type { Wallet } from '../game/types';
import { CATEGORIES } from '../game/types';
import './WalletPanel.css';

interface WalletPanelProps {
  wallet: Wallet;
}

function WalletPanel({ wallet }: WalletPanelProps) {
  return (
    <section className="wallet" aria-label="Wallet">
      <h2>Wallet</h2>
      <ul className="wallet-list">
        {CATEGORIES.map((category) => (
          <li key={category}>
            <span>{category}</span>
            <strong>{wallet[category]}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default WalletPanel;
