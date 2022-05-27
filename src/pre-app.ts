import { OperatorConfirmed } from "../generated/SimplePREApplication/SimplePREApplication";
import { StakeData, EpochStake } from "../generated/schema";
import { getEpochCount, getEpochStakeId } from "./utils";

export function handleOperatorConfirmed(event: OperatorConfirmed): void {
  const stakingProvider = event.params.stakingProvider;
  const operator = event.params.operator;
  const stakeData = StakeData.load(stakingProvider.toHexString());
  if (stakeData) {
    stakeData.operator = operator;
    stakeData.save();
  }
  const epochCount = getEpochCount() - 1;
  const epochStakeId = getEpochStakeId(stakingProvider, epochCount);
  const epochStake = EpochStake.load(epochStakeId);
  if (epochStake) {
    epochStake.operator = operator;
    epochStake.save();
  }
}
