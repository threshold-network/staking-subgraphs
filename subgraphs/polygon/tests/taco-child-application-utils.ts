import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  OperatorConfirmed,
  OperatorUpdated,
} from "../generated/TACoChildApplication/TACoChildApplication"

export function createOperatorConfirmedEvent(
  stakingProvider: Address,
  operator: Address,
  timestamp: BigInt
): OperatorConfirmed {
  const operatorConfirmedEvent = changetype<OperatorConfirmed>(newMockEvent())

  operatorConfirmedEvent.parameters = []

  operatorConfirmedEvent.parameters.push(
    new ethereum.EventParam(
      "stakingProvider",
      ethereum.Value.fromAddress(stakingProvider)
    )
  )
  operatorConfirmedEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )

  operatorConfirmedEvent.block.timestamp = timestamp

  return operatorConfirmedEvent
}

export function createOperatorUpdatedEvent(
  stakingProvider: Address,
  operator: Address
): OperatorUpdated {
  const operatorUpdatedEvent = changetype<OperatorUpdated>(newMockEvent())

  operatorUpdatedEvent.parameters = []

  operatorUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "stakingProvider",
      ethereum.Value.fromAddress(stakingProvider)
    )
  )
  operatorUpdatedEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )

  return operatorUpdatedEvent
}
