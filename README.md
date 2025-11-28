# Penalty Manager - FLR Smart Contract Frontend

## Project Title
Penalty Manager — Frontend UI for the Penalties & Blocking Smart Contract (Flare Coston2)

## Contract Address
`0xFdD8F2C4a0e8A62F9dCFC4586491bDc50169b415`  
Explorer: https://coston2-explorer.flare.network/address/0xFdD8F2C4a0e8A62F9dCFC4586491bDc50169b415

## Description
This project is a lightweight React/Next (client) frontend that integrates with a deployed Penalties/Blocking smart contract on the Flare Coston2 test network. The UI provides tools for:

- Inspecting fines and penalty counts for addresses
- Paying owed fines (payable function)
- Issuing penalties to addresses (owner/admin)
- Clearing penalties for addresses (owner/admin)
- Managing contract parameters (fine amount, block threshold)
- Withdrawing contract balance (owner/admin)

It is designed to be a minimal but complete integration that uses `wagmi` + `viem` hooks for on-chain reads and writes and preserves wallet gating, loading indicators, and error handling.

## Features
- Read contract state:
  - `finePerPenalty` — view the fine amount per penalty (displayed in FLR/ETH units)
  - `getPenalties(address)` — view penalties for your connected account and any address you provide
  - `isBlocked(address)` — check whether an address is blocked
  - `blockThreshold` — view threshold at which addresses become blocked
  - `owner` — display contract owner address
- Transactions (writes):
  - `issuePenalty(address)` — owner-only action to increment penalties for an address
  - `payFine()` — payable function for an address to pay its total fines
  - `clearPenalties(address)` — owner-only action to clear penalties for an address
  - `setBlockThreshold(uint256)` — owner-only configuration
  - `setFineAmount(uint256)` — owner-only configuration (set in wei)
  - `withdraw()` — owner-only to withdraw contract balance
- UX-friendly:
  - Wallet gating — prompts user to connect wallet before interaction
  - Loading and pending indicators while transactions are in flight
  - Errors surfaced to the UI
  - Simple admin panel and address viewer for quick management

## How It Solves
### Problem
On-chain systems sometimes require governance or moderation tools to penalize misbehaving addresses, enforce bans/blocks, and collect fines to deter undesirable actions. Managing penalties manually via hard-to-use transactions makes administration cumbersome and error-prone.

### Solution
This frontend connects directly to the deployed Penalties contract and provides a simple interface for both end-users and contract administrators:

- **For Users**: They can view how many penalties they have, check whether they are blocked, and pay fines directly from the UI. Paying fines aggregates the per-penalty fine into a single payable call — simplifying user interaction and minimizing mistakes.
- **For Admins / Owner**: The owner can issue penalties to addresses, clear penalties, update configuration parameters (fine amount and block threshold), and withdraw collected funds via a single, clear UI.
- **Benefits**:
  - Reduces friction for common actions (paying fines, issuing penalties)
  - Lowers operational errors by offering an opinionated UI
  - Makes owner actions auditable (transaction hashes shown)
  - Facilitates faster response to misbehavior with owner controls

### Typical Use Cases
- Moderation systems that require on-chain enforcement (e.g., resource abuse penalties)
- Token / faucet management where repeated misuse results in fines
- Any on-chain service that wants a simple penalty/fine mechanism with owner controls

---

## Notes & Integration Tips
- The UI expects `wagmi` + `viem` to be configured in your app (connectors, provider, network).
- Contract interactions use the ABI exported from `lib/contract.ts`. Ensure that file matches the deployed contract ABI.
- `setFineAmount` expects `wei` (integer bigint). The UI provides a small helper to set ETH-like decimal input, but when calling programmatically ensure conversion to wei.
- All owner-only actions will revert if the connected wallet is not the contract owner.
- Transaction flow:
  1. User triggers an action (issue, pay, clear, set)
  2. Wallet prompts for signature
  3. UI displays pending state and shows transaction hash
  4. On confirmation, UI refetches relevant reads to refresh displayed state

---

## Files of Interest
- `lib/contract.ts` — contract address + ABI (used by hooks)
- `hooks/useContract.ts` — React hook that encapsulates reads, writes, and transaction state
- `components/sample.tsx` — sample UI demonstrating how to use the hook and interact with the contract

---

## Contribution & Extensibility
- Add event listening (e.g., `PenaltyIssued`, `PenaltyPaid`, `PenaltiesCleared`) to provide real-time UI updates.
- Add pagination / history for penalties and payments by indexing emitted events.
- Improve the fine amount setter to use `viem`'s `parseEther` for robust decimal parsing.
- Add role checks and richer admin UI (confirm modals, multi-sig support).

---

## Final
This README documents the project's purpose, how it connects to the deployed contract, and how the UI supports both end-users and administrators to manage penalties and fines on-chain.


