import { updateBlockHeights } from './proposalsToDb.js';
import { fetchLatestBlock } from '../Queries/blockQuery.js';
import { fetchProposals } from '../Queries/proposalQuery.js';
import { fetchVotes } from '../Queries/votesQuery.js';
import { fetchValidators } from '../Queries/validatorsQuery.js';
import { checkAndProcessVotes } from './correctWeight.js';


export const nodeDomain = 'https://lcd-archive.junonetwork.io/';
const getProposals = '/cosmos/gov/v1/proposals';
const getProposalsBeta = '/cosmos/gov/v1beta1/proposals';
const getBlocks = '/cosmos/base/tendermint/v1beta1/blocks';
const getVals = '/cosmos/staking/v1beta1/validators';
const startBlock =  4136532;
const latestBlock = await fetchLatestBlock(nodeDomain + getBlocks);
const propNumber = 31;
const block_height = 4076765;
//await fetchProposals(nodeDomain + getProposals);
//await updateBlockHeights(nodeDomain + getBlocks, startBlock, latestBlock, nodeDomain + getProposals, nodeDomain + getVals);
fetchValidators(nodeDomain + getBlocks, startBlock, latestBlock , nodeDomain + getVals, propNumber, block_height);
