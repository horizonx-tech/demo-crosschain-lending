use std::str::FromStr;

use candid::{CandidType, Deserialize, Nat, Principal};
use ic_stable_memory::derive::{CandidAsDynSizeBytes, StableType};
use ic_web3::ethabi::Log;
use ic_web3::types::{Log as EthLog, U256};
use network::network::SupportedNetwork;
#[derive(
    CandidType, Debug, Clone, PartialEq, PartialOrd, Deserialize, StableType, CandidAsDynSizeBytes,
)]
pub struct TransferEvent {
    pub hash: String,
    pub at: u64,
    pub block_number: u64,
    pub from: EthereumAddress,
    pub to: EthereumAddress,
    pub value: Nat,
}

#[derive(
    CandidType,
    Debug,
    Clone,
    PartialEq,
    PartialOrd,
    Deserialize,
    StableType,
    CandidAsDynSizeBytes,
    Default,
)]
pub struct WrappedU256 {
    value: String,
}

impl WrappedU256 {
    pub fn from(val: U256) -> Self {
        Self {
            value: val.to_string(),
        }
    }
    pub fn value(&self) -> U256 {
        U256::from_dec_str(self.value.as_str()).unwrap()
    }
}

#[derive(
    CandidType, Debug, Clone, PartialEq, PartialOrd, Deserialize, StableType, CandidAsDynSizeBytes,
)]
pub struct LockCreatedEvent {
    pub account: EthereumAddress,
    pub asset: EthereumAddress,
    pub symbol: String,
    pub amount: WrappedU256,
    pub dst_chain_id: SupportedNetwork,
    pub src_chain_id: SupportedNetwork,
    pub block_number: u64,
}

#[derive(
    CandidType, Debug, Clone, PartialEq, PartialOrd, Deserialize, StableType, CandidAsDynSizeBytes,
)]
pub struct LockReleasedEvent {
    pub account: EthereumAddress,
    pub asset: EthereumAddress,
    pub symbol: String,
    pub amount: WrappedU256,
    pub src_chain_id: SupportedNetwork,
    pub dst_chain_id: SupportedNetwork,
    pub block_number: u64,
    pub to: EthereumAddress,
}

#[derive(Clone, Debug, CandidType, Deserialize, PartialEq, Eq)]
pub enum CanisterType {
    Indexer,
    Mapper,
    View,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Canister {
    pub id: Principal,
    pub canister_type: CanisterType,
    pub name: String,
    pub subscriptions: Vec<Canister>,
}

impl Canister {
    fn new(id: Principal, canister_type: CanisterType, name: String) -> Self {
        Self {
            id,
            canister_type,
            name,
            subscriptions: vec![],
        }
    }
    pub fn new_indexer(id: Principal, name: String) -> Self {
        Self::new(id, CanisterType::Indexer, name)
    }
    pub fn new_mapper(id: Principal, name: String) -> Self {
        Self::new(id, CanisterType::Mapper, name)
    }
    pub fn new_view(id: Principal, name: String) -> Self {
        Self::new(id, CanisterType::View, name)
    }
    pub fn add_subscription(&mut self, canister: Canister) {
        self.subscriptions.push(canister);
    }
}

pub struct EventLog {
    pub event: Log,
    pub log: EthLog,
}

impl LockReleasedEvent {
    pub fn from(log: EventLog, network: SupportedNetwork) -> Self {
        let (mut account, mut asset, mut symbol, mut amount, mut src_chain_id, mut to): (
            String,
            String,
            String,
            WrappedU256,
            SupportedNetwork,
            String,
        ) = (
            "".to_string(),
            "".to_string(),
            "".to_string(),
            WrappedU256::default(),
            SupportedNetwork::default(),
            "".to_string(),
        );
        log.event
            .params
            .iter()
            .for_each(|param| match param.name.as_str() {
                "account" => account = format!("0x{}", param.value.to_string()),
                "asset" => asset = format!("0x{}", param.value.to_string()),
                "symbol" => symbol = param.value.to_string(),
                "amount" => amount = WrappedU256::from(param.value.clone().into_uint().unwrap()),
                "srcChainId" => {
                    src_chain_id =
                        SupportedNetwork::from(param.clone().value.into_uint().unwrap().as_u32())
                }
                "to" => to = format!("0x{}", param.value.to_string()),
                _ => {}
            });
        Self {
            account,
            asset,
            symbol,
            amount,
            src_chain_id,
            block_number: log.log.block_number.unwrap().as_u64(),
            dst_chain_id: network,
            to,
        }
    }
}

impl LockCreatedEvent {
    pub fn from(log: EventLog, network: SupportedNetwork) -> Self {
        let (mut account, mut asset, mut symbol, mut amount, mut dst_chain_id): (
            String,
            String,
            String,
            WrappedU256,
            SupportedNetwork,
        ) = (
            "".to_string(),
            "".to_string(),
            "".to_string(),
            WrappedU256::default(),
            SupportedNetwork::default(),
        );
        log.event
            .params
            .iter()
            .for_each(|param| match param.name.as_str() {
                "account" => account = format!("0x{}", param.value.to_string()),
                "asset" => asset = format!("0x{}", param.value.to_string()),
                "symbol" => symbol = param.value.to_string(),
                "amount" => amount = WrappedU256::from(param.value.clone().into_uint().unwrap()),
                "dstChainId" => {
                    dst_chain_id =
                        SupportedNetwork::from(param.clone().value.into_uint().unwrap().as_u32())
                }
                _ => {}
            });
        Self {
            account,
            asset,
            symbol,
            amount,
            dst_chain_id,
            block_number: log.log.block_number.unwrap().as_u64(),
            src_chain_id: network,
        }
    }
}

impl TransferEvent {
    pub fn from(log: EventLog) -> Self {
        let (mut from, mut to, mut value): (String, String, Nat) =
            ("".to_string(), "".to_string(), Nat::default());
        log.event
            .params
            .iter()
            .for_each(|param| match param.name.as_str() {
                "from" => from = "0x".to_owned() + param.value.to_string().as_str(),
                "to" => to = "0x".to_owned() + param.value.to_string().as_str(),
                "value" => value = Nat::from(param.value.clone().into_uint().unwrap().as_u128()),
                _ => {}
            });
        Self {
            at: log.log.block_number.unwrap().as_u64(),
            block_number: log.log.block_number.unwrap().as_u64(),
            hash: log.log.transaction_hash.unwrap().to_string(),
            from,
            to,
            value,
        }
    }
}

pub type Balance = Nat;
pub type EthereumAddress = String;

// test
#[cfg(test)]
mod test {

    use ic_web3::types::U256;

    use crate::types::WrappedU256;

    #[test]
    fn test_WrappedU256() {
        let from = WrappedU256::from(U256::from_dec_str("1000000000000000000").unwrap());
        let to = from.value();
        assert_eq!(to, U256::from_dec_str("1000000000000000000").unwrap());
    }
}
