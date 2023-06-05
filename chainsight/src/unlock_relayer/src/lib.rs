use core::subscriber;
use std::{cell::RefCell, collections::HashMap, str::FromStr};

use candid::candid_method;
use chainsight_generate::{did_export, manageable};
use common::types::LockReleasedEvent;
use ic_cdk::{
    api::management_canister::http_request::{
        HttpResponse, TransformArgs, TransformContext, TransformFunc,
    },
    query, update,
};
mod utils;
use ic_web3::{
    contract::Options, ethabi::Address, transforms::processors,
    transforms::transform::TransformProcessor, transports::ic_http_client::CallOptionsBuilder,
    types::U256,
};
mod store;
use network::{
    contract::{ctx, IChainsigtAdapter},
    network::{NetworkInfo, SupportedNetwork},
};
manageable!();
#[update]
#[candid_method(update)]
async fn get_ethereum_address() -> String {
    match utils::ethereum_address().await {
        Ok(v) => format!("0x{}", hex::encode(v)),
        Err(msg) => msg,
    }
}
thread_local! {
    static CHAINSIGHT_ADDRESSES: RefCell<HashMap<SupportedNetwork,Address>> = RefCell::new(HashMap::new());
}

#[update]
#[candid_method(update)]
async fn set_chainsight_adapter_address(network: SupportedNetwork, address: String) {
    CHAINSIGHT_ADDRESSES.with(|f| {
        f.borrow_mut()
            .insert(network, Address::from_str(&address).unwrap());
    });
}
#[query]
#[candid_method(query)]
fn transform_request(args: TransformArgs) -> HttpResponse {
    processors::get_filter_changes_processor().transform(args)
}

fn call_options() -> Options {
    let call_options = CallOptionsBuilder::default()
        .transform(Some(TransformContext {
            function: TransformFunc(candid::Func {
                principal: ic_cdk::api::id(),
                method: "transform_request".to_string(),
            }),
            context: vec![],
        }))
        .max_resp(None)
        .cycles(None)
        .build()
        .unwrap();
    let mut opts = Options::default();
    opts.call_options = Some(call_options);
    opts
}
fn get_chainsight_adapter_address(network: SupportedNetwork) -> Address {
    CHAINSIGHT_ADDRESSES.with(|f| {
        f.borrow()
            .get(&network)
            .expect("chainsight adapter address not set")
            .clone()
    })
}

#[update]
async fn on_update(events: Vec<LockReleasedEvent>) {
    for event in events {
        let context = ctx(event.src_chain_id).unwrap();
        let adapter =
            IChainsigtAdapter::new(get_chainsight_adapter_address(event.src_chain_id), &context);
        ic_cdk::println!(
            "adapter: {:?}",
            get_chainsight_adapter_address(event.src_chain_id)
        );
        ic_cdk::println!(
            "target network: {:?}",
            NetworkInfo::get_network_info(event.src_chain_id).name
        );
        let from_address = Address::from_str(&event.account).unwrap();
        let to_address = Address::from_str(&event.to).unwrap();
        // print args
        ic_cdk::println!("from_address: {:?}", from_address);
        ic_cdk::println!("to_address: {:?}", to_address);
        ic_cdk::println!("symbol: {:?}", event.symbol);
        ic_cdk::println!("amount: {:?}", event.amount.value());
        ic_cdk::println!("network: {:?}", event.dst_chain_id);
        let result = adapter
            .unlock_asset_of(
                from_address,
                to_address,
                event.symbol,
                event.amount.value(),
                U256::from(NetworkInfo::get_network_info(event.dst_chain_id).chain_id),
                Some(call_options()),
            )
            .await;

        // print result
        ic_cdk::println!("unlock result: {:?}", result);
        match result {
            Ok(tx) => {
                println!("unlock tx: {:?}", tx);
            }
            Err(e) => {
                println!("unlock error: {:?}", e);
            }
        }
    }
}
#[update]
#[candid_method(update)]
async fn subscribe(principal: String) {
    subscriber::subscribe(principal).await;
}
#[query]
#[candid_method(query)]
fn transform(response: TransformArgs) -> HttpResponse {
    let res = response.response;
    // remove headers
    HttpResponse {
        status: res.status,
        headers: Vec::default(),
        body: res.body,
    }
}
did_export!("unlock_relayer");
