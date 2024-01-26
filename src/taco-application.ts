import { Address } from "@graphprotocol/graph-ts"
import {
  OperatorBonded as OperatorBondedEvent,
  OperatorConfirmed as OperatorConfirmedEvent,
} from "../generated/TACoApplication/TACoApplication"
import { TACoOperator } from "../generated/schema"
import { log } from "@graphprotocol/graph-ts"

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
  }
  tacoOperator.save()
}

export function handleOperatorConfirmed(event: OperatorConfirmedEvent): void {
  const stakingProvider = event.params.stakingProvider
  const operator = event.params.operator
  const timestamp = event.block.timestamp

  const tacoOperator = TACoOperator.load(stakingProvider.toHexString())
  if (tacoOperator) {
    tacoOperator.operator = operator
    tacoOperator.confirmedTimestamp = timestamp
    if (!tacoOperator.confirmedTimestampFirstOperator) {
      tacoOperator.confirmedTimestampFirstOperator = timestamp
    }
    tacoOperator.save()
  } else {
    log.warning(
      "Received OperatorConfirmed for a non existent staking provider. TX: {}",
      [event.transaction.hash.toHexString()]
    )
  }
}
