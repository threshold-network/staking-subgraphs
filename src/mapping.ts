import { crypto, ByteArray, BigInt, log } from "@graphprotocol/graph-ts"
import { OperatorConfirmed } from "../generated/SimplePREApplication/SimplePREApplication"
import {
  Staked,
  ToppedUp,
  Unstaked,
  DelegateChanged,
  TokenStaking,
  DelegateVotesChanged,
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
  let type: string
  switch (event.params.stakeType) {
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
  if (!account) {
    account = new Account(owner.toHexString())
    account.save()
  }

  const stakeAmount = event.params.amount
  stakeData.stakeType = type
  stakeData.owner = account.id
  stakeData.beneficiary = event.params.beneficiary
  stakeData.authorizer = event.params.authorizer
  stakeData.tStake = type === "T" ? stakeAmount : BigInt.zero()
  stakeData.nuInTStake = type === "NU" ? stakeAmount : BigInt.zero()
  stakeData.keepInTStake = type === "KEEP" ? stakeAmount : BigInt.zero()
  stakeData.totalStaked = stakeData.tStake
    .plus(stakeData.keepInTStake)
    .plus(stakeData.nuInTStake)
  stakeData.save()

  const lastEpochId = (epochCounter.count - 1).toString()
  let lastEpoch = Epoch.load(lastEpochId)

  const totalStaked = lastEpoch
    ? lastEpoch.totalStaked.plus(event.params.amount)
    : event.params.amount
  let epochStakes: string[] = []

  if (lastEpoch) {
    lastEpoch.duration = blockTimestamp.minus(lastEpoch.startTime)
    lastEpoch.save()

    epochStakes = lastEpoch.stakes
    for (let i = 0; i < epochStakes.length; i++) {
      let epochStake = EpochStake.load(epochStakes[i])
      const epStId = crypto
        .keccak256(
          ByteArray.fromUTF8(
            epochStake!.stakeData + epochCounter.count.toString()
          )
        )
        .toHexString()
      epochStake!.id = epStId
      epochStake!.participation = epochStake!.amount.divDecimal(
        totalStaked.toBigDecimal()
      )
      epochStake!.save()
      epochStakes[i] = epochStake!.id
    }
  }

  const epStId = crypto
    .keccak256(ByteArray.fromUTF8(stakeData.id + epochCounter.count.toString()))
    .toHexString()
  let newEpochStake = new EpochStake(epStId)
  newEpochStake.stakeData = stakeData.id
  newEpochStake.amount = event.params.amount
  newEpochStake.participation = newEpochStake.amount.divDecimal(
    totalStaked.toBigDecimal()
  )
  newEpochStake.save()

  epochStakes.push(newEpochStake.id)

  let epoch = new Epoch(epochCounter.count.toString())
  epoch.startTime = blockTimestamp
  epoch.totalStaked = totalStaked
  epoch.stakes = epochStakes
  epoch.save()

  epochCounter.count++
  epochCounter.save()
}

export function handleToppedUp(event: ToppedUp): void {
  const blockTimestamp = event.block.timestamp
  const stakingProvider = event.params.stakingProvider
  const amount = event.params.amount

  const topUpFunctionId = ByteArray.fromHexString(
    event.transaction.input.toHexString().substring(0, 10)
  )

  const topUpTFunctionId = ByteArray.fromHexString(
    crypto
      .keccak256(ByteArray.fromUTF8("topUp(address,uint96)"))
      .toHexString()
      .substring(0, 10)
  )
  const topUpKeepFunctionId = ByteArray.fromHexString(
    crypto
      .keccak256(ByteArray.fromUTF8("topUpKeep(address)"))
      .toHexString()
      .substring(0, 10)
  )
  const topUpNuFunctionId = ByteArray.fromHexString(
    crypto
      .keccak256(ByteArray.fromUTF8("topUpNu(address)"))
      .toHexString()
      .substring(0, 10)
  )

  const stakeData = StakeData.load(
    event.params.stakingProvider.toHexString()
  ) as StakeData
  stakeData.totalStaked = stakeData.totalStaked.plus(event.params.amount)

  if (topUpFunctionId.equals(topUpTFunctionId)) {
    stakeData.tStake = stakeData.tStake.plus(amount)
  } else if (topUpFunctionId.equals(topUpKeepFunctionId)) {
    stakeData.keepInTStake = stakeData.keepInTStake.plus(amount)
  } else if (topUpFunctionId.equals(topUpNuFunctionId)) {
    stakeData.nuInTStake = stakeData.nuInTStake.plus(amount)
  } else {
    log.info(
      "Could not match the top up function identifier with event input data. Fetching the current stake balance for {} staking provider from chain.",
      [stakingProvider.toHexString()]
    )
    const stakes = TokenStaking.bind(event.address).stakes(stakingProvider)
    stakeData.tStake = stakes.value0
    stakeData.keepInTStake = stakes.value1
    stakeData.nuInTStake = stakes.value2
  }
  stakeData.save()

  let epochCounter = EpochCounter.load("Singleton")
  const lastEpochId = (epochCounter!.count - 1).toString()
  let lastEpoch = Epoch.load(lastEpochId)

  const totalStaked = lastEpoch!.totalStaked.plus(event.params.amount)
  let stakeInPreviousEpoch = false
  let epochStakes: string[] = []

  lastEpoch!.duration = blockTimestamp.minus(lastEpoch!.startTime)
  lastEpoch!.save()

  epochStakes = lastEpoch!.stakes
  for (let i = 0; i < epochStakes.length; i++) {
    let epochStake = EpochStake.load(epochStakes[i])
    const epStId = crypto
      .keccak256(
        ByteArray.fromUTF8(
          epochStake!.stakeData + epochCounter!.count.toString()
        )
      )
      .toHexString()
    epochStake!.id = epStId

    // If this stake is the one to be topped up, increase the amount
    if (epochStake!.stakeData == event.params.stakingProvider.toHexString()) {
      stakeInPreviousEpoch = true
      epochStake!.amount = epochStake!.amount.plus(event.params.amount)
    }

    epochStake!.participation = epochStake!.amount.divDecimal(
      totalStaked.toBigDecimal()
    )
    epochStake!.save()
    epochStakes[i] = epochStake!.id
  }

  // If the topped-up-stake is not in the previous epoch, add it
  if (!stakeInPreviousEpoch) {
    const epStId = crypto
      .keccak256(
        ByteArray.fromUTF8(
          event.params.stakingProvider.toHexString() +
            epochCounter!.count.toString()
        )
      )
      .toHexString()
    let newEpochStake = new EpochStake(epStId)
    newEpochStake.stakeData = event.params.stakingProvider.toHexString()
    newEpochStake.amount = event.params.amount
    newEpochStake.participation = newEpochStake.amount.divDecimal(
      totalStaked.toBigDecimal()
    )
    newEpochStake.save()
    epochStakes.push(newEpochStake.id)
  }

  let epoch = new Epoch(epochCounter!.count.toString())
  epoch.startTime = blockTimestamp
  epoch.totalStaked = totalStaked
  epoch.stakes = epochStakes
  epoch.save()

  epochCounter!.count++
  epochCounter!.save()
}

export function handleUnstaked(event: Unstaked): void {
  const blockTimestamp = event.block.timestamp
  const unstakeFunctionId = ByteArray.fromHexString(
    event.transaction.input.toHexString().substring(0, 10)
  )
  const stakingProvider = event.params.stakingProvider
  const amount = event.params.amount

  const unstakeTFunctionId = ByteArray.fromHexString(
    crypto
      .keccak256(ByteArray.fromUTF8("unstakeT(address,uint96)"))
      .toHexString()
      .substring(0, 10)
  )
  const unstakeKeepFunctionId = ByteArray.fromHexString(
    crypto
      .keccak256(ByteArray.fromUTF8("unstakeKeep(address)"))
      .toHexString()
      .substring(0, 10)
  )
  const unstakeNuFunctionId = ByteArray.fromHexString(
    crypto
      .keccak256(ByteArray.fromUTF8("unstakeNu(address,uint96)"))
      .toHexString()
      .substring(0, 10)
  )
  const unstakeAllFunctionId = ByteArray.fromHexString(
    crypto
      .keccak256(ByteArray.fromUTF8("unstakeAll(address)"))
      .toHexString()
      .substring(0, 10)
  )

  const stakeData = StakeData.load(stakingProvider.toHexString()) as StakeData
  stakeData.totalStaked = stakeData.totalStaked.minus(amount)

  if (unstakeFunctionId.equals(unstakeTFunctionId)) {
    stakeData.tStake = stakeData.tStake.minus(amount)
  } else if (unstakeFunctionId.equals(unstakeKeepFunctionId)) {
    stakeData.keepInTStake = stakeData.keepInTStake.minus(amount)
  } else if (unstakeFunctionId.equals(unstakeNuFunctionId)) {
    stakeData.nuInTStake = stakeData.nuInTStake.minus(amount)
  } else if (unstakeFunctionId.equals(unstakeAllFunctionId)) {
    stakeData.tStake = BigInt.zero()
    stakeData.keepInTStake = BigInt.zero()
    stakeData.nuInTStake = BigInt.zero()
  } else {
    log.info(
      "Could not match the unstake function identifier with event input data. Fetching the current stake balance for {} staking provider from chain.",
      [stakingProvider.toHexString()]
    )
    const stakes = TokenStaking.bind(event.address).stakes(stakingProvider)
    stakeData.tStake = stakes.value0
    stakeData.keepInTStake = stakes.value1
    stakeData.nuInTStake = stakes.value2
  }

  stakeData.save()

  let epochCounter = EpochCounter.load("Singleton")
  const lastEpochId = (epochCounter!.count - 1).toString()
  let lastEpoch = Epoch.load(lastEpochId)

  const totalStaked = lastEpoch!.totalStaked.minus(event.params.amount)
  let emptyStakeArrayIndex: i32 = -1
  let epochStakes: string[] = []

  lastEpoch!.duration = blockTimestamp.minus(lastEpoch!.startTime)
  lastEpoch!.save()

  epochStakes = lastEpoch!.stakes
  for (let i = 0; i < epochStakes.length; i++) {
    let epochStake = EpochStake.load(epochStakes[i])
    const epStId = crypto
      .keccak256(
        ByteArray.fromUTF8(
          epochStake!.stakeData + epochCounter!.count.toString()
        )
      )
      .toHexString()
    epochStake!.id = epStId

    // If this stake is the one to be unstaked, decrease the amount
    if (epochStake!.stakeData == event.params.stakingProvider.toHexString()) {
      epochStake!.amount = epochStake!.amount.minus(event.params.amount)
      emptyStakeArrayIndex = epochStake!.amount.isZero() ? i : -1
    }

    epochStake!.participation = epochStake!.amount.divDecimal(
      totalStaked.toBigDecimal()
    )
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

  epochCounter!.count++
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
  const stake = StakeData.load(
    event.params.delegator.toHexString()
  ) as StakeData
  stake.delegatee = stakeDelegation.id
  stake.save()
  stakeDelegation.save()
}

export function handleDelegateVotesChanged(event: DelegateVotesChanged): void {
  let delegatee = event.params.delegate
  let stakeDelegation = StakeDelegation.load(delegatee.toHexString())

  if (!stakeDelegation) {
    stakeDelegation = new StakeDelegation(delegatee.toHexString())
  }

  stakeDelegation.totalWeight = event.params.newBalance
  stakeDelegation.save()
}

export function handleOperatorConfirmed(event: OperatorConfirmed): void {
  let operator = ConfirmedOperator.load(
    event.params.stakingProvider.toHexString()
  )
  if (!operator) {
    operator = new ConfirmedOperator(event.params.stakingProvider.toHexString())
  }
  operator.stakingProvider = event.params.stakingProvider
  operator.operator = event.params.operator
  operator.save()
}
