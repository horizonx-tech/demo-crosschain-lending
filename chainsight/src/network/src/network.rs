use std::collections::HashMap;

use candid::{CandidType, Deserialize};
use ic_stable_memory::derive::{CandidAsDynSizeBytes, StableType};
use lazy_static::lazy_static;

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
    Eq,
    Hash,
    Copy,
    Ord,
)]
pub enum SupportedNetwork {
    Mainnet,
    Ropsten,
    Rinkeby,
    Kovan,
    Goerli,
    #[default]
    Local,
    Mumbai,
    Shiden,
    Astar,
    ScrollAlpha,
    ArbitrumGoerli,
    OptimismTestnet,
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
    Eq,
    Hash,
)]
pub struct NetworkInfo {
    pub name: String,
    pub chain_id: u32,
    pub network: SupportedNetwork,
    pub rpc_url: String,
    pub key_name: String,
}

impl SupportedNetwork {
    pub fn from(chain_id: u32) -> Self {
        match chain_id {
            1 => SupportedNetwork::Mainnet,
            3 => SupportedNetwork::Ropsten,
            4 => SupportedNetwork::Rinkeby,
            42 => SupportedNetwork::Kovan,
            5 => SupportedNetwork::Goerli,
            1337 => SupportedNetwork::Local,
            0 => SupportedNetwork::Local,
            80001 => SupportedNetwork::Mumbai,
            336 => SupportedNetwork::Shiden,
            592 => SupportedNetwork::Astar,
            534353 => SupportedNetwork::ScrollAlpha,
            420 => SupportedNetwork::OptimismTestnet,
            421613 => SupportedNetwork::ArbitrumGoerli,
            _ => panic!("Unsupported chain id {}", chain_id),
        }
    }
}

impl NetworkInfo {
    pub fn get_network_info(network: SupportedNetwork) -> NetworkInfo {
        NETWORKS.get(&network).unwrap().clone()
    }
}
lazy_static! {
    pub static ref NETWORKS: HashMap<SupportedNetwork, NetworkInfo> = {
        let mut map = HashMap::new();
        map.insert(
            SupportedNetwork::Mainnet,
            NetworkInfo {
                name: "Mainnet".to_string(),
                chain_id: 1,
                network: SupportedNetwork::Mainnet,
                rpc_url: "https://mainnet.infura.io/v3/".to_string(),
                key_name: "TODO".to_string(),
            },
        );
        map.insert(
            SupportedNetwork::Ropsten,
            NetworkInfo {
                name: "Ropsten".to_string(),
                chain_id: 3,
                network: SupportedNetwork::Ropsten,
                rpc_url: "https://ropsten.infura.io/v3/".to_string(),
                key_name: "TODO".to_string(),
            },
        );
        map.insert(
            SupportedNetwork::Rinkeby,
            NetworkInfo {
                name: "Rinkeby".to_string(),
                chain_id: 4,
                network: SupportedNetwork::Rinkeby,
                rpc_url: "https://rinkeby.infura.io/v3/".to_string(),
                key_name: "TODO".to_string(),
            },
        );
        map.insert(
            SupportedNetwork::Kovan,
            NetworkInfo {
                name: "Kovan".to_string(),
                chain_id: 42,
                network: SupportedNetwork::Kovan,
                rpc_url: "https://kovan.infura.io/v3/".to_string(),
                key_name: "TODO".to_string(),
            },
        );
        map.insert(
            SupportedNetwork::Goerli,
            NetworkInfo {
                name: "Goerli".to_string(),
                chain_id: 5,
                network: SupportedNetwork::Goerli,
                rpc_url: "https://goerli.infura.io/v3/".to_string(),
                key_name: "TODO".to_string(),
            },
        );
        map.insert(
            SupportedNetwork::Local,
            NetworkInfo {
                name: "Local".to_string(),
                chain_id: 31337,
                network: SupportedNetwork::Local,
                // TODO: ngrok is needed to access local network through https scheme, using ICHttp
                rpc_url: "https://5ed1-240f-77-2850-3117-71bb-3163-4830-c8b8.ngrok-free.app"
                    .to_string(),
                key_name: "test_key_1".to_string(),
            },
        );
        map.insert(
            SupportedNetwork::Mumbai,
            NetworkInfo {
                name: "Mumbai".to_string(),
                chain_id: 80001,
                network: SupportedNetwork::Mumbai,
                rpc_url: "https://polygon-mumbai.g.alchemy.com/v2/aYIzk5tdt33lSHP6TzQS4tz7biflL4RE".to_string(),
                key_name: "test_key_1".to_string(),
            },
        );
        map.insert(
            SupportedNetwork::Shiden,
            NetworkInfo {
                name: "Shiden".to_string(),
                chain_id: 336,
                network: SupportedNetwork::Shiden,
                rpc_url: "https://rpc.shiden.astar.network".to_string(),
                key_name: "test_key_1".to_string(),
            },
        );
        map.insert(
            SupportedNetwork::Astar,
            NetworkInfo {
                name: "Astar".to_string(),
                chain_id: 592,
                network: SupportedNetwork::Astar,
                rpc_url: "https://rpc.astar.network".to_string(),
                key_name: "test_key_1".to_string(),
            },
        );
        map.insert(
            SupportedNetwork::ScrollAlpha,
            NetworkInfo {
                name: "ScrollAlpha".to_string(),
                chain_id: 534353,
                network: SupportedNetwork::ScrollAlpha,
                rpc_url: "https://alpha-rpc.scroll.io/l2".to_string(),
                key_name: "test_key_1".to_string(),
            },
        );
        map.insert(
            SupportedNetwork::OptimismTestnet,
            NetworkInfo {
                name: "OptimismTestnet".to_string(),
                chain_id: 420,
                network: SupportedNetwork::OptimismTestnet,
                rpc_url: "https://opt-goerli.g.alchemy.com/v2/KWvyVToWuX2CiyQkYPkCCf7TMhfTxKvP".to_string(),
                key_name: "test_key_1".to_string(),
            },
        );
        map.insert(
            SupportedNetwork::ArbitrumGoerli,
            NetworkInfo {
                name: "ArbitrumGoerli".to_string(),
                chain_id: 421613,
                network: SupportedNetwork::ArbitrumGoerli,
                rpc_url: "https://arb-goerli.g.alchemy.com/v2/VVUea37NGw2rFKDXivE9XRyYYlJoYF1e".to_string(),
                key_name: "test_key_1".to_string(),
            },
        );

        map
    };
}
pub struct EcdsaKeyEnvs {
    pub network: SupportedNetwork,
}
impl EcdsaKeyEnvs {
    pub fn to_key_name(self) -> String {
        match self.network {
            SupportedNetwork::Local => "test_key_1",
            SupportedNetwork::Mumbai => "test_key_1",
            SupportedNetwork::Astar => "test_key_1",
            SupportedNetwork::Shiden => "test_key_1",
            SupportedNetwork::OptimismTestnet => "test_key_1",
            SupportedNetwork::ScrollAlpha => "test_key_1",
            SupportedNetwork::ArbitrumGoerli => "test_key_1",
            // TODO
            SupportedNetwork::Goerli => "goerli",
            SupportedNetwork::Kovan => "kovan",
            SupportedNetwork::Rinkeby => "rinkeby",
            SupportedNetwork::Ropsten => "ropsten",
            SupportedNetwork::Mainnet => "mainnet",
        }
        .to_string()
    }
}
