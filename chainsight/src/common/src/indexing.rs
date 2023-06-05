use candid::{CandidType, Deserialize};
use ic_stable_memory::derive::{CandidAsDynSizeBytes, StableType};

use crate::config::TokenConfig;

#[derive(
    CandidType, Debug, Clone, PartialEq, PartialOrd, Deserialize, StableType, CandidAsDynSizeBytes,
)]
pub struct IndexingConfig {
    pub config: TokenConfig,
    pub batch_sync_start_from: u64,
}

impl IndexingConfig {
    pub fn new(config: TokenConfig, start_from: u64) -> Self {
        Self {
            config,
            batch_sync_start_from: start_from,
        }
    }
    pub fn indexing_start_from(&self) -> u64 {
        self.batch_sync_start_from
    }
    pub fn address(&self) -> &str {
        self.config.address()
    }

    pub fn deployed_block(&self) -> u64 {
        self.config.contract_craeted_block_number()
    }
}
