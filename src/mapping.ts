import { crypto, ByteArray } from "@graphprotocol/graph-ts"
import {
  OperatorConfirmed
} from "../generated/SimplePREApplication/SimplePREApplication"
import {
  Staked,
  ToppedUp,
  Unstaked,
  DelegateChanged,
  MinimumStakeAmountSet,
} from "../generated/TokenStaking/TokenStaking"
import {
  StakeData,
  EpochCounter,
  Epoch,
  EpochStake,
  Delegation,
  ConfirmedOperator,
  MinStakeAmount,
} from "../generated/schema"


export function handleStaked(event: Staked): void {
  const blockTimestamp = event.block.timestamp

  let epochCounter = EpochCounter.load("Singleton")
  if (!epochCounter) {
    epochCounter = new EpochCounter("Singleton")
    epochCounter.count = 0
  }

  let stakeData = new StakeData(event.params.stakingProvider.toHexString())
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
  stakeData.stakeType = type
  stakeData.owner = event.params.owner
  stakeData.stakingProvider = event.params.stakingProvider
  stakeData.beneficiary = event.params.beneficiary
  stakeData.authorizer = event.params.authorizer
  stakeData.save()

  const lastEpochId = (epochCounter.count - 1).toString()
  let lastEpoch = Epoch.load(lastEpochId)

  const totalStaked = lastEpoch ? lastEpoch.totalStaked.plus(event.params.amount) : event.params.amount
  let epochStakes:string[] = []

  if (lastEpoch) {
    lastEpoch.duration = blockTimestamp.minus(lastEpoch.startTime)
    lastEpoch.save()

    epochStakes = lastEpoch.stakes
    for(let i = 0; i < epochStakes.length; i++) {
      let epochStake = EpochStake.load(epochStakes[i])
      const epStId = crypto.keccak256(ByteArray.fromUTF8(
        epochStake!.stakeData
        + epochCounter.count.toString()
        )).toHexString()
      epochStake!.id = epStId
      epochStake!.participation = epochStake!.amount.divDecimal(totalStaked.toBigDecimal())
      epochStake!.save()
      epochStakes[i] = epochStake!.id
    }
  }

  const epStId = crypto.keccak256(ByteArray.fromUTF8(
    stakeData.id
    + epochCounter.count.toString()
  )).toHexString()
  let newEpochStake = new EpochStake(epStId)
  newEpochStake.stakeData = stakeData.id
  newEpochStake.amount = event.params.amount
  newEpochStake.participation = newEpochStake.amount.divDecimal(totalStaked.toBigDecimal())
  newEpochStake.save()

  epochStakes.push(newEpochStake.id)

  let epoch = new Epoch(epochCounter.count.toString())
  epoch.startTime = blockTimestamp
  epoch.totalStaked = totalStaked
  epoch.stakes = epochStakes
  epoch.save()

  epochCounter.count ++
  epochCounter.save()
}


export function handleToppedUp(event: ToppedUp): void {
  const blockTimestamp = event.block.timestamp

  let epochCounter = EpochCounter.load("Singleton")
  const lastEpochId = (epochCounter!.count - 1).toString()
  let lastEpoch = Epoch.load(lastEpochId)

  const totalStaked = lastEpoch!.totalStaked.plus(event.params.amount)
  let stakeInPreviousEpoch = false
  let epochStakes:string[] = []

  lastEpoch!.duration = blockTimestamp.minus(lastEpoch!.startTime)
  lastEpoch!.save()

  epochStakes = lastEpoch!.stakes
  for(let i = 0; i < epochStakes.length; i++) {
    let epochStake = EpochStake.load(epochStakes[i])
    const epStId = crypto.keccak256(ByteArray.fromUTF8(
      epochStake!.stakeData
      + epochCounter!.count.toString()
    )).toHexString()
    epochStake!.id = epStId

    // If this stake is the one to be topped up, increase the amount
    if (epochStake!.stakeData == event.params.stakingProvider.toHexString()) {
      stakeInPreviousEpoch = true
      epochStake!.amount = epochStake!.amount.plus(event.params.amount)
    }

    epochStake!.participation = epochStake!.amount.divDecimal(totalStaked.toBigDecimal())
    epochStake!.save()
    epochStakes[i] = epochStake!.id
  }

  // If the topped-up-stake is not in the previous epoch, add it
  if (!stakeInPreviousEpoch) {
    const epStId = crypto.keccak256(ByteArray.fromUTF8(
      event.params.stakingProvider.toHexString()
      + epochCounter!.count.toString()
    )).toHexString()
    let newEpochStake = new EpochStake(epStId)
    newEpochStake.stakeData = event.params.stakingProvider.toHexString()
    newEpochStake.amount = event.params.amount
    newEpochStake.participation = newEpochStake.amount.divDecimal(totalStaked.toBigDecimal())
    newEpochStake.save()
    epochStakes.push(newEpochStake.id)
  }

  let epoch = new Epoch(epochCounter!.count.toString())
  epoch.startTime = blockTimestamp
  epoch.totalStaked = totalStaked
  epoch.stakes = epochStakes
  epoch.save()

  epochCounter!.count ++
  epochCounter!.save()
}


