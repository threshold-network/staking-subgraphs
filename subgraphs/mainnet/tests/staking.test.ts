import {
  assert,
  describe,
  test,
  beforeAll,
  afterAll,
  clearStore,
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import { createAuthorizationIncreasedEvent } from "./staking-utils"
import { handleAuthorizationIncreased } from "../src/staking"

const tacoAppAddr = "0x347cc7ede7e5517bd47d20620b2cf1b406edcf07"
const tbtcAddr = "0x46d52e41c2f300bc82217ce22b920c34995204eb"
const randomBeaconAddr = "0x5499f54b4a1cb4816eefcf78962040461be3d80b"
const testStProvAddr = "0x1111111111111111111111111111111111111111"
const testFromAmount = 0
const testToAmount = 1000

describe("Application authorizations", () => {
  describe("AuthorizationIncreased event", () => {
    beforeAll(() => {
      const stakingProvider = Address.fromString(testStProvAddr)
      const tacoApp = Address.fromString(tacoAppAddr)
      const fromAmount = BigInt.fromI32(testFromAmount)
      const toAmount = BigInt.fromI32(testToAmount)

      const authorizationIncreasedEvent = createAuthorizationIncreasedEvent(
        stakingProvider,
        tacoApp,
        fromAmount,
        toAmount
      )
      handleAuthorizationIncreased(authorizationIncreasedEvent)
    })

    afterAll(() => {
      clearStore()
    })

    test("a new AppAuthorization is created when AuthorizationIncreased for first time", () => {
      const id = testStProvAddr + "-" + tacoAppAddr
      assert.entityCount("AppAuthorization", 1)
      assert.fieldEquals("AppAuthorization", id, "appAddress", tacoAppAddr)
      assert.fieldEquals("AppAuthorization", id, "stake", testStProvAddr)
      assert.fieldEquals(
        "AppAuthorization",
        id,
        "amount",
        testToAmount.toString()
      )
      assert.fieldEquals(
        "AppAuthorization",
        id,
        "amountDeauthorizingTo",
        testFromAmount.toString()
      )
      assert.fieldEquals("AppAuthorization", id, "appName", "TACo")
    })

    test("a new AppAuthorization is created for RandomBeacon", () => {
      const stakingProvider = Address.fromString(testStProvAddr)
      const app = Address.fromString(randomBeaconAddr)
      const fromAmount = BigInt.fromI32(testFromAmount)
      const toAmount = BigInt.fromI32(testToAmount)

      const authorizationIncreasedEvent = createAuthorizationIncreasedEvent(
        stakingProvider,
        app,
        fromAmount,
        toAmount
      )
      handleAuthorizationIncreased(authorizationIncreasedEvent)

      const id = stakingProvider.toHexString() + "-" + app.toHexString()
      assert.entityCount("AppAuthorization", 2)
      assert.fieldEquals("AppAuthorization", id, "appName", "Random Beacon")
    })

    test("a new AppAuthorization is created for tBTC", () => {
      const stakingProvider = Address.fromString(testStProvAddr)
      const app = Address.fromString(tbtcAddr)
      const fromAmount = BigInt.fromI32(testFromAmount)
      const toAmount = BigInt.fromI32(testToAmount)

      const authorizationIncreasedEvent = createAuthorizationIncreasedEvent(
        stakingProvider,
        app,
        fromAmount,
        toAmount
      )
      handleAuthorizationIncreased(authorizationIncreasedEvent)

      const id = stakingProvider.toHexString() + "-" + app.toHexString()
      assert.entityCount("AppAuthorization", 3)
      assert.fieldEquals("AppAuthorization", id, "appName", "tBTC")
    })

    test("an existing AppAuthorization is updated when AuthorizationIncreased", () => {
      const stakingProvider = Address.fromString(testStProvAddr)
      const tacoApp = Address.fromString(tacoAppAddr)
      const fromAmount = BigInt.fromI32(testToAmount)
      const toAmount = BigInt.fromI32(2000)

      const authorizationIncreasedEvent = createAuthorizationIncreasedEvent(
        stakingProvider,
        tacoApp,
        fromAmount,
        toAmount
      )
      handleAuthorizationIncreased(authorizationIncreasedEvent)

      const id = testStProvAddr + "-" + tacoAppAddr
      assert.entityCount(
        "AppAuthorization",
        3,
        "we have updated an existing entity, so same number must remain"
      )
      assert.fieldEquals("AppAuthorization", id, "appAddress", tacoAppAddr)
      assert.fieldEquals("AppAuthorization", id, "stake", testStProvAddr)
      assert.fieldEquals("AppAuthorization", id, "amount", toAmount.toString())
      assert.fieldEquals("AppAuthorization", id, "amountDeauthorizingTo", "0")
      assert.fieldEquals("AppAuthorization", id, "appName", "TACo")
    })
  })
})
