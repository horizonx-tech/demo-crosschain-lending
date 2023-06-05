use candid::CandidType;
use candid::Deserialize;
use common::types::LockCreatedEvent;
use ic_stable_memory::collections::SBTreeMap;
use ic_stable_memory::collections::SVec;

use ic_stable_memory::derive::CandidAsDynSizeBytes;
use ic_stable_memory::derive::StableType;

use ic_stable_memory::SBox;
use std::cell::RefCell;

#[derive(
    CandidType, Debug, Clone, PartialEq, PartialOrd, Deserialize, StableType, CandidAsDynSizeBytes,
)]
struct SavedBlock {
    number: u64,
}

type SavedBlockStore = SBox<SavedBlock>;
type Events = SBTreeMap<SBox<u64>, SVec<SBox<LockCreatedEvent>>>;

thread_local! {
    static STATE: RefCell<Events> = RefCell::default();
    static SAVED_BLOCK_STORE: RefCell<Option<SavedBlockStore>> = RefCell::default();
}

pub fn events_count() -> usize {
    STATE.with(|f| {
        let mut count: usize = 0;
        for state in f.borrow().iter() {
            count += state.1.len();
        }
        count
    })
}
pub fn events_latest_n(n: usize) -> Vec<LockCreatedEvent> {
    let mut events: Vec<LockCreatedEvent> = Vec::new();
    STATE.with(|f| {
        let mut count: usize = 0;
        for state in f.borrow().iter().rev() {
            for event in state.1.iter() {
                events.push(event.to_owned());
                count += 1;
                if count == n {
                    return;
                }
            }
        }
    });
    events
}

pub fn saved_block() -> u64 {
    SAVED_BLOCK_STORE.with(|f| f.borrow().as_ref().map(|v| v.number).unwrap_or_default())
}

pub fn update_saved_block(block_number: u64) {
    SAVED_BLOCK_STORE.with(|f| {
        *f.borrow_mut() = Some(
            SBox::new(SavedBlock {
                number: block_number,
            })
            .unwrap(),
        );
    });
}

pub fn add_events(block_number: u64, events: Vec<LockCreatedEvent>) {
    STATE.with(|f| {
        let mut state = f.borrow_mut();
        let mut events = events;
        let mut events_boxed: SVec<SBox<LockCreatedEvent>> = SVec::new();
        for event in events.iter_mut() {
            events_boxed
                .push(SBox::new(event.to_owned()).unwrap())
                .unwrap();
        }
        state
            .insert(SBox::new(block_number).unwrap(), events_boxed)
            .unwrap();
    });
    update_saved_block(block_number);
}

pub fn setup(saved_block: u64) {
    ic_stable_memory::stable_memory_init();
    SAVED_BLOCK_STORE.with(|f| {
        *f.borrow_mut() = Some(
            SBox::new(SavedBlock {
                number: saved_block,
            })
            .unwrap(),
        );
    });
}
