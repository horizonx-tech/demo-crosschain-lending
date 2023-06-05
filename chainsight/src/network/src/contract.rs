use crate::network::{NetworkInfo, SupportedNetwork};
use ic_solidity_bindgen::{contract_abis, Web3Context};
use ic_web3::ethabi::Address;
contract_abis!("../abi");

pub fn ctx(network: SupportedNetwork) -> Result<Web3Context, ic_web3::Error> {
    let network_info = NetworkInfo::get_network_info(network);
    Web3Context::new(
        &network_info.rpc_url,
        // TODO: use keyring
        Address::from_low_u64_be(0),
        u64::from(network_info.chain_id),
        network_info.key_name,
    )
}
