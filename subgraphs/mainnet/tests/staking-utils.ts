import { newMockEvent } from "matchstick-as"
import {
  Staked,
  ToppedUp,
  Unstaked,
  AuthorizationIncreased,
  AuthorizationDecreaseApproved,
  AuthorizationDecreaseRequested,
  AuthorizationInvoluntaryDecreased,
} from "../generated/TokenStaking/TokenStaking"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"

export function createStakedEvent(
  stakeType: i32,
  owner: Address,
  stakingProvider: Address,
  beneficiary: Address,
  authorizer: Address,
  amount: BigInt
): Staked {
  const stakedEvent = changetype<Staked>(newMockEvent())

  stakedEvent.parameters = []

  stakedEvent.parameters.push(
    new ethereum.EventParam(
      "stakeType",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(stakeType))
    )
  )
  stakedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  stakedEvent.parameters.push(
    new ethereum.EventParam(
      "stakingProvider",
      ethereum.Value.fromAddress(stakingProvider)
    )
  )
  stakedEvent.parameters.push(
    new ethereum.EventParam(
      "beneficiary",
      ethereum.Value.fromAddress(beneficiary)
    )
  )
  stakedEvent.parameters.push(
    new ethereum.EventParam(
      "authorizer",
      ethereum.Value.fromAddress(authorizer)
    )
  )
  stakedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return stakedEvent
}

export function createToppedUpEvent(
  stakingProvider: Address,
  amount: BigInt
): ToppedUp {
  const toppedUpEvent = changetype<ToppedUp>(newMockEvent())

  toppedUpEvent.parameters = []

  toppedUpEvent.parameters.push(
    new ethereum.EventParam(
      "stakingProvider",
      ethereum.Value.fromAddress(stakingProvider)
    )
  )
  toppedUpEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return toppedUpEvent
}

export function createUnstakedEvent(
  stakingProvider: Address,
  amount: BigInt
): Unstaked {
  const unstakedEvent = changetype<Unstaked>(newMockEvent())

  unstakedEvent.parameters = []

  unstakedEvent.parameters.push(
    new ethereum.EventParam(
      "stakingProvider",
      ethereum.Value.fromAddress(stakingProvider)
    )
  )
  unstakedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return unstakedEvent
}

export function createAuthorizationIncreasedEvent(
  stakingProvider: Address,
  application: Address,
  fromAmount: BigInt,
  toAmount: BigInt
): AuthorizationIncreased {
  const authorizationIncreasedEvent = changetype<AuthorizationIncreased>(
    newMockEvent()
  )
  authorizationIncreasedEvent.parameters = []

  authorizationIncreasedEvent.parameters.push(
    new ethereum.EventParam(
      "stakingProvider",
      ethereum.Value.fromAddress(stakingProvider)
    )
  )
  authorizationIncreasedEvent.parameters.push(
    new ethereum.EventParam(
      "application",
      ethereum.Value.fromAddress(application)
    )
  )
  authorizationIncreasedEvent.parameters.push(
    new ethereum.EventParam(
      "fromAmount",
      ethereum.Value.fromUnsignedBigInt(fromAmount)
    )
  )
  authorizationIncreasedEvent.parameters.push(
    new ethereum.EventParam(
      "toAmount",
      ethereum.Value.fromUnsignedBigInt(toAmount)
    )
  )

  return authorizationIncreasedEvent
}

export function createAuthorizationDecreaseApprovedEvent(
  stakingProvider: Address,
  application: Address,
  fromAmount: BigInt,
  toAmount: BigInt
): AuthorizationDecreaseApproved {
  const authorizationDecreaseApprovedEvent =
    changetype<AuthorizationDecreaseApproved>(newMockEvent())

  authorizationDecreaseApprovedEvent.parameters = []

  authorizationDecreaseApprovedEvent.parameters.push(
    new ethereum.EventParam(
      "stakingProvider",
      ethereum.Value.fromAddress(stakingProvider)
    )
  )
  authorizationDecreaseApprovedEvent.parameters.push(
    new ethereum.EventParam(
      "application",
      ethereum.Value.fromAddress(application)
    )
  )
  authorizationDecreaseApprovedEvent.parameters.push(
    new ethereum.EventParam(
      "fromAmount",
      ethereum.Value.fromUnsignedBigInt(fromAmount)
    )
  )
  authorizationDecreaseApprovedEvent.parameters.push(
    new ethereum.EventParam(
      "toAmount",
      ethereum.Value.fromUnsignedBigInt(toAmount)
    )
  )

  return authorizationDecreaseApprovedEvent
}

export function createAuthorizationDecreaseRequestedEvent(
  stakingProvider: Address,
  application: Address,
  fromAmount: BigInt,
  toAmount: BigInt
): AuthorizationDecreaseRequested {
  const authorizationDecreaseRequestedEvent =
    changetype<AuthorizationDecreaseRequested>(newMockEvent())

  authorizationDecreaseRequestedEvent.parameters = []

  authorizationDecreaseRequestedEvent.parameters.push(
    new ethereum.EventParam(
      "stakingProvider",
      ethereum.Value.fromAddress(stakingProvider)
    )
  )
  authorizationDecreaseRequestedEvent.parameters.push(
    new ethereum.EventParam(
      "application",
      ethereum.Value.fromAddress(application)
    )
  )
  authorizationDecreaseRequestedEvent.parameters.push(
    new ethereum.EventParam(
      "fromAmount",
      ethereum.Value.fromUnsignedBigInt(fromAmount)
    )
  )
  authorizationDecreaseRequestedEvent.parameters.push(
    new ethereum.EventParam(
      "toAmount",
      ethereum.Value.fromUnsignedBigInt(toAmount)
    )
  )

  return authorizationDecreaseRequestedEvent
}

export function createAuthorizationInvoluntaryDecreasedEvent(
  stakingProvider: Address,
  application: Address,
  fromAmount: BigInt,
  toAmount: BigInt
): AuthorizationInvoluntaryDecreased {
  const authorizationInvoluntaryDecreasedEvent =
    changetype<AuthorizationInvoluntaryDecreased>(newMockEvent())

  authorizationInvoluntaryDecreasedEvent.parameters = []

  authorizationInvoluntaryDecreasedEvent.parameters.push(
    new ethereum.EventParam(
      "stakingProvider",
      ethereum.Value.fromAddress(stakingProvider)
    )
  )
  authorizationInvoluntaryDecreasedEvent.parameters.push(
    new ethereum.EventParam(
      "application",
      ethereum.Value.fromAddress(application)
    )
  )
  authorizationInvoluntaryDecreasedEvent.parameters.push(
    new ethereum.EventParam(
      "fromAmount",
      ethereum.Value.fromUnsignedBigInt(fromAmount)
    )
  )
  authorizationInvoluntaryDecreasedEvent.parameters.push(
    new ethereum.EventParam(
      "toAmount",
      ethereum.Value.fromUnsignedBigInt(toAmount)
    )
  )

  return authorizationInvoluntaryDecreasedEvent
}
