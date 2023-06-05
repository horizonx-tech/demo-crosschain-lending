use std::{cell::RefCell, collections::BTreeMap};

use candid::{CandidType, Deserialize};
use instant::Duration;

const PERIOD: Duration = Duration::from_secs(60 * 60);

#[derive(CandidType, Deserialize, Eq, PartialEq, Hash, Clone)]
pub struct Metrics {
    pub balance: u128,
}
pub fn metrics(size: usize) -> BTreeMap<u64, Metrics> {
    STATS.with(|stats| {
        let stats = stats.borrow();
        stats
            .iter()
            .rev()
            .take(size)
            .map(|(k, v)| (*k, v.clone()))
            .collect()
    })
}

pub fn setup() {
    ic_cdk_timers::set_timer_interval(PERIOD, || {
        self::record();
    });
}
pub fn latest() -> Metrics {
    STATS.with(|stats| {
        let stats = stats.borrow();
        stats.iter().rev().next().unwrap().1.clone()
    })
}
pub fn record() {
    ic_cdk::println!("record");
    STATS.with(|stats| {
        let mut stats = stats.borrow_mut();
        stats.insert(
            ic_cdk::api::time(),
            Metrics {
                balance: ic_cdk::api::canister_balance128(),
            },
        );
    })
}

thread_local! {
    static STATS: RefCell<BTreeMap<u64, Metrics>> = RefCell::new(BTreeMap::new());
}
