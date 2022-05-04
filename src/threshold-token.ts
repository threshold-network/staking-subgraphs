import { Address, BigInt } from "@graphprotocol/graph-ts"
import {
  DelegateChanged,
  DelegateVotesChanged,
} from "../generated/ThresholdToken/ThresholdToken"
import { StakeDelegation, Account } from "../generated/schema"
import { getOrCreateTokenholderDelegation, getStakeDelegationId } from "./utils"

export function handleDelegateChanged(event: DelegateChanged): void {
  const delegatee = event.params.toDelegate
  const delegator = event.params.delegator

  let delegation = getOrCreateTokenholderDelegation(delegatee)

  let account = Account.load(delegator.toHexString())
  if (!account) {
    account = new Account(delegator.toHexString())
  }

  account.delegatee = delegation.id
  account.save()

  delegation.liquidWeight = BigInt.zero()
  delegation.totalWeight = delegation.liquidWeight.plus(
    getTotalWeightOfStakeDelegation(delegatee)
  )
  delegation.save()
}

export function handleDelegateVotesChanged(event: DelegateVotesChanged): void {
  let delegatee = event.params.delegate
  let delegation = getOrCreateTokenholderDelegation(delegatee)

  delegation.liquidWeight = event.params.newBalance
  delegation.totalWeight = delegation.liquidWeight.plus(
    getTotalWeightOfStakeDelegation(delegatee)
  )
  delegation.save()
}

function getTotalWeightOfStakeDelegation(delegate: Address): BigInt {
  const stakeDelegation = StakeDelegation.load(getStakeDelegationId(delegate))

  return stakeDelegation ? stakeDelegation.totalWeight : BigInt.zero()
}
