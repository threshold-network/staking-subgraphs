import { Address } from "@graphprotocol/graph-ts"
import { SimplePREApplication } from "../../generated/schema"

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
