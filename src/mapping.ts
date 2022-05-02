import { crypto, ByteArray, BigInt } from "@graphprotocol/graph-ts"
import {
  OperatorConfirmed
} from "../generated/SimplePREApplication/SimplePREApplication"
import {
  Staked,
  ToppedUp,
  Unstaked,
  DelegateChanged,
  TopUpKeepCall,
  TopUpNuCall,
  TopUpCall,
  UnstakeKeepCall,
  UnstakeAllCall,
  UnstakeNuCall,
  UnstakeTCall,
} from "../generated/TokenStaking/TokenStaking"
import {
  StakeData,
  EpochCounter,
  Epoch,
  EpochStake,
  StakeDelegation,
  ConfirmedOperator,
  Account,
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
  const owner = event.params.owner
  let account = Account.load(owner.toHexString())
  if(!account) {
    account = new Account(owner.toHexString())
    account.save()
  }

  const stakeAmount =  event.params.amount
  stakeData.stakeType = type
  stakeData.owner = account.id
  stakeData.beneficiary = event.params.beneficiary
  stakeData.authorizer = event.params.authorizer
  stakeData.tStake = type === "T" ? stakeAmount : BigInt.zero()
  stakeData.nuInTStake = type === "NU" ? stakeAmount : BigInt.zero()
  stakeData.keepInTStake = type === "KEEP" ? stakeAmount : BigInt.zero()
  stakeData.totalStaked = stakeData.tStake.plus(stakeData.keepInTStake).plus(stakeData.nuInTStake)
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

export function handleTopUpKeep(call: TopUpKeepCall): void {
  const stakeData = StakeData.load(call.inputs.stakingProvider.toHexString()) as StakeData
  // TODO: how to get the amount?
  const amount = BigInt.zero()
  stakeData.keepInTStake = stakeData.keepInTStake.plus(amount)
  stakeData.save()
}

export function handleTopUpNu(call: TopUpNuCall): void {
  const stakeData = StakeData.load(call.inputs.stakingProvider.toHexString()) as StakeData
  // TODO: how to get the amount?
  const amount = BigInt.zero()
  stakeData.nuInTStake = stakeData.keepInTStake.plus(amount)
  stakeData.save()
}

export function handleTopUpT(call: TopUpCall ): void {
  const stakeData = StakeData.load(call.inputs.stakingProvider.toHexString()) as StakeData
  stakeData.tStake = stakeData.tStake.plus(call.inputs.amount)
  stakeData.save()
}

export function handleToppedUp(event: ToppedUp): void {
  const blockTimestamp = event.block.timestamp

  const stakeData = StakeData.load(event.params.stakingProvider.toHexString()) as StakeData
  stakeData.totalStaked = stakeData.totalStaked.plus(event.params.amount)
  stakeData.save()

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

export function handleUnstakeKeep(call: UnstakeKeepCall): void {
  const stakeData = StakeData.load(call.inputs.stakingProvider.toHexString()) as StakeData
  // The legacy KEEP stake can be unstaked only in full amount so we can set
  // `keepInTStake` to `0`.
  stakeData.keepInTStake = BigInt.zero()
  stakeData.save()
}

export function handleUnstakeNu(call: UnstakeNuCall): void {
  const stakeData = StakeData.load(call.inputs.stakingProvider.toHexString()) as StakeData
  stakeData.nuInTStake = stakeData.keepInTStake.minus(call.inputs.amount)
  stakeData.save()
}

export function handleUnstakeT(call: UnstakeTCall ): void {
  const stakeData = StakeData.load(call.inputs.stakingProvider.toHexString()) as StakeData
  stakeData.tStake = stakeData.tStake.minus(call.inputs.amount)
  stakeData.save()
}

export function handleUnstakeAll(call: UnstakeAllCall): void {
  const stakeData = StakeData.load(call.inputs.stakingProvider.toHexString()) as StakeData
  
  stakeData.tStake = BigInt.zero()
  stakeData.nuInTStake = BigInt.zero()
  stakeData.keepInTStake = BigInt.zero()

  stakeData.save()
}

export function handleUnstaked(event: Unstaked): void {
  const blockTimestamp = event.block.timestamp

  const stakeData = StakeData.load(event.params.stakingProvider.toHexString()) as StakeData
  stakeData.totalStaked = stakeData.totalStaked.minus(event.params.amount)
  stakeData.save()

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
  let delegatee = event.params.toDelegate
  let stakeDelegation = StakeDelegation.load(delegatee.toHexString())

  if (!stakeDelegation) {
    stakeDelegation = new StakeDelegation(delegatee.toHexString())
  }
  // It's not possible to delegate voting power if a stake doesn't exist so we
  // can force the type. The `delegator` is always a staking provider in the
  // `TTokenStaking` contract.
  const stake = StakeData.load(event.params.delegator.toHexString()) as StakeData
  stake.delegatee = stakeDelegation.id
  stake.save()
  // TODO: Set the total weight. Take into account all stakes because stake
  // owners can delagate the voting power to the same `delegatee`.
  stakeDelegation.totalWeight = BigInt.zero()
  stakeDelegation.save()
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
