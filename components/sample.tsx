// components/sample.tsx
"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import usePenaltyContract from "@/hooks/useContract"
import { isAddress } from "viem"

const SampleIntegration = () => {
  const { isConnected, address } = useAccount()
  const [targetAddress, setTargetAddress] = useState("")
  const [setThresholdValue, setSetThresholdValue] = useState("")
  const [setFineValueEth, setSetFineValueEth] = useState("")

  const { data, actions, state, view } = usePenaltyContract()

  const handleView = () => {
    if (!targetAddress || !isAddress(targetAddress)) return
    view.setViewAddress(targetAddress)
    view.refetchViewedPenalties()
  }

  const handleIssue = async () => {
    if (!targetAddress || !isAddress(targetAddress)) return
    try {
      await actions.issuePenalty(targetAddress)
      view.refetchViewedPenalties()
    } catch (err) {
      console.error(err)
    }
  }

  const handlePayMyFine = async () => {
    try {
      await actions.payMyFine()
    } catch (err) {
      console.error(err)
    }
  }

  const handleClear = async () => {
    if (!targetAddress || !isAddress(targetAddress)) return
    try {
      await actions.clearPenalties(targetAddress)
      view.refetchViewedPenalties()
      view.refetchMyPenalties()
    } catch (err) {
      console.error(err)
    }
  }

  const handleWithdraw = async () => {
    try {
      await actions.withdraw()
    } catch (err) {
      console.error(err)
    }
  }

  const handleSetThreshold = async () => {
    const n = Number(setThresholdValue)
    if (Number.isNaN(n)) return
    try {
      await actions.setBlockThreshold(n)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSetFine = async () => {
    // expecting user to input ETH value (e.g., 0.01)
    try {
      const parts = setFineValueEth.trim()
      if (!parts) return
      // Convert ETH string to wei bigint without external calls
      // Simple conversion: parse token decimals (up to 18)
      const [intPart, fracPart = ""] = parts.split(".")
      const frac = (fracPart + "000000000000000000").slice(0, 18)
      const weiStr = intPart + frac
      const wei = BigInt(weiStr)
      await actions.setFineAmount(wei)
    } catch (err) {
      console.error(err)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <h2 className="text-2xl font-bold text-foreground mb-3">Penalty Contract</h2>
          <p className="text-muted-foreground">Please connect your wallet to interact with the contract.</p>
        </div>
      </div>
    )
  }

  const viewed = view.viewAddress || address || ""
  const canIssue = view.viewAddress && isAddress(view.viewAddress)
  const canClear = canIssue
  const canSetThreshold = setThresholdValue !== ""
  const canSetFine = setFineValueEth !== ""

  // compute total payable for connected user
  const myCount = data.myPenalties
  // data.finesPerPenalty is in ETH string from formatEther
  const payableAmountStr = (() => {
    try {
      const fine = Number(data.finesPerPenalty || "0")
      const total = fine * myCount
      return total.toString()
    } catch {
      return "0"
    }
  })()

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Penalty Contract</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage penalties, fines and block thresholds</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Fines per Penalty</p>
            <p className="text-2xl font-semibold text-foreground">{data.finesPerPenalty} FLR</p>
            <p className="text-xs text-muted-foreground mt-1">Block Threshold: {data.blockThreshold}</p>
            <p className="text-xs text-muted-foreground mt-1">Contract Owner: {data.owner ?? "—"}</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2">Your Penalties</p>
            <p className="text-2xl font-semibold text-foreground">{data.myPenalties}</p>
            <p className="text-sm text-muted-foreground mt-2">Payable: {payableAmountStr} FLR</p>
            <p className={`text-sm mt-1 ${data.isBlocked ? "text-destructive" : "text-green-500"}`}>{data.isBlocked ? "Blocked" : "Not Blocked"}</p>
            <div className="mt-3 space-y-2">
              <button
                onClick={handlePayMyFine}
                disabled={state.isLoading || state.isPending || data.myPenalties === 0}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
              >
                {state.isLoading || state.isPending ? "Processing..." : `Pay My Fine (${payableAmountStr} FLR)`}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-6 bg-card border border-border rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">View / Manage Address</p>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="0x..."
              value={targetAddress}
              onChange={(e) => setTargetAddress(e.target.value)}
              className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none"
            />
            <button onClick={handleView} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">View</button>
          </div>

          {view.viewAddress && (
            <>
              <p className="text-xs text-muted-foreground mb-1">Address: {view.viewAddress}</p>
              <p className="text-sm text-foreground mb-2">Penalties: {data.viewedPenalties}</p>
              <p className={`text-sm mb-3 ${data.isBlocked ? "text-destructive" : "text-green-500"}`}>{data.isBlocked ? "Blocked" : "Not Blocked"}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <button
                  onClick={handleIssue}
                  disabled={!canIssue || state.isLoading || state.isPending}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
                >
                  Issue Penalty
                </button>
                <button
                  onClick={handleClear}
                  disabled={!canClear || state.isLoading || state.isPending}
                  className="px-3 py-2 bg-destructive text-destructive-foreground rounded-lg disabled:opacity-50"
                >
                  Clear Penalties
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={state.isLoading || state.isPending}
                  className="px-3 py-2 bg-foreground text-background rounded-lg disabled:opacity-50"
                >
                  Withdraw (owner)
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mb-6 bg-card border border-border rounded-lg p-4">
          <p className="text-sm font-medium text-foreground mb-2">Admin Controls (owner)</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="number"
              placeholder="Block threshold (count)"
              value={setThresholdValue}
              onChange={(e) => setSetThresholdValue(e.target.value)}
              className="px-3 py-2 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none"
            />
            <button
              onClick={handleSetThreshold}
              disabled={!canSetThreshold || state.isLoading || state.isPending}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
            >
              Set Threshold
            </button>
            <div className="col-span-3 md:col-span-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Fine per penalty (ETH) e.g. 0.01"
                  value={setFineValueEth}
                  onChange={(e) => setSetFineValueEth(e.target.value)}
                  className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none"
                />
                <button
                  onClick={handleSetFine}
                  disabled={!canSetFine || state.isLoading || state.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
                >
                  Set Fine
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status / transaction */}
        {state.hash && (
          <div className="mt-4 p-4 bg-card border border-border rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Transaction Hash</p>
            <p className="text-sm font-mono text-foreground break-all mb-3">{state.hash}</p>
            {state.isConfirming && <p className="text-sm text-primary">Waiting for confirmation...</p>}
            {state.isConfirmed && <p className="text-sm text-green-500">Transaction confirmed!</p>}
          </div>
        )}

        {state.error && (
          <div className="mt-4 p-4 bg-card border border-destructive rounded-lg">
            <p className="text-sm text-destructive-foreground">Error: {state.error.message}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SampleIntegration
