import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  CommitmentMade,
  OperatorBonded,
  OperatorConfirmed,
} from "../generated/TACoApplication/TACoApplication"

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

export function createOperatorConfirmedEvent(
  stakingProvider: Address,
  operator: Address
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

  return operatorConfirmedEvent
}

export function createCommitmentMadeEvent(
  stakingProvider: Address,
  endCommitment: BigInt
): CommitmentMade {
  const commitmentMadeEvent = changetype<CommitmentMade>(newMockEvent())

  commitmentMadeEvent.parameters = []
  commitmentMadeEvent.parameters.push(
    new ethereum.EventParam(
      "stakingProvider",
      ethereum.Value.fromAddress(stakingProvider)
    )
  )
  commitmentMadeEvent.parameters.push(
    new ethereum.EventParam(
      "endCommitment",
      ethereum.Value.fromUnsignedBigInt(endCommitment)
    )
  )

  return commitmentMadeEvent
}
