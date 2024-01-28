import { Address } from "@graphprotocol/graph-ts"
import { OperatorBonded as OperatorBondedEvent } from "../generated/TACoApplication/TACoApplication"
import { TACoOperator } from "../generated/schema"

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
