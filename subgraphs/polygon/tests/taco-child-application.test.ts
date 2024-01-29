import {
  assert,
  describe,
  test,
  beforeAll,
  afterAll,
  clearStore,
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import {
  createOperatorConfirmedEvent,
  createOperatorUpdatedEvent,
} from "./taco-child-application-utils"
import {
  handleOperatorConfirmed,
  handleOperatorUpdated,
} from "../src/taco-child-application"

const firstStakingProviderAddr = "0x1111111111111111111111111111111111111111"
const firstOperatorAddr = "0x2222222222222222222222222222222222222222"
const firstConfirmedTimestamp = 1704067200

describe("TACo operators", () => {
  describe("OperatorConfirmed event", () => {
    beforeAll(() => {
      const stakingProvider = Address.fromString(firstStakingProviderAddr)
      const operator = Address.fromString(firstOperatorAddr)
      const confirmedTimestamp = BigInt.fromI32(firstConfirmedTimestamp)

      const operatorConfirmedEvent = createOperatorConfirmedEvent(
        stakingProvider,
        operator,
        confirmedTimestamp
      )
      handleOperatorConfirmed(operatorConfirmedEvent)
    })

    afterAll(() => {
      clearStore()
    })

    test("a first operator is created when operatorConfirmed event", () => {
      assert.entityCount("TACoOperator", 1)
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "operator",
        firstOperatorAddr
      )
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "confirmedTimestamp",
        firstConfirmedTimestamp.toString()
      )
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "confirmedTimestampFirstOperator",
        firstConfirmedTimestamp.toString()
      )
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "active",
        "true"
      )
    })

    test("operator is updated when new operatorConfirmed event for same stake", () => {
      const stakingProvider = Address.fromString(firstStakingProviderAddr)
      const operator = Address.fromString(
        "0x4444444444444444444444444444444444444444"
      )
      const timestamp = BigInt.fromI32(firstConfirmedTimestamp + 10)

      const operatorConfirmedEvent = createOperatorConfirmedEvent(
        stakingProvider,
        operator,
        timestamp
      )
      handleOperatorConfirmed(operatorConfirmedEvent)

      assert.entityCount(
        "TACoOperator",
        1,
        "we have updated an existing entity, so number must remain"
      )
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "operator",
        operator.toHexString()
      )
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "confirmedTimestamp",
        timestamp.toString()
      )
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "confirmedTimestampFirstOperator",
        firstConfirmedTimestamp.toString()
      )
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "active",
        "true"
      )
    })

    test("operator is active when operatorConfirmed even after OperatorUpdated", () => {
      const stakingProvider = Address.fromString(firstStakingProviderAddr)
      const operator = Address.fromString(
        "0x5555555555555555555555555555555555555555"
      )
      const timestamp = BigInt.fromI32(firstConfirmedTimestamp + 20)

      const operatorUpdatedEvent = createOperatorUpdatedEvent(
        stakingProvider,
        operator
      )
      handleOperatorUpdated(operatorUpdatedEvent)

      const operatorConfirmedEvent = createOperatorConfirmedEvent(
        stakingProvider,
        operator,
        timestamp
      )
      handleOperatorConfirmed(operatorConfirmedEvent)

      assert.entityCount(
        "TACoOperator",
        1,
        "we have updated an existing entity, so number must remain"
      )
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "operator",
        operator.toHexString()
      )
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "confirmedTimestamp",
        timestamp.toString()
      )
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "confirmedTimestampFirstOperator",
        firstConfirmedTimestamp.toString()
      )
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "active",
        "true"
      )
    })

    test("a new operator is created when new operatorConfirmed event", () => {
      const stakingProvider = Address.fromString(
        "0x6666666666666666666666666666666666666666"
      )
      const operator = Address.fromString(
        "0x7777777777777777777777777777777777777777"
      )
      const timestamp = BigInt.fromI32(firstConfirmedTimestamp + 30)

      const operatorConfirmedEvent = createOperatorConfirmedEvent(
        stakingProvider,
        operator,
        timestamp
      )
      handleOperatorConfirmed(operatorConfirmedEvent)

      assert.entityCount("TACoOperator", 2)
      assert.fieldEquals(
        "TACoOperator",
        stakingProvider.toHexString(),
        "operator",
        operator.toHexString()
      )
      assert.fieldEquals(
        "TACoOperator",
        stakingProvider.toHexString(),
        "confirmedTimestamp",
        timestamp.toString()
      )
      assert.fieldEquals(
        "TACoOperator",
        stakingProvider.toHexString(),
        "confirmedTimestampFirstOperator",
        timestamp.toString()
      )
    })
  })

  describe("OperatorUpdated event", () => {
    beforeAll(() => {
      const stakingProvider = Address.fromString(firstStakingProviderAddr)
      const operator = Address.fromString(firstOperatorAddr)

      const operatorUpdatedEvent = createOperatorUpdatedEvent(
        stakingProvider,
        operator
      )
      handleOperatorUpdated(operatorUpdatedEvent)
    })

    afterAll(() => {
      clearStore()
    })

    test("operator is inactive when OperatorUpdated event", () => {
      const stakingProvider = Address.fromString(firstStakingProviderAddr)
      const operator = Address.fromString(
        "0x2222222222222222222222222222222222222222"
      )
      const confirmedTimestamp = BigInt.fromI32(firstConfirmedTimestamp)

      const operatorConfirmedEvent = createOperatorConfirmedEvent(
        stakingProvider,
        operator,
        confirmedTimestamp
      )
      handleOperatorConfirmed(operatorConfirmedEvent)

      const operatorUpdatedEvent = createOperatorUpdatedEvent(
        stakingProvider,
        operator
      )
      handleOperatorUpdated(operatorUpdatedEvent)

      assert.entityCount(
        "TACoOperator",
        1,
        "we have updated an existing entity, so number must remain"
      )
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "operator",
        operator.toHexString()
      )
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "confirmedTimestamp",
        firstConfirmedTimestamp.toString()
      )
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "confirmedTimestampFirstOperator",
        firstConfirmedTimestamp.toString()
      )
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "active",
        "false"
      )
    })
  })
})
