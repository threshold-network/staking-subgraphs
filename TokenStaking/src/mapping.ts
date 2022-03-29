import { store } from "@graphprotocol/graph-ts"
import { BigInt } from "@graphprotocol/graph-ts"
import {
  Staked,
  ToppedUp,
  Unstaked
} from "../generated/TokenStaking/TokenStaking"
import { Stake } from "../generated/schema"
import { Metric } from "../generated/schema"


export function handleStaked(event: Staked): void {
  let stake = new Stake(event.params.stakingProvider.toHex())
  let metric = Metric.load("TokenStakingMetrics")

  if (!metric) {
    metric = new Metric("TokenStakingMetrics")
  }
  let type:string
  switch(event.params.stakeType) {
    case 0:
      type = "NU"
      break
    case 1:
      type = "KEEP"
      break
    default:
      type = "T"
  }
  stake.stakeType = type
  stake.owner = event.params.owner
  stake.stakingProvider = event.params.stakingProvider
  stake.beneficiary = event.params.beneficiary
  stake.authorizer = event.params.authorizer
  stake.amount = event.params.amount
  metric.totalStaked = metric.totalStaked.plus(event.params.amount)
  metric.totalStakers ++

  stake.save()
  metric.save()
}

export function handleToppedUp(event: ToppedUp): void {
  let id = event.params.stakingProvider.toHex()
  let stake = Stake.load(id)
  let metric = Metric.load("TokenStakingMetrics")

  if (!metric) {
    metric = new Metric("TokenStakingMetrics")
  }
  if (stake) {
    stake.amount = stake.amount.plus(event.params.amount)
    metric.totalStaked = metric.totalStaked.plus(event.params.amount)

    stake.save()
    metric.save()
  }
}

export function handleUnstaked(event: Unstaked): void {
  let id = event.params.stakingProvider.toHex()
  let stake = Stake.load(id)
  let metric = Metric.load("TokenStakingMetrics")

  if (!metric) {
    metric = new Metric("TokenStakingMetrics")
  }
  if (stake) {
    stake.amount = stake.amount.minus(event.params.amount)
    metric.totalStaked = metric.totalStaked.minus(event.params.amount)
    if (stake.amount.isZero()) {
      metric.totalStakers --
      store.remove('Stake', id)
    } else {
      stake.save()
    }
    metric.save()
  }
}
