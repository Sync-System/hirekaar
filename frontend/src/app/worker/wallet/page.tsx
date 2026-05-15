import { WalletPanel } from "@/app/worker/wallet/wallet-panel";

export default function WorkerWalletPage() {
  return (
    <div className="hk-page-narrow">
      <p className="hk-eyebrow">Worker money</p>
      <h1 className="hk-title">Wallet</h1>
      <p className="hk-copy">
        Top up to stay solvent when bids are accepted (10% platform fee debits your wallet). Spend on featured listing
        boost to appear on the homepage carousel.
      </p>
      <div className="mt-8">
        <WalletPanel />
      </div>
    </div>
  );
}
