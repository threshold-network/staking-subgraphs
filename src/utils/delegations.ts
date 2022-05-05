import { Address } from "@graphprotocol/graph-ts"
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
  const delegation = StakeDelegation.load(id)

  return !delegation ? new StakeDelegation(id) : delegation
}

export function getOrCreateTokenholderDelegation(
  delegate: Address
): TokenholderDelegation {
  const id = getTokenholderDelegationId(delegate)
  const delegation = TokenholderDelegation.load(id)

  return !delegation ? new TokenholderDelegation(id) : delegation
}

export function getDaoMetric(): DAOMetric {
  const metrics = DAOMetric.load(DAO_METRICS_ID)

  return !metrics ? new DAOMetric(DAO_METRICS_ID) : metrics
}
