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
)]
pub enum SupportedNetwork {
    #[default]
    Mainnet,
    Optimism,
}

#[derive(
    Default,
    CandidType,
    Debug,
    Clone,
    PartialEq,
    PartialOrd,
    Deserialize,
    StableType,
    CandidAsDynSizeBytes,
)]
pub enum Token {
    #[default]
    DAI,
}

lazy_static! {
    static ref DAI_MAINNET: TokenConfig = TokenConfig::new(SupportedNetwork::Mainnet, Token::DAI);
    static ref DAI_OPTIMISM: TokenConfig = TokenConfig::new(SupportedNetwork::Optimism, Token::DAI);
}

#[derive(
    CandidType, Debug, Clone, PartialEq, PartialOrd, Deserialize, StableType, CandidAsDynSizeBytes,
)]
pub struct TokenConfig {
    network: SupportedNetwork,
    token: Token,
}

impl TokenConfig {
    pub fn new(network: SupportedNetwork, token: Token) -> Self {
        Self { network, token }
    }
    pub fn rpc_url(&self) -> &str {
        self.network.rpc_url()
    }
    pub fn address(&self) -> &str {
        self.token.address(&self.network)
    }
    pub fn contract_craeted_block_number(&self) -> u64 {
        self.token.contract_craeted_block_number(&self.network)
    }
}

impl SupportedNetwork {
    fn rpc_url(&self) -> &str {
        match self {
            SupportedNetwork::Mainnet => {
                "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
            }
            SupportedNetwork::Optimism => {
                "https://optimism-mainnet.infura.io/v3/d06b171ef3ad461fb7e55d033343eba6"
            }
        }
    }
}

impl Token {
    fn address(&self, network: &SupportedNetwork) -> &str {
        match (self, network) {
            (Token::DAI, SupportedNetwork::Mainnet) => "0x6b175474e89094c44da98b954eedeac495271d0f",
            (Token::DAI, SupportedNetwork::Optimism) => {
                "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"
            }
        }
    }
    fn contract_craeted_block_number(&self, network: &SupportedNetwork) -> u64 {
        match (self, network) {
            (Token::DAI, SupportedNetwork::Mainnet) => 8928158,
            (Token::DAI, SupportedNetwork::Optimism) => 0,
        }
    }
}
