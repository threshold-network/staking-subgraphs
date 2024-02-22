import {
  assert,
  describe,
  test,
  beforeAll,
  afterAll,
  clearStore,
  beforeEach,
  afterEach,
} from "matchstick-as/assembly/index"
import { Address, BigInt } from "@graphprotocol/graph-ts"
import {
  createAuthorizationDecreaseApprovedEvent,
  createAuthorizationDecreaseRequestedEvent,
  createAuthorizationIncreasedEvent,
  createAuthorizationInvoluntaryDecreasedEvent,
  createStakedEvent,
  createToppedUpEvent,
  createUnstakedEvent,
} from "./staking-utils"
import {
  handleAuthorizationDecreaseApproved,
  handleAuthorizationDecreaseRequested,
  handleAuthorizationIncreased,
  handleAuthorizationInvoluntaryDecreased,
  handleStaked,
  handleToppedUp,
  handleUnstaked,
} from "../src/staking"

// stake events testing constants
const testStakeType = 2
const testOwner = "0x1111111111111111111111111111111111111111"
const testStProv = "0x2222222222222222222222222222222222222222"
const testBeneficiary = "0x3333333333333333333333333333333333333333"
const testAuthorizer = "0x4444444444444444444444444444444444444444"
const testAmount = 1000

// authorization events testing constants
const tacoAppAddr = "0x347cc7ede7e5517bd47d20620b2cf1b406edcf07"
const tbtcAddr = "0x46d52e41c2f300bc82217ce22b920c34995204eb"
const randomBeaconAddr = "0x5499f54b4a1cb4816eefcf78962040461be3d80b"
const testStProvAddr = "0x1111111111111111111111111111111111111111"
const testFromAmount = 0
const testToAmount = 1000

describe("Staking", () => {
  describe("Staked event", () => {
    beforeAll(() => {
      const stakedEvent = createStakedEvent(
        testStakeType,
        Address.fromString(testOwner),
        Address.fromString(testStProv),
        Address.fromString(testBeneficiary),
        Address.fromString(testAuthorizer),
        BigInt.fromI32(testAmount)
      )
      handleStaked(stakedEvent)
    })

    afterAll(() => {
      clearStore()
    })

    test("a new stake is created", () => {
      assert.entityCount("StakeData", 1)
      assert.fieldEquals("StakeData", testStProv, "owner", testOwner)
      assert.fieldEquals(
        "StakeData",
        testStProv,
        "beneficiary",
        testBeneficiary
      )
      assert.fieldEquals("StakeData", testStProv, "authorizer", testAuthorizer)
      assert.fieldEquals(
        "StakeData",
        testStProv,
        "stakedAmount",
        testAmount.toString()
      )
    })

    test("a 2nd stake is created", () => {
      const testStakeType2 = 0
      const testOwner2 = "0x5555555555555555555555555555555555555555"
      const testStProv2 = "0x6666666666666666666666666666666666666666"
      const testBeneficiary2 = "0x7777777777777777777777777777777777777777"
      const testAuthorizer2 = "0x8888888888888888888888888888888888888888"
      const testAmount2 = 5000

      const stakedEvent2 = createStakedEvent(
        testStakeType2,
        Address.fromString(testOwner2),
        Address.fromString(testStProv2),
        Address.fromString(testBeneficiary2),
        Address.fromString(testAuthorizer2),
        BigInt.fromI32(testAmount2)
      )
      handleStaked(stakedEvent2)

      assert.entityCount("StakeData", 2)
      assert.fieldEquals("StakeData", testStProv2, "owner", testOwner2)
      assert.fieldEquals(
        "StakeData",
        testStProv2,
        "beneficiary",
        testBeneficiary2
      )
      assert.fieldEquals(
        "StakeData",
        testStProv2,
        "authorizer",
        testAuthorizer2
      )
      assert.fieldEquals(
        "StakeData",
        testStProv2,
        "stakedAmount",
        testAmount2.toString()
      )
    })

    test("new Staked event with existing staking provider", () => {
      const testStakeType3 = 1
      const testOwner3 = "0x5555555555555555555555555555555555555555"
      const testBeneficiary3 = "0x7777777777777777777777777777777777777777"
      const testAuthorizer3 = "0x8888888888888888888888888888888888888888"
      const testAmount3 = 5000

      const stakedEvent3 = createStakedEvent(
        testStakeType3,
        Address.fromString(testOwner3),
        Address.fromString(testStProv),
        Address.fromString(testBeneficiary3),
        Address.fromString(testAuthorizer3),
        BigInt.fromI32(testAmount3)
      )
      handleStaked(stakedEvent3)

      assert.entityCount("StakeData", 2, "the number of entities should remain")
      assert.fieldEquals("StakeData", testStProv, "owner", testOwner3)
      assert.fieldEquals(
        "StakeData",
        testStProv,
        "beneficiary",
        testBeneficiary3
      )
      assert.fieldEquals("StakeData", testStProv, "authorizer", testAuthorizer3)
      assert.fieldEquals(
        "StakeData",
        testStProv,
        "stakedAmount",
        testAmount3.toString()
      )
    })
  })

  describe("ToppedUp and Unstaked events", () => {
    beforeAll(() => {
      const stakedEvent = createStakedEvent(
        testStakeType,
        Address.fromString(testOwner),
        Address.fromString(testStProv),
        Address.fromString(testBeneficiary),
        Address.fromString(testAuthorizer),
        BigInt.fromI32(testAmount)
      )
      handleStaked(stakedEvent)
    })

    afterAll(() => {
      clearStore()
    })

    test("a new toppedUp event is received", () => {
      const toppedUpEvent = createToppedUpEvent(
        Address.fromString(testStProv),
        BigInt.fromI32(testAmount)
      )
      handleToppedUp(toppedUpEvent)

      assert.entityCount("StakeData", 1, "the number of entities should remain")
      assert.fieldEquals("StakeData", testStProv, "owner", testOwner)
      assert.fieldEquals(
        "StakeData",
        testStProv,
        "stakedAmount",
        (testAmount * 2).toString()
      )
    })

    test("a new unstaked event is received", () => {
      const unstakedEvent = createUnstakedEvent(
        Address.fromString(testStProv),
        BigInt.fromI32(testAmount)
      )
      handleUnstaked(unstakedEvent)

      assert.entityCount("StakeData", 1)
      assert.fieldEquals("StakeData", testStProv, "owner", testOwner)
      assert.fieldEquals(
        "StakeData",
        testStProv,
        "stakedAmount",
        testAmount.toString()
      )
    })
  })
})

describe("StakeHistory", () => {
  beforeAll(() => {
    const stakedEvent = createStakedEvent(
      testStakeType,
      Address.fromString(testOwner),
      Address.fromString(testStProv),
      Address.fromString(testBeneficiary),
      Address.fromString(testAuthorizer),
      BigInt.fromI32(testAmount)
    )
    handleStaked(stakedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  test("a new staked event is received", () => {
    const id = testStProv + "-" + "1"
    assert.fieldEquals("StakeHistory", id, "stake", testStProv)
    assert.fieldEquals("StakeHistory", id, "eventAmount", testAmount.toString())
    assert.fieldEquals(
      "StakeHistory",
      id,
      "stakedAmount",
      testAmount.toString()
    )
    assert.fieldEquals("StakeHistory", id, "eventType", "Staked")
  })

  test("a new toppedUp event is received", () => {
    const toppedUpEvent = createToppedUpEvent(
      Address.fromString(testStProv),
      BigInt.fromI32(testAmount)
    )
    handleToppedUp(toppedUpEvent)
    const id = testStProv + "-" + "1"
    assert.fieldEquals("StakeHistory", id, "stake", testStProv)
    assert.fieldEquals("StakeHistory", id, "eventAmount", testAmount.toString())
    assert.fieldEquals(
      "StakeHistory",
      id,
      "stakedAmount",
      (testAmount * 2).toString()
    )
    assert.fieldEquals("StakeHistory", id, "eventType", "ToppedUp")
  })

  test("a new unstaked event is received", () => {
    const unstakedEvent = createUnstakedEvent(
      Address.fromString(testStProv),
      BigInt.fromI32(testAmount)
    )
    handleUnstaked(unstakedEvent)
    const id = testStProv + "-" + "1"
    assert.entityCount("StakeHistory", 1)
    assert.fieldEquals("StakeHistory", id, "stake", testStProv)
    assert.fieldEquals("StakeHistory", id, "eventAmount", testAmount.toString())
    assert.fieldEquals(
      "StakeHistory",
      id,
      "stakedAmount",
      testAmount.toString()
    )
    assert.fieldEquals("StakeHistory", id, "eventType", "Unstaked")
  })
})

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
        "amountDeauthorizing",
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
      assert.fieldEquals("AppAuthorization", id, "amountDeauthorizing", "0")
      assert.fieldEquals("AppAuthorization", id, "appName", "TACo")
    })
  })

  describe("AuthorizationDecreaseApproved event", () => {
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

    test("authorization for the application is lowered when event received", () => {
      const stakingProvider = Address.fromString(testStProvAddr)
      const tacoApp = Address.fromString(tacoAppAddr)
      const fromAmount = BigInt.fromI32(testToAmount)
      const toAmount = BigInt.fromI32(100)

      const authorizationDecreaseApprovedEvent =
        createAuthorizationDecreaseApprovedEvent(
          stakingProvider,
          tacoApp,
          fromAmount,
          toAmount
        )
      handleAuthorizationDecreaseApproved(authorizationDecreaseApprovedEvent)

      const id = testStProvAddr + "-" + tacoAppAddr
      assert.entityCount("AppAuthorization", 1)
      assert.fieldEquals("AppAuthorization", id, "appAddress", tacoAppAddr)
      assert.fieldEquals("AppAuthorization", id, "stake", testStProvAddr)
      assert.fieldEquals("AppAuthorization", id, "amount", toAmount.toString())
      assert.fieldEquals("AppAuthorization", id, "amountDeauthorizing", "0")
      assert.fieldEquals("AppAuthorization", id, "appName", "TACo")
    })
  })

  describe("AuthorizationDecreaseRequested event", () => {
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

    test("deauthorizationAmount for the application is increased when event received", () => {
      const stakingProvider = Address.fromString(testStProvAddr)
      const tacoApp = Address.fromString(tacoAppAddr)
      const fromAmount = BigInt.fromI32(testToAmount)
      const toAmount = BigInt.fromI32(100)

      const authorizationDecreaseRequestedEvent =
        createAuthorizationDecreaseRequestedEvent(
          stakingProvider,
          tacoApp,
          fromAmount,
          toAmount
        )
      handleAuthorizationDecreaseRequested(authorizationDecreaseRequestedEvent)

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
        "amountDeauthorizing",
        fromAmount.minus(toAmount).toString()
      )
      assert.fieldEquals("AppAuthorization", id, "appName", "TACo")
    })
  })

  describe("AuthorizationInvoluntaryDecreased event", () => {
    beforeEach(() => {
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

    afterEach(() => {
      clearStore()
    })

    test("authorization decrease when event is received", () => {
      const stakingProvider = Address.fromString(testStProvAddr)
      const tacoApp = Address.fromString(tacoAppAddr)
      const fromAmount = BigInt.fromI32(testToAmount)
      const toAmount = BigInt.fromI32(100)

      const authorizationInvoluntaryDecreasedEvent =
        createAuthorizationInvoluntaryDecreasedEvent(
          stakingProvider,
          tacoApp,
          fromAmount,
          toAmount
        )
      handleAuthorizationInvoluntaryDecreased(
        authorizationInvoluntaryDecreasedEvent
      )

      const id = testStProvAddr + "-" + tacoAppAddr
      assert.entityCount("AppAuthorization", 1)
      assert.fieldEquals("AppAuthorization", id, "appAddress", tacoAppAddr)
      assert.fieldEquals("AppAuthorization", id, "stake", testStProvAddr)
      assert.fieldEquals("AppAuthorization", id, "amount", toAmount.toString())
      assert.fieldEquals("AppAuthorization", id, "amountDeauthorizing", "0")
      assert.fieldEquals("AppAuthorization", id, "appName", "TACo")
    })

    test("if there is a deauthorization requested, amountDeauthorizing is decreased accordingly", () => {
      const stakingProvider = Address.fromString(testStProvAddr)
      const tacoApp = Address.fromString(tacoAppAddr)
      const fromAmount = BigInt.fromI32(testToAmount)
      const toAmountRequested = BigInt.fromI32(500)
      const toAmountInvoluntaryDecreased = BigInt.fromI32(200)

      const authorizationDecreaseRequestedEvent =
        createAuthorizationDecreaseRequestedEvent(
          stakingProvider,
          tacoApp,
          fromAmount,
          toAmountRequested
        )
      handleAuthorizationDecreaseRequested(authorizationDecreaseRequestedEvent)

      // Now, we have a pending deauthorization that will set the authorization
      // amount to 500

      const authorizationInvoluntaryDecreasedEvent =
        createAuthorizationInvoluntaryDecreasedEvent(
          stakingProvider,
          tacoApp,
          fromAmount,
          toAmountInvoluntaryDecreased
        )
      handleAuthorizationInvoluntaryDecreased(
        authorizationInvoluntaryDecreasedEvent
      )

      // But now, we have decreased the current authorization amount to 200

      const id = testStProvAddr + "-" + tacoAppAddr
      assert.fieldEquals("AppAuthorization", id, "appAddress", tacoAppAddr)
      assert.fieldEquals("AppAuthorization", id, "stake", testStProvAddr)
      assert.fieldEquals(
        "AppAuthorization",
        id,
        "amount",
        toAmountInvoluntaryDecreased.toString()
      )
      assert.fieldEquals(
        "AppAuthorization",
        id,
        "amountDeauthorizing",
        toAmountInvoluntaryDecreased.toString(),
        "the deauthorizingTo amount must be set accordingly"
      )
      assert.fieldEquals("AppAuthorization", id, "appName", "TACo")
    })
  })
})

describe("Application authorization history", () => {
  afterAll(() => {
    clearStore()
  })

  test("a new AppAuthHistory is created with AuthorizationIncreased event", () => {
    const stakingProvider = Address.fromString(testStProvAddr)
    const tacoApp = Address.fromString(tacoAppAddr)
    const fromAmount = BigInt.fromI32(100)
    const toAmount = BigInt.fromI32(500)

    const authorizationIncreasedEvent = createAuthorizationIncreasedEvent(
      stakingProvider,
      tacoApp,
      fromAmount,
      toAmount
    )
    handleAuthorizationIncreased(authorizationIncreasedEvent)

    const id =
      stakingProvider.toHexString() + "-" + tacoApp.toHexString() + "-1"
    assert.entityCount("AppAuthHistory", 1)
    assert.fieldEquals(
      "AppAuthHistory",
      id,
      "appAuthorization",
      stakingProvider.toHexString() + "-" + tacoApp.toHexString()
    )
    assert.fieldEquals("AppAuthHistory", id, "amount", toAmount.toString())
    assert.fieldEquals(
      "AppAuthHistory",
      id,
      "eventAmount",
      toAmount.minus(fromAmount).toString()
    )
    assert.fieldEquals(
      "AppAuthHistory",
      id,
      "eventType",
      "AuthorizationIncreased"
    )
  })

  test("a new AppAuthHistory is created with AuthorizationDecreaseApproved event", () => {
    const stakingProvider = Address.fromString(testStProvAddr)
    const tacoApp = Address.fromString(tacoAppAddr)
    const fromAmount = BigInt.fromI32(500)
    const toAmount = BigInt.fromI32(100)

    const authorizationDecreaseApprovedEvent =
      createAuthorizationDecreaseApprovedEvent(
        stakingProvider,
        tacoApp,
        fromAmount,
        toAmount
      )
    handleAuthorizationDecreaseApproved(authorizationDecreaseApprovedEvent)

    const id =
      stakingProvider.toHexString() + "-" + tacoApp.toHexString() + "-1"
    assert.fieldEquals(
      "AppAuthHistory",
      id,
      "appAuthorization",
      stakingProvider.toHexString() + "-" + tacoApp.toHexString()
    )
    assert.fieldEquals("AppAuthHistory", id, "amount", toAmount.toString())
    assert.fieldEquals(
      "AppAuthHistory",
      id,
      "eventAmount",
      fromAmount.minus(toAmount).toString()
    )
    assert.fieldEquals(
      "AppAuthHistory",
      id,
      "eventType",
      "AuthorizationDecreaseApproved"
    )
  })

  test("a new AppAuthHistory is created with AuthorizationInvoluntaryDecreased event", () => {
    const stakingProvider = Address.fromString(testStProvAddr)
    const tacoApp = Address.fromString(tacoAppAddr)
    const fromAmount = BigInt.fromI32(500)
    const toAmount = BigInt.fromI32(100)

    const authorizationInvoluntaryDecreasedEvent =
      createAuthorizationInvoluntaryDecreasedEvent(
        stakingProvider,
        tacoApp,
        fromAmount,
        toAmount
      )
    handleAuthorizationInvoluntaryDecreased(
      authorizationInvoluntaryDecreasedEvent
    )

    const id =
      stakingProvider.toHexString() + "-" + tacoApp.toHexString() + "-1"
    assert.fieldEquals(
      "AppAuthHistory",
      id,
      "appAuthorization",
      stakingProvider.toHexString() + "-" + tacoApp.toHexString()
    )
    assert.fieldEquals("AppAuthHistory", id, "amount", toAmount.toString())
    assert.fieldEquals(
      "AppAuthHistory",
      id,
      "eventAmount",
      fromAmount.minus(toAmount).toString()
    )
    assert.fieldEquals(
      "AppAuthHistory",
      id,
      "eventType",
      "AuthorizationInvoluntaryDecreased"
    )
  })
})
