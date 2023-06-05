use std::{cell::RefCell, collections::BTreeMap, str::FromStr};

use candid::candid_method;
use chainsight_generate::{did_export, manageable};
use common::types::WrappedU256;
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
};
mod store;
use network::{
    contract::{ctx, IPriceOracle},
    network::SupportedNetwork,
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
    static ORACLE_ADDRESSES: RefCell<BTreeMap<SupportedNetwork,Address>> = RefCell::new(BTreeMap::new());
    static STORE_INITIALZED: RefCell<bool> = RefCell::new(false);
}

#[update]
#[candid_method(update)]
async fn set_oracle_address(network: SupportedNetwork, address: String) {
    ORACLE_ADDRESSES.with(|f| {
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
#[update]
#[candid_method(update)]
async fn set_value(symbol: String, value: WrappedU256) {
    struct Dist {
        nw: SupportedNetwork,
        addr: Address,
    }

    for d in ORACLE_ADDRESSES.with(|addresses| {
        addresses
            .borrow()
            .iter()
            .map(|(&k, &v)| Dist { nw: k, addr: v })
            .collect::<Vec<Dist>>()
    }) {
        let context = ctx(d.nw).unwrap();
        let oracle = IPriceOracle::new(d.addr.clone(), &context);
        let res = match oracle
            .set_price(
                symbol.to_string().clone(),
                value.value(),
                Some(call_options()),
            )
            .await
        {
            Ok(v) => ic_cdk::println!("set_value: {:?}", v),
            Err(e) => {
                ic_cdk::println!("set_value error: {:?}. retry", e);
                oracle
                    .set_price(
                        symbol.to_string().clone(),
                        value.value(),
                        Some(call_options()),
                    )
                    .await;
            }
        };
        ic_cdk::println!("set_value: {:?}", res);
    }
}

#[query(name = "transform")]
#[candid_method(query, rename = "transform")]
fn transform(response: TransformArgs) -> HttpResponse {
    let res = response.response;
    // remove headers
    HttpResponse {
        status: res.status,
        headers: Vec::default(),
        body: res.body,
    }
}
did_export!("oracle_manager");
