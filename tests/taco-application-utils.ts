import { newMockEvent, newMockEventWithParams } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import { OperatorBonded } from "../generated/TACoApplication/TACoApplication"

export function createOperatorBondedEvent(
  stakingProvider: Address,
  operator: Address,
  previousOperator: Address,
  startTimestamp: BigInt
): OperatorBonded {
  const operatorBondedEvent = changetype<OperatorBonded>(newMockEvent())

  operatorBondedEvent.parameters = []

  operatorBondedEvent.parameters.push(
    new ethereum.EventParam(
      "stakingProvider",
      ethereum.Value.fromAddress(stakingProvider)
    )
  )
  operatorBondedEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  operatorBondedEvent.parameters.push(
    new ethereum.EventParam(
      "previousOperator",
      ethereum.Value.fromAddress(previousOperator)
    )
  )
  operatorBondedEvent.parameters.push(
    new ethereum.EventParam(
      "startTimestamp",
      ethereum.Value.fromUnsignedBigInt(startTimestamp)
    )
  )

  return operatorBondedEvent
}
