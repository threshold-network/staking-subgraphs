import { Address, BigInt } from "@graphprotocol/graph-ts"
import {
  StakeDelegation,
  TokenholderDelegation,
  DAOMetric,
} from "../../generated/schema"

const STAKE_DELEGATION_ID_PREFIX = "stake-delegation-"
const TOKEN_HOLDER_DELEGATION_ID_PREFIX = "tokenholder-delegation-"
const DAO_METRICS_ID = "dao-metrics"

export function getStakeDelegationId(delegate: Address): string {
  return `${STAKE_DELEGATION_ID_PREFIX}${delegate.toHexString()}`
}

export function getTokenholderDelegationId(delegate: Address): string {
  return `${TOKEN_HOLDER_DELEGATION_ID_PREFIX}${delegate.toHexString()}`
}

export function getOrCreateStakeDelegation(delegate: Address): StakeDelegation {
  const id = getStakeDelegationId(delegate)
  let delegation = StakeDelegation.load(id)

  if (!delegation) {
    delegation = new StakeDelegation(id)
    delegation.totalWeight = BigInt.zero()
  }

  return delegation
}

export function getOrCreateTokenholderDelegation(
  delegate: Address
): TokenholderDelegation {
  const id = getTokenholderDelegationId(delegate)
  let delegation = TokenholderDelegation.load(id)

  if (!delegation) {
    delegation = new TokenholderDelegation(id)
    delegation.totalWeight = BigInt.zero()
    delegation.liquidWeight = BigInt.zero()
  }

  return delegation
}

export function getDaoMetric(): DAOMetric {
  let metrics = DAOMetric.load(DAO_METRICS_ID)

  if (!metrics) {
    metrics = new DAOMetric(DAO_METRICS_ID)
    metrics.liquidTotal = BigInt.zero()
    metrics.stakedTotal = BigInt.zero()
  }

  return metrics
}
