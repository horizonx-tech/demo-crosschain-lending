use candid::{candid_method, Principal};
use chainsight_generate::{did_export, manageable};
use common::types::LockReleasedEvent;
use core::{log_finder::LogFinder, publisher};
use ic_cdk_macros::{query, update};
use ic_web3::{
    contract::Contract,
    ethabi::Address,
    transports::{ic_http_client::CallOptions, ICHttp},
    types::{BlockId, BlockNumber, U64},
    Web3,
};
mod store;
use instant::Duration;
use network::network::{NetworkInfo, SupportedNetwork};
use std::{cell::RefCell, collections::HashMap, str::FromStr};
manageable!();
use ic_cdk::api::management_canister::http_request::{HttpResponse, TransformArgs};

#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}
const INTERVAL: u64 = 60; // 1 minute

#[query]
#[candid_method(query)]
fn subscribers() -> Vec<Principal> {
    publisher::subscribers()
}

#[update]
#[candid_method(update)]
fn add_subscriber() {
    publisher::add_subscriber(ic_cdk::caller());
}

#[query]
#[candid_method(query)]
fn events_latest_n(size: usize) -> Vec<LockReleasedEvent> {
    store::events_latest_n(size)
}

#[query]
#[candid_method(query)]
fn events_count() -> usize {
    store::events_count()
}

struct LendingPoolSyncState {
    address: Address,
}

thread_local! {
    static NETWORK: RefCell<SupportedNetwork> = RefCell::new(SupportedNetwork::Local);
    static LENDING_POOL: RefCell<LendingPoolSyncState> = RefCell::new(LendingPoolSyncState {
        address: Address::default(),
    });
    static STORE_INITIALZED: RefCell<bool> = RefCell::new(false);
}

#[ic_cdk::update]
#[candid_method(update)]
async fn set_lend_pool(nw: SupportedNetwork, address: String) {
    let client = ICHttp::new(&NetworkInfo::get_network_info(nw).rpc_url, None).unwrap();
    let w3 = Web3::new(client);
    let block_num = w3.eth().block_number(CallOptions::default()).await.unwrap();
    NETWORK.with(|network| {
        *network.borrow_mut() = nw;
    });
    LENDING_POOL.with(|pool| {
        pool.borrow_mut().address = Address::from_str(&address).unwrap();
    });
    STORE_INITIALZED.with(|s| {
        if s.borrow().clone() {
            return;
        }
        *s.borrow_mut() = true;
        store::setup(block_num.as_u64());
    });
}

#[query(name = "transform")]
#[candid_method(query, rename = "transform")]
fn transform(response: TransformArgs) -> HttpResponse {
    let res = response.response;
    // remove header
    HttpResponse {
        status: res.status,
        headers: Vec::default(),
        body: res.body,
    }
}

#[ic_cdk::query]
#[candid_method(update)]
async fn saved_block() -> u64 {
    store::saved_block()
}

#[ic_cdk::update]
#[candid_method(update)]
async fn do_task() {
    let duration = Duration::from_secs(INTERVAL);
    ic_cdk_timers::set_timer_interval(duration, || {
        ic_cdk::spawn(async {
            match save_logs().await {
                Ok(_) => (),
                Err(_) => (),
            }
        })
    });
}

fn finder() -> LogFinder {
    let web3 = http_client().unwrap();
    let contract = Contract::from_json(
        web3.eth(),
        lending_pool_address(),
        include_bytes!("../../../../abi/ILendingPool.json"),
    )
    .unwrap();
    LogFinder::new(web3, contract, "LockReleased")
}

#[ic_cdk::update]
#[candid_method(update)]
async fn save_logs() -> Result<(), ()> {
    let saved = store::saved_block();
    let latest = saved + 100000;
    if saved.ge(&latest) {
        return Ok(());
    }
    save_logs_from_to(saved, latest).await
}

#[ic_cdk::update]
#[candid_method(update)]
async fn save_logs_to(to: u64) -> Result<(), ()> {
    let saved = store::saved_block();
    if saved.ge(&to) {
        return Ok(());
    }
    save_logs_from_to(saved, to).await
}
async fn save_logs_from_to(from: u64, to: u64) -> Result<(), ()> {
    let finder = finder();
    let nw = NETWORK.with(|nw| nw.borrow().to_owned());
    let events: HashMap<u64, Vec<LockReleasedEvent>> = finder
        .find(from, to)
        .await
        .unwrap()
        .into_iter()
        .map(|e| LockReleasedEvent::from(e, nw))
        .fold(HashMap::new(), |mut acc, event| {
            let block = event.block_number;
            let events = acc.entry(block).or_insert_with(Vec::new);
            events.push(event);
            acc
        });
    events
        .clone()
        .into_iter()
        .for_each(|(k, v)| store::add_events(k, v));
    let max = events.clone().into_iter().map(|e| e.0).max();
    if let Some(max) = max {
        store::update_saved_block(max + 1);
    } else {
        let block = http_client()
            .unwrap()
            .eth()
            .block(
                BlockId::Number(BlockNumber::Number(U64::from(to))),
                CallOptions::default(),
            )
            .await;
        if block.unwrap().is_some() {
            store::update_saved_block(to);
        }
    }
    let data: Vec<LockReleasedEvent> = events.values().flatten().cloned().collect();
    let chunks = data.chunks(800);
    for chunk in chunks {
        publisher::publish(chunk.to_vec()).await;
    }
    Ok(())
}

//async fn get_latest_block() -> u64 {
//    let web3 = http_client().unwrap();
//    let block_num = web3.eth().block_number().await.unwrap();
//    block_num.as_u64()
//}

fn lending_pool_address() -> Address {
    LENDING_POOL.with(|lp: &RefCell<LendingPoolSyncState>| lp.borrow().address.to_owned())
}

fn network_info() -> NetworkInfo {
    NetworkInfo::get_network_info(NETWORK.with(|nw| nw.borrow().to_owned()))
}

fn http_client() -> Result<Web3<ICHttp>, String> {
    match ICHttp::new(&network_info().rpc_url, None) {
        Ok(client) => Ok(Web3::new(client)),
        Err(e) => Err(e.to_string()),
    }
}
did_export!("unlock_indexer");
