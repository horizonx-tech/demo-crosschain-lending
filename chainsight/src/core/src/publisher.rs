use std::{cell::RefCell, collections::BTreeMap};

use candid::{CandidType, Principal};
use ic_cdk::api::call::CallResult;

#[macro_export]
macro_rules! sendable {
    () => { impl CandidType + Send + Sync};
}

pub async fn publish(events: sendable!()) {
    let subscribers = subscribers();
    for subscriber in subscribers {
        let result: CallResult<()> =
            ic_cdk::api::call::call(subscriber, "on_update", (&events,)).await;
        match result {
            Ok(_) => {
                ic_cdk::println!("called subscribe");
            }
            Err(e) => {
                ic_cdk::println!("error calling subscriber: {:?}", e);
            }
        }
    }
}

pub fn add_subscriber(subscriber: Principal) {
    SUBSCRIBERS.with(|subscribers| {
        let mut subscribers = subscribers.borrow_mut();
        subscribers.insert(subscriber, Subscriber {});
    })
}

pub fn subscribers() -> Vec<Principal> {
    SUBSCRIBERS.with(|subscribers| {
        let subscribers = subscribers.borrow();
        subscribers.keys().cloned().collect()
    })
}
struct Subscriber {}

thread_local! {
    static SUBSCRIBERS: RefCell<BTreeMap<Principal,Subscriber>> = RefCell::new(BTreeMap::new());
}