export function handleUnstaked(event: Unstaked): void {
  const blockTimestamp = event.block.timestamp

  let epochCounter = EpochCounter.load("Singleton")
  const lastEpochId = (epochCounter!.count - 1).toString()
  let lastEpoch = Epoch.load(lastEpochId)

  const totalStaked = lastEpoch!.totalStaked.minus(event.params.amount)
  let emptyStakeArrayIndex:i32 = -1
  let epochStakes:string[] = []

  lastEpoch!.duration = blockTimestamp.minus(lastEpoch!.startTime)
  lastEpoch!.save()

  epochStakes = lastEpoch!.stakes
  for(let i = 0; i < epochStakes.length; i++) {
    let epochStake = EpochStake.load(epochStakes[i])
    const epStId = crypto.keccak256(ByteArray.fromUTF8(
      epochStake!.stakeData
      + epochCounter!.count.toString()
    )).toHexString()
    epochStake!.id = epStId

    // If this stake is the one to be unstaked, decrease the amount
    if (epochStake!.stakeData == event.params.stakingProvider.toHexString()) {
      epochStake!.amount = epochStake!.amount.minus(event.params.amount)
      emptyStakeArrayIndex = epochStake!.amount.isZero() ? i : -1
    }

    epochStake!.participation = epochStake!.amount.divDecimal(totalStaked.toBigDecimal())
    epochStake!.save()
    epochStakes[i] = epochStake!.id
  }

  if (emptyStakeArrayIndex >= 0) {
    epochStakes.splice(emptyStakeArrayIndex, 1)
  }

  let epoch = new Epoch(epochCounter!.count.toString())
  epoch.startTime = blockTimestamp
  epoch.totalStaked = totalStaked
  epoch.stakes = epochStakes
  epoch.save()

  epochCounter!.count ++
  epochCounter!.save()
}


export function handleDelegateChanged(event: DelegateChanged): void {
  let delegation = Delegation.load(event.params.delegator.toHexString())
  if (!delegation) {
    delegation = new Delegation(event.params.delegator.toHexString())
  }
  delegation.delegator = event.params.delegator
  delegation.delegate = event.params.toDelegate
  delegation.save()
}


export function handleOperatorConfirmed(event: OperatorConfirmed): void {
  let operator = ConfirmedOperator.load(event.params.stakingProvider.toHexString())
  if (!operator) {
    operator = new ConfirmedOperator(event.params.stakingProvider.toHexString())
  }
  operator.stakingProvider = event.params.stakingProvider
  operator.operator = event.params.operator
  operator.save()
}

export function handleMinStakeAmountChanged(
  event: MinimumStakeAmountSet
): void {
  const id = `min-stake-${event.transaction.hash.toHexString()}`

  let minStake = MinStakeAmount.load(id)
  if (!minStake) {
    minStake = new MinStakeAmount(id)
  }

  minStake.amount = event.params.amount
  minStake.blockNumber = event.block.number
  minStake.updatedAt = event.block.timestamp
  minStake.save()
}