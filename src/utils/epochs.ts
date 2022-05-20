import { BigInt } from "@graphprotocol/graph-ts";
import { Epoch, EpochCounter } from "../../generated/schema";

const STAKING_CONTRACT_DEPLOY_TIMESTAMP = 1643633638;
const EPOCH_COUNTER_ID = "epoch-counter";

export function getEpochStakeId(stakingProvider: string): string {
  const epochCount = getEpochCount();
  return `${stakingProvider}-${epochCount}`;
}

export function getOrCreateLastEpoch(): Epoch {
  const epochCount = getEpochCount();
  const lastEpochId = (epochCount - 1).toString();
  let lastEpoch = Epoch.load(lastEpochId);
  if (!lastEpoch) {
    lastEpoch = new Epoch("0");
    lastEpoch.timestamp = BigInt.fromI32(STAKING_CONTRACT_DEPLOY_TIMESTAMP);
    lastEpoch.totalAmount = BigInt.zero();
    lastEpoch.save();
    increaseEpochCount();
  }

  return lastEpoch;
}

export function getEpochCount(): i32 {
  let epochCounter = EpochCounter.load(EPOCH_COUNTER_ID);
  if (!epochCounter) {
    epochCounter = new EpochCounter(EPOCH_COUNTER_ID);
    epochCounter.count = 0;
    epochCounter.save();
  }

  return epochCounter.count;
}

export function increaseEpochCount(): void {
  let epochCounter = EpochCounter.load(EPOCH_COUNTER_ID);
  if (!epochCounter) {
    epochCounter = new EpochCounter(EPOCH_COUNTER_ID);
    epochCounter.count = 0;
  }
  epochCounter.count++;
  epochCounter.save();
}
