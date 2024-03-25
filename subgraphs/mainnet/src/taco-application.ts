import { Address, log } from "@graphprotocol/graph-ts"
import {
  OperatorBonded as OperatorBondedEvent,
  OperatorConfirmed as OperatorConfirmedEvent,
  CommitmentMade as CommitmentMadeEvent,
} from "../generated/TACoApplication/TACoApplication"
import { TACoOperator, TACoCommitment } from "../generated/schema"

function getOrCreateTACoOperator(stakingProvider: Address): TACoOperator {
  const tacoOperator = TACoOperator.load(stakingProvider.toHexString())
  return tacoOperator
    ? tacoOperator
    : new TACoOperator(stakingProvider.toHexString())
}

export function handleOperatorBonded(event: OperatorBondedEvent): void {
  const stakingProvider = event.params.stakingProvider
  const operator = event.params.operator
  const timestamp = event.params.startTimestamp

  const tacoOperator = getOrCreateTACoOperator(stakingProvider)
  tacoOperator.operator = operator
  tacoOperator.bondedTimestamp = timestamp
  if (!tacoOperator.bondedTimestampFirstOperator) {
    tacoOperator.bondedTimestampFirstOperator = timestamp
    tacoOperator.confirmed = false
  }
  tacoOperator.save()
}

export function handleOperatorConfirmed(event: OperatorConfirmedEvent): void {
  const stakingProvider = event.params.stakingProvider
  const operator = event.params.operator

  const tacoOperator = TACoOperator.load(stakingProvider.toHexString())
  if (!tacoOperator) {
    log.warning("Received an OperatorConfirmed event for unknown SP", [
      stakingProvider.toHexString(),
    ])
    return
  }

  tacoOperator.operator = operator
  tacoOperator.confirmed = true
  tacoOperator.save()
}

export function handleCommitmentMade(event: CommitmentMadeEvent): void {
  const commitment3Months = 7862400
  const commitment6Months = 15724800
  const commitment12Months = 31449600
  const commitment18Months = 47174400

  const endCommitment = event.params.endCommitment
  const eventTimestamp = event.block.timestamp
  const durationInSeconds = endCommitment.minus(eventTimestamp).toI32()

  let duration = 0
  if (durationInSeconds === commitment18Months) {
    duration = 18
  } else if (durationInSeconds === commitment12Months) {
    duration = 12
  } else if (durationInSeconds === commitment6Months) {
    duration = 6
  } else if (durationInSeconds === commitment3Months) {
    duration = 3
  }

  const tacoCommitment = new TACoCommitment(
    event.params.stakingProvider.toHexString()
  )
  tacoCommitment.endCommitment = endCommitment
  tacoCommitment.duration = duration
  tacoCommitment.save()
}
