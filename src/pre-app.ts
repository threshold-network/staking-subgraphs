import {
  OperatorBonded,
  OperatorConfirmed,
} from "../generated/SimplePREApplication/SimplePREApplication"
import { PREOperator } from "../generated/schema"

export function handleOperatorBonded(event: OperatorBonded): void {
  const stakingProvider = event.params.stakingProvider
  const operator = event.params.operator
  const timestamp = event.params.startTimestamp

  const preApplication = getOrCreatePreApplication(stakingProvider)
  if (operator === Address.zero()) {
    store.remove("SimplePREApplication", stakingProvider.toHexString())
  } else {
    preApplication.operator = operator
    preApplication.stake = stakingProvider.toHexString()
    preApplication.bondedTimestamp = timestamp.plus(BigInt.fromString("12"))
    preApplication.save()
  }
}

export function handleOperatorConfirmed(event: OperatorConfirmed): void {
  const stakingProvider = event.params.stakingProvider
  const operator = event.params.operator
  const timestamp = event.block.timestamp

  const preApplication = getOrCreatePreApplication(stakingProvider)
  preApplication.operator = operator
  preApplication.confirmedTimestamp = timestamp
  preApplication.save()
}

