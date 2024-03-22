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
  createCommitmentMadeEvent,
  createOperatorBondedEvent,
} from "./taco-application-utils"
import {
  handleCommitmentMade,
  handleOperatorBonded,
} from "../src/taco-application"

const firstStakingProviderAddr = "0x1111111111111111111111111111111111111111"
const firstOperatorAddr = "0x2222222222222222222222222222222222222222"
const firstPreviousOperatorAddr = "0x0000000000000000000000000000000000000000"
const firstBondedTimestamp = 1704067200

describe("TACo operators", () => {
  describe("OperatorBonded event", () => {
    beforeAll(() => {
      const stakingProvider = Address.fromString(firstStakingProviderAddr)
      const operator = Address.fromString(firstOperatorAddr)
      const previousOperator = Address.fromString(firstPreviousOperatorAddr)
      const timestamp = BigInt.fromI32(firstBondedTimestamp)

      const operatorBondedEvent = createOperatorBondedEvent(
        stakingProvider,
        operator,
        previousOperator,
        timestamp
      )
      handleOperatorBonded(operatorBondedEvent)
    })

    afterAll(() => {
      clearStore()
    })

    test("a first operator is created when operatorBonded event", () => {
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
        "bondedTimestamp",
        firstBondedTimestamp.toString()
      )
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "bondedTimestampFirstOperator",
        firstBondedTimestamp.toString()
      )
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "confirmed",
        "false"
      )
    })

    test("bondedTimestamp is updated when operatorBonded event for the same staking provider", () => {
      const stakingProvider = Address.fromString(firstStakingProviderAddr)
      const operator = Address.fromString(
        "0x3333333333333333333333333333333333333333"
      )
      const previousOperator = Address.fromString(firstOperatorAddr)
      const timestamp = BigInt.fromI32(firstBondedTimestamp + 10)

      const operatorBondedEvent = createOperatorBondedEvent(
        stakingProvider,
        operator,
        previousOperator,
        timestamp
      )

      handleOperatorBonded(operatorBondedEvent)

      assert.entityCount("TACoOperator", 1)
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "operator",
        operator.toHexString()
      )
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "bondedTimestamp",
        timestamp.toString()
      )
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "bondedTimestampFirstOperator",
        firstBondedTimestamp.toString()
      )
      assert.fieldEquals(
        "TACoOperator",
        firstStakingProviderAddr,
        "confirmed",
        "false"
      )
    })

    test("a new operator is created when new operatorBonded event", () => {
      const stakingProvider = Address.fromString(
        "0x0000000000000000000000000000000000000004"
      )
      const operator = Address.fromString(
        "0x0000000000000000000000000000000000000005"
      )
      const previousOperator = Address.fromString(firstOperatorAddr)
      const timestamp = BigInt.fromI32(firstBondedTimestamp)

      const operatorBondedEvent = createOperatorBondedEvent(
        stakingProvider,
        operator,
        previousOperator,
        timestamp
      )

      handleOperatorBonded(operatorBondedEvent)

      assert.entityCount("TACoOperator", 2)
    })
  })

  describe("OperatorConfirmed event", () => {
    beforeAll(() => {
      const stakingProvider = Address.fromString(firstStakingProviderAddr)
      const operator = Address.fromString(firstOperatorAddr)
      const previousOperator = Address.fromString(firstPreviousOperatorAddr)
      const timestamp = BigInt.fromI32(firstBondedTimestamp)

      const operatorBondedEvent = createOperatorBondedEvent(
        stakingProvider,
        operator,
        previousOperator,
        timestamp
      )
      handleOperatorBonded(operatorBondedEvent)
    })

    afterAll(() => {
      clearStore()
    })
  })
})

describe("TACo commitments", () => {
  afterAll(() => {
    clearStore()
  })

  test("a new TACo commitment is made for 3 months", () => {
    const stakingProv = Address.fromString(
      "0x1111111111111111111111111111111111111111"
    )
    // timestamp of the events mocked is "1"
    const endCommitment = BigInt.fromI32(7862400 + 1)
    const commitmentMadeEvent = createCommitmentMadeEvent(
      stakingProv,
      endCommitment
    )
    handleCommitmentMade(commitmentMadeEvent)
    assert.entityCount("TACoCommitment", 1)
    assert.fieldEquals(
      "TACoCommitment",
      stakingProv.toHexString(),
      "endCommitment",
      endCommitment.toString()
    )
    assert.fieldEquals(
      "TACoCommitment",
      stakingProv.toHexString(),
      "duration",
      "3"
    )
  })

  test("a new TACo commitment is made for 6 months", () => {
    const stakingProv = Address.fromString(
      "0x2222222222222222222222222222222222222222"
    )
    // timestamp of the events mocked is "1"
    const endCommitment = BigInt.fromI32(15724800 + 1)
    const commitmentMadeEvent = createCommitmentMadeEvent(
      stakingProv,
      endCommitment
    )
    handleCommitmentMade(commitmentMadeEvent)
    assert.entityCount("TACoCommitment", 2)
    assert.fieldEquals(
      "TACoCommitment",
      stakingProv.toHexString(),
      "endCommitment",
      endCommitment.toString()
    )
    assert.fieldEquals(
      "TACoCommitment",
      stakingProv.toHexString(),
      "duration",
      "6"
    )
  })

  test("a new TACo commitment is made for 12 months", () => {
    const stakingProv = Address.fromString(
      "0x3333333333333333333333333333333333333333"
    )
    // timestamp of the events mocked is "1"
    const endCommitment = BigInt.fromI32(31449600 + 1)
    const commitmentMadeEvent = createCommitmentMadeEvent(
      stakingProv,
      endCommitment
    )
    handleCommitmentMade(commitmentMadeEvent)
    assert.entityCount("TACoCommitment", 3)
    assert.fieldEquals(
      "TACoCommitment",
      stakingProv.toHexString(),
      "endCommitment",
      endCommitment.toString()
    )
    assert.fieldEquals(
      "TACoCommitment",
      stakingProv.toHexString(),
      "duration",
      "12"
    )
  })

  test("a new TACo commitment is made for 18 months", () => {
    const stakingProv = Address.fromString(
      "0x4444444444444444444444444444444444444444"
    )
    // timestamp of the events mocked is "1"
    const endCommitment = BigInt.fromI32(47174400 + 1)
    const commitmentMadeEvent = createCommitmentMadeEvent(
      stakingProv,
      endCommitment
    )
    handleCommitmentMade(commitmentMadeEvent)
    assert.entityCount("TACoCommitment", 4)
    assert.fieldEquals(
      "TACoCommitment",
      stakingProv.toHexString(),
      "endCommitment",
      endCommitment.toString()
    )
    assert.fieldEquals(
      "TACoCommitment",
      stakingProv.toHexString(),
      "duration",
      "18"
    )
  })
})
