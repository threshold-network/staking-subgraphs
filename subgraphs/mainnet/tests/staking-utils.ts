import { newMockEvent } from "matchstick-as"
import { AuthorizationIncreased } from "../generated/TokenStaking/TokenStaking"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"

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
