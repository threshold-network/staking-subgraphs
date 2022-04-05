import { store, crypto, ByteArray, log } from "@graphprotocol/graph-ts"
import { Staked, ToppedUp, Unstaked } from "../generated/TokenStaking/TokenStaking"
import { Metric, Stake, EpochCounter, Epoch, EpochStake } from "../generated/schema"


export function handleStaked(event: Staked): void {
  const blockTimestamp = event.block.timestamp

  let metric = Metric.load("TokenStakingMetrics")
  if (!metric) {
    metric = new Metric("TokenStakingMetrics")
  }
  metric.totalStaked = metric.totalStaked.plus(event.params.amount)
  metric.totalStakers ++
  metric.save()

  let stake = new Stake(event.params.stakingProvider.toHexString())
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
  stake.save()

  let epochCounter = EpochCounter.load("Singleton")
  if (!epochCounter) {
    epochCounter = new EpochCounter("Singleton")
    epochCounter.count = 0
  }

  let epochStakes:string[] = []

  const lastEpochId = (epochCounter.count - 1).toString()
  let lastEpoch = Epoch.load(lastEpochId)

  if (lastEpoch) {
    lastEpoch.duration = blockTimestamp.minus(lastEpoch.startTime)
    lastEpoch.save()
    epochStakes = lastEpoch.stakes
    for(let i = 0; i < epochStakes.length; i++) {
      // Calculate the duration and participations of last epoch and save it
      let epochStake = EpochStake.load(epochStakes[i])
      epochStake!.participation = epochStake!.amount.divDecimal(lastEpoch.totalStaked.toBigDecimal())
      epochStake!.save()

      // Copy epoch stake using last epoch stake as base
      const epStId = crypto.keccak256(ByteArray.fromUTF8(
        epochStake!.stakingProvider.toHexString()
        + epochCounter.count.toString()
      )).toHexString()
      epochStake!.id = epStId
      epochStake!.save()
      epochStakes[i] = epochStake!.id
    }
  }

  const newEpStId = crypto.keccak256(ByteArray.fromUTF8(
    event.params.stakingProvider.toHexString()
    + epochCounter.count.toString()
  )).toHexString()
  let newEpochStake = new EpochStake(newEpStId)
  newEpochStake.stakingProvider = stake.stakingProvider
  newEpochStake.owner = stake.owner
  newEpochStake.amount = stake.amount
  newEpochStake.save()

  epochStakes.push(newEpochStake.id)

  let epoch = new Epoch(epochCounter.count.toString())
  epoch.startTime = blockTimestamp
  epoch.totalStaked = lastEpoch ? lastEpoch.totalStaked.plus(event.params.amount) : stake.amount
  epoch.stakes = epochStakes
  epoch.save()

  epochCounter.count ++
  epochCounter.save()

  log.warning("STAKED. ID: {} stakingProvider: {} amount: {}", [
    (epochCounter.count-1).toString(),
    event.params.stakingProvider.toHexString(),
    event.params.amount.toString()
  ])
}


export function handleToppedUp(event: ToppedUp): void {
  const blockTimestamp = event.block.timestamp

  let metric = Metric.load("TokenStakingMetrics")
  metric!.totalStaked = metric!.totalStaked.plus(event.params.amount)
  metric!.save()

  let id = event.params.stakingProvider.toHexString()
  let stake = Stake.load(id)
  if (!stake) {
    stake = new Stake(event.params.stakingProvider.toHexString())
  }
  stake.amount = stake.amount.plus(event.params.amount)
  log.warning("==== STAKE AMOUNT: {} PARAMS: {}", [stake.amount.toString(), event.params.amount.toString()])
  stake.save()
  log.warning("AFTER", [])

  let epochStakes:string[] = []

  let epochCounter = EpochCounter.load("Singleton")
  const lastEpochId = (epochCounter!.count - 1).toString()
  let lastEpoch = Epoch.load(lastEpochId)

  if (lastEpoch) {
    lastEpoch.duration = blockTimestamp.minus(lastEpoch.startTime)
    lastEpoch.save()
    epochStakes = lastEpoch.stakes
    for(let i = 0; i < epochStakes.length; i++) {
      // Calculate the duration and participations of last epoch and save it
      let epochStake = EpochStake.load(epochStakes[i])
      epochStake!.participation = epochStake!.amount.divDecimal(lastEpoch.totalStaked.toBigDecimal())
      epochStake!.save()

      // Copy epoch stake using last epoch stake as base
      const epStId = crypto.keccak256(ByteArray.fromUTF8(
        epochStake!.stakingProvider.toHexString()
        + epochCounter!.count.toString()
      )).toHexString()
      epochStake!.id = epStId

      // If this stake is the one to topup, increase the amount
      if (epochStake!.stakingProvider == event.params.stakingProvider) {
        epochStake!.amount = epochStake!.amount.plus(event.params.amount)
      }
      epochStake!.save()
      epochStakes[i] = epochStake!.id
    }
  }

  let epoch = new Epoch(epochCounter!.count.toString())
  epoch.startTime = blockTimestamp
  epoch.totalStaked = lastEpoch!.totalStaked.plus(event.params.amount)
  epoch.stakes = epochStakes
  epoch.save()

  epochCounter!.count ++
  epochCounter!.save()

  log.warning("TOPPEDUP. ID: {} stakingProvider: {} amount: {}", [
    (epochCounter!.count-1).toString(),
    event.params.stakingProvider.toHexString(),
    event.params.amount.toString()
  ])
}


export function handleUnstaked(event: Unstaked): void {
  // const blockTimestamp = event.block.timestamp

  // let metric = Metric.load("TokenStakingMetrics")
  // metric!.totalStaked = metric!.totalStaked.minus(event.params.amount)

  // let id = event.params.stakingProvider.toHexString()
  // let stake = Stake.load(id)

  // stake!.amount = stake!.amount.minus(event.params.amount)
  // if (stake!.amount.isZero()) {
  //   metric!.totalStakers --
  //   store.remove('Stake', id)
  // } else {
  //   stake!.save()
  // }
  // metric!.save()

  log.warning("UNSTAKED. stakingProvider: {} amount: {}", [
    event.params.stakingProvider.toHexString(),
    event.params.amount.toString()
  ])
}
