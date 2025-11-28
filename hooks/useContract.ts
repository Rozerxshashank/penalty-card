// hooks/useContract.ts
"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { formatEther } from "viem"
import { contractABI, contractAddress } from "@/lib/contract"

export interface PenaltyData {
  finesPerPenalty: string
  myPenalties: number
  viewedPenalties: number
  isBlocked: boolean
  blockThreshold: number
  owner: `0x${string}` | null
}

export interface ContractState {
  isLoading: boolean
  isPending: boolean
  isConfirming: boolean
  isConfirmed: boolean
  hash: `0x${string}` | undefined
  error: Error | null
}

export interface ContractActions {
  issuePenalty: (who: string) => Promise<void>
  payMyFine: () => Promise<void>
  clearPenalties: (who: string) => Promise<void>
  withdraw: () => Promise<void>
  setBlockThreshold: (newThreshold: number) => Promise<void>
  setFineAmount: (newFineWei: bigint) => Promise<void>
}

export const usePenaltyContract = () => {
  const { address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [isTxPending, setIsTxPending] = useState(false)
  const [viewAddress, setViewAddress] = useState<string | null>(null)

  // Read fine amount per penalty (wei)
  const { data: finePerPenalty } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "finePerPenalty",
  })

  // Read penalties for connected address
  const { data: myPenalties, refetch: refetchMyPenalties } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "getPenalties",
    args: [address as `0x${string}`],
    query: { enabled: !!address },
  })

  // Read penalties for a viewed address (optional)
  const { data: viewedPenalties, refetch: refetchViewedPenalties } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "getPenalties",
    args: [viewAddress as `0x${string}`],
    query: { enabled: !!viewAddress },
  })

  // Read block status for viewed address (or connected address)
  const { data: isBlocked } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "isBlocked",
    args: [ (viewAddress || address) as `0x${string}` ],
    query: { enabled: !!(viewAddress || address) },
  })

  const { data: blockThreshold } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "blockThreshold",
  })

  const { data: owner } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "owner",
  })

  // NOTE: do not rely on a non-existent `isLoading` prop from useWriteContract types.
  const { writeContractAsync, data: hash, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    if (isConfirmed) {
      refetchMyPenalties()
      refetchViewedPenalties()
    }
  }, [isConfirmed, refetchMyPenalties, refetchViewedPenalties])

  const issuePenalty = async (who: string) => {
    if (!who) return
    try {
      setIsLoading(true)
      setIsTxPending(true)
      await writeContractAsync({
        address: contractAddress,
        abi: contractABI,
        functionName: "issuePenalty",
        args: [who as `0x${string}`],
      })
    } catch (err) {
      console.error("Error issuing penalty:", err)
      throw err
    } finally {
      setIsLoading(false)
      setIsTxPending(false)
    }
  }

  const payMyFine = async () => {
    if (!address) return
    try {
      setIsLoading(true)
      setIsTxPending(true)
      const count = myPenalties ? (myPenalties as bigint) : BigInt(0)
      const fine = finePerPenalty ? (finePerPenalty as bigint) : BigInt(0)
      const total = fine * count
      if (total === BigInt(0)) return
      await writeContractAsync({
        address: contractAddress,
        abi: contractABI,
        functionName: "payFine",
        args: [],
        value: total,
      })
    } catch (err) {
      console.error("Error paying fine:", err)
      throw err
    } finally {
      setIsLoading(false)
      setIsTxPending(false)
    }
  }

  const clearPenaltiesFor = async (who: string) => {
    if (!who) return
    try {
      setIsLoading(true)
      setIsTxPending(true)
      await writeContractAsync({
        address: contractAddress,
        abi: contractABI,
        functionName: "clearPenalties",
        args: [who as `0x${string}`],
      })
    } catch (err) {
      console.error("Error clearing penalties:", err)
      throw err
    } finally {
      setIsLoading(false)
      setIsTxPending(false)
    }
  }

  const withdraw = async () => {
    try {
      setIsLoading(true)
      setIsTxPending(true)
      await writeContractAsync({
        address: contractAddress,
        abi: contractABI,
        functionName: "withdraw",
        args: [],
      })
    } catch (err) {
      console.error("Error withdrawing:", err)
      throw err
    } finally {
      setIsLoading(false)
      setIsTxPending(false)
    }
  }

  const setBlockThreshold = async (newThreshold: number) => {
    try {
      setIsLoading(true)
      setIsTxPending(true)
      await writeContractAsync({
        address: contractAddress,
        abi: contractABI,
        functionName: "setBlockThreshold",
        args: [BigInt(newThreshold)],
      })
    } catch (err) {
      console.error("Error setting block threshold:", err)
      throw err
    } finally {
      setIsLoading(false)
      setIsTxPending(false)
    }
  }

  const setFineAmount = async (newFineWei: bigint) => {
    try {
      setIsLoading(true)
      setIsTxPending(true)
      await writeContractAsync({
        address: contractAddress,
        abi: contractABI,
        functionName: "setFineAmount",
        args: [newFineWei],
      })
    } catch (err) {
      console.error("Error setting fine amount:", err)
      throw err
    } finally {
      setIsLoading(false)
      setIsTxPending(false)
    }
  }

  const data: PenaltyData = {
    finesPerPenalty: finePerPenalty ? formatEther(finePerPenalty as bigint) : "0",
    myPenalties: myPenalties ? Number(myPenalties as bigint) : 0,
    viewedPenalties: viewedPenalties ? Number(viewedPenalties as bigint) : 0,
    isBlocked: Boolean(isBlocked),
    blockThreshold: blockThreshold ? Number(blockThreshold as bigint) : 0,
    owner: owner ? (owner as `0x${string}`) : null,
  }

  const actions: ContractActions = {
    issuePenalty,
    payMyFine,
    clearPenalties: clearPenaltiesFor,
    withdraw,
    setBlockThreshold,
    setFineAmount,
  }

  const state: ContractState = {
    isLoading: isLoading || isTxPending || Boolean(isConfirming),
    isPending: Boolean(isTxPending),
    isConfirming,
    isConfirmed,
    hash,
    error,
  }

  return {
    data,
    actions,
    state,
    view: {
      viewAddress,
      setViewAddress,
      refetchViewedPenalties,
      refetchMyPenalties,
    },
  }
}

export default usePenaltyContract
