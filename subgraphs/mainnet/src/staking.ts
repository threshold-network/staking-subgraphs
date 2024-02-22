import { ByteArray, BigInt, log } from "@graphprotocol/graph-ts"
import {
  Staked as StakedEvent,
  ToppedUp as ToppedUpEvent,
  Unstaked as UnstakedEvent,
  DelegateChanged,
  DelegateVotesChanged,
  MinimumStakeAmountSet,
  AuthorizationDecreaseApproved as AuthorizationDecreaseApprovedEvent,
  AuthorizationDecreaseRequested as AuthorizationDecreaseRequestedEvent,
  AuthorizationIncreased as AuthorizationIncreasedEvent,
  AuthorizationInvoluntaryDecreased as AuthorizationInvoluntaryDecreasedEvent,
} from "../generated/TokenStaking/TokenStaking"
import {
  StakeData,
  Account,
  MinStakeAmount,
  AppAuthorization,
  AppAuthHistory,
  StakeHistory,
} from "../generated/schema"
import {
  getDaoMetric,
  getOrCreateStakeDelegation,
  getOrCreateTokenholderDelegation,
} from "./utils"

export function handleStaked(event: StakedEvent): void {
  const stakingProvider = event.params.stakingProvider
  const owner = event.params.owner

  const stakeData = new StakeData(stakingProvider.toHexString())
  let account = Account.load(owner.toHexString())
  if (!account) {
    account = new Account(owner.toHexString())
    account.save()
  }

  stakeData.owner = account.id
  stakeData.beneficiary = event.params.beneficiary
  stakeData.authorizer = event.params.authorizer
  stakeData.stakedAmount = event.params.amount
  stakeData.save()

  const stakeHistoryId =
    stakingProvider.toHexString() + "-" + event.block.number.toString()
  const stakeHistory = new StakeHistory(stakeHistoryId)
  stakeHistory.stake = stakingProvider.toHexString()
  stakeHistory.eventAmount = event.params.amount
  stakeHistory.stakedAmount = stakeData.stakedAmount
  stakeHistory.eventType = "Staked"
  stakeHistory.blockNumber = event.block.number
  stakeHistory.timestamp = event.block.timestamp
  stakeHistory.save()
}

export function handleToppedUp(event: ToppedUpEvent): void {
  const stakingProvider = event.params.stakingProvider
  const stakeData = StakeData.load(stakingProvider.toHexString())
  if (!stakeData) {
    log.warning(
      "Couldn't find the stakeData entity related to staking prov {} in tx {}",
      [stakingProvider.toHexString(), event.transaction.hash.toHexString()]
    )
    return
  }
  stakeData.stakedAmount = stakeData.stakedAmount.plus(event.params.amount)
  stakeData.save()

  const stakeHistoryId =
    stakingProvider.toHexString() + "-" + event.block.number.toString()
  const stakeHistory = new StakeHistory(stakeHistoryId)
  stakeHistory.stake = stakingProvider.toHexString()
  stakeHistory.eventAmount = event.params.amount
  stakeHistory.stakedAmount = stakeData.stakedAmount
  stakeHistory.eventType = "ToppedUp"
  stakeHistory.blockNumber = event.block.number
  stakeHistory.timestamp = event.block.timestamp
  stakeHistory.save()
}

export function handleUnstaked(event: UnstakedEvent): void {
  const stakingProvider = event.params.stakingProvider
  const stakeData = StakeData.load(stakingProvider.toHexString())
  if (!stakeData) {
    log.warning(
      "Couldn't find the stakeData entity related to staking prov {} in tx {}",
      [stakingProvider.toHexString(), event.transaction.hash.toHexString()]
    )
    return
  }
  stakeData.stakedAmount = stakeData.stakedAmount.minus(event.params.amount)
  stakeData.save()

  const stakeHistoryId =
    stakingProvider.toHexString() + "-" + event.block.number.toString()
  const stakeHistory = new StakeHistory(stakeHistoryId)
  stakeHistory.stake = stakingProvider.toHexString()
  stakeHistory.eventAmount = event.params.amount
  stakeHistory.stakedAmount = stakeData.stakedAmount
  stakeHistory.eventType = "Unstaked"
  stakeHistory.blockNumber = event.block.number
  stakeHistory.timestamp = event.block.timestamp
  stakeHistory.save()
}

