import { Address } from "@graphprotocol/graph-ts"
import { store } from "@graphprotocol/graph-ts"
import {
  OperatorBonded as OperatorBondedEvent,
  OperatorConfirmed as OperatorConfirmedEvent,
} from "../generated/SimplePREApplication/SimplePREApplication"
import { SimplePREApplication } from "../generated/schema"

export function getOrCreatePreApplication(
  stakingProvider: Address
): SimplePREApplication {
  const preApplication = SimplePREApplication.load(
    stakingProvider.toHexString()
  )

  return !preApplication
    ? new SimplePREApplication(stakingProvider.toHexString())
    : preApplication
}

export function handleOperatorBonded(event: OperatorBondedEvent): void {
  const stakingProvider = event.params.stakingProvider
  const operator = event.params.operator
  const timestamp = event.params.startTimestamp

  const preApplication = getOrCreatePreApplication(stakingProvider)
  if (operator === Address.zero()) {
    store.remove("SimplePREApplication", stakingProvider.toHexString())
  } else {
    preApplication.operator = operator
    preApplication.stake = stakingProvider
    if (!preApplication.bondedTimestamp) {
      preApplication.bondedTimestamp = timestamp
    }
    preApplication.save()
  }
}

export function handleOperatorConfirmed(event: OperatorConfirmedEvent): void {
  const stakingProvider = event.params.stakingProvider
  const operator = event.params.operator
  const timestamp = event.block.timestamp

  const preApplication = getOrCreatePreApplication(stakingProvider)
  preApplication.operator = operator
  if (!preApplication.confirmedTimestamp) {
    preApplication.confirmedTimestamp = timestamp
  }
  preApplication.save()
}
