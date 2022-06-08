import {
  OperatorBonded,
  OperatorConfirmed,
} from "../generated/SimplePREApplication/SimplePREApplication"
import { PREOperator } from "../generated/schema"

export function handleOperatorBonded(event: OperatorBonded): void {
  const preOperator = new PREOperator(
    event.params.stakingProvider.toHexString()
  )
  preOperator.operator = event.params.operator
  preOperator.save()
}

export function handleOperatorConfirmed(event: OperatorConfirmed): void {
  const preOperator = new PREOperator(
    event.params.stakingProvider.toHexString()
  )
  preOperator.operator = event.params.operator
  preOperator.confirmationTimestamp = event.block.timestamp
  preOperator.save()
}