export function handleDelegateChanged(event: DelegateChanged): void {
  const delegatee = event.params.toDelegate
  const stakeDelegation = getOrCreateStakeDelegation(delegatee)
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
  const delegatee = event.params.delegate
  const stakeDelegation = getOrCreateStakeDelegation(delegatee)

  stakeDelegation.totalWeight = event.params.newBalance
  stakeDelegation.save()

  const tokenholderDelegation = getOrCreateTokenholderDelegation(delegatee)
  tokenholderDelegation.totalWeight = tokenholderDelegation.liquidWeight.plus(
    stakeDelegation.totalWeight
  )
  tokenholderDelegation.save()

  const daoMetric = getDaoMetric()
  const difference = event.params.newBalance.minus(event.params.previousBalance)
  daoMetric.stakedTotal = daoMetric.stakedTotal.plus(difference)
  daoMetric.save()
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

export function handleAuthorizationIncreased(
  event: AuthorizationIncreasedEvent
): void {
  const tacoAddr = "0x347cc7ede7e5517bd47d20620b2cf1b406edcf07"
  const tbtcAddr = "0x46d52e41c2f300bc82217ce22b920c34995204eb"
  const randomBeaconAddr = "0x5499f54b4a1cb4816eefcf78962040461be3d80b"

  const stakingProvider = event.params.stakingProvider
  const appAddress = event.params.application
  const toAmount = event.params.toAmount

  const appAuthId = `${stakingProvider.toHexString()}-${appAddress.toHexString()}`
  let appAuthorization = AppAuthorization.load(appAuthId)
  if (!appAuthorization) {
    appAuthorization = new AppAuthorization(appAuthId)
  }

  let appName = ""
  if (appAddress.equals(ByteArray.fromHexString(tacoAddr))) {
    appName = "TACo"
  } else if (appAddress.equals(ByteArray.fromHexString(tbtcAddr))) {
    appName = "tBTC"
  } else if (appAddress.equals(ByteArray.fromHexString(randomBeaconAddr))) {
    appName = "Random Beacon"
  }

  appAuthorization.appAddress = appAddress
  appAuthorization.stake = stakingProvider.toHexString()
  appAuthorization.amount = toAmount
  appAuthorization.amountDeauthorizing = BigInt.zero()
  appAuthorization.appName = appName
  appAuthorization.save()

  const appAuthHistoryId =
    stakingProvider.toHexString() +
    "-" +
    appAddress.toHexString() +
    "-" +
    event.block.number.toString()
  const appAuthHistory = new AppAuthHistory(appAuthHistoryId)
  appAuthHistory.appAuthorization = appAuthId
  appAuthHistory.amount = toAmount
  appAuthHistory.eventAmount = toAmount.minus(event.params.fromAmount)
  appAuthHistory.eventType = "AuthorizationIncreased"
  appAuthHistory.blockNumber = event.block.number
  appAuthHistory.timestamp = event.block.timestamp
  appAuthHistory.save()
}

export function handleAuthorizationDecreaseApproved(
  event: AuthorizationDecreaseApprovedEvent
): void {
  const stakingProvider = event.params.stakingProvider
  const appAddress = event.params.application
  const toAmount = event.params.toAmount

  const appAuthId = `${stakingProvider.toHexString()}-${appAddress.toHexString()}`
  const appAuthorization = AppAuthorization.load(appAuthId)

  if (!appAuthorization) {
    return
  }

  appAuthorization.amount = toAmount
  appAuthorization.amountDeauthorizing = BigInt.zero()
  appAuthorization.save()

  const appAuthHistoryId =
    stakingProvider.toHexString() +
    "-" +
    appAddress.toHexString() +
    "-" +
    event.block.number.toString()
  const appAuthHistory = new AppAuthHistory(appAuthHistoryId)
  appAuthHistory.appAuthorization = appAuthId
  appAuthHistory.amount = toAmount
  appAuthHistory.eventAmount = event.params.fromAmount.minus(toAmount)
  appAuthHistory.eventType = "AuthorizationDecreaseApproved"
  appAuthHistory.blockNumber = event.block.number
  appAuthHistory.timestamp = event.block.timestamp
  appAuthHistory.save()
}

export function handleAuthorizationDecreaseRequested(
  event: AuthorizationDecreaseRequestedEvent
): void {
  const stakingProvider = event.params.stakingProvider
  const appAddress = event.params.application
  const toAmount = event.params.toAmount
  const fromAmount = event.params.fromAmount

  const id = `${stakingProvider.toHexString()}-${appAddress.toHexString()}`
  const appAuthorization = AppAuthorization.load(id)

  if (!appAuthorization) {
    return
  }

  appAuthorization.amountDeauthorizing = fromAmount.minus(toAmount)
  appAuthorization.save()
}

export function handleAuthorizationInvoluntaryDecreased(
  event: AuthorizationInvoluntaryDecreasedEvent
): void {
  const stakingProvider = event.params.stakingProvider
  const appAddress = event.params.application
  const toAmount = event.params.toAmount

  const appAuthId = `${stakingProvider.toHexString()}-${appAddress.toHexString()}`
  const appAuthorization = AppAuthorization.load(appAuthId)

  if (!appAuthorization) {
    return
  }

  appAuthorization.amount = toAmount
  if (appAuthorization.amountDeauthorizing > appAuthorization.amount) {
    appAuthorization.amountDeauthorizing = appAuthorization.amount
  }
  appAuthorization.save()

  const appAuthHistoryId =
    stakingProvider.toHexString() +
    "-" +
    appAddress.toHexString() +
    "-" +
    event.block.number.toString()
  const appAuthHistory = new AppAuthHistory(appAuthHistoryId)
  appAuthHistory.appAuthorization = appAuthId
  appAuthHistory.amount = toAmount
  appAuthHistory.eventAmount = event.params.fromAmount.minus(toAmount)
  appAuthHistory.eventType = "AuthorizationInvoluntaryDecreased"
  appAuthHistory.blockNumber = event.block.number
  appAuthHistory.timestamp = event.block.timestamp
  appAuthHistory.save()
}
