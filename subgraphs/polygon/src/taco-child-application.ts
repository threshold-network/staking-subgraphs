import {
  OperatorConfirmed as OperatorConfirmedEvent,
  OperatorUpdated as OperatorUpdatedEvent,
} from "../generated/TACoChildApplication/TACoChildApplication"
import { TACoOperator } from "../generated/schema"

export function handleOperatorConfirmed(event: OperatorConfirmedEvent): void {
  const stakingProvider = event.params.stakingProvider
  const operator = event.params.operator
  const timestamp = event.block.timestamp

  let tacoOperator = TACoOperator.load(stakingProvider.toHexString())
  if (!tacoOperator) {
    tacoOperator = new TACoOperator(stakingProvider.toHexString())
    tacoOperator.confirmedTimestampFirstOperator = timestamp
  }
  tacoOperator.operator = operator
  tacoOperator.confirmedTimestamp = timestamp
  tacoOperator.confirmed = true
  tacoOperator.save()
}

export function handleOperatorUpdated(event: OperatorUpdatedEvent): void {
  const stakingProvider = event.params.stakingProvider

  const tacoOperator = TACoOperator.load(stakingProvider.toHexString())
  if (tacoOperator) {
    tacoOperator.confirmed = false
    tacoOperator.save()
  }
}
