use candid::CandidType;
use candid::Deserialize;
use network::network::EcdsaKeyEnvs;
use std::cell::RefCell;

#[derive(Clone, Debug, CandidType, Deserialize)]
struct Subscriber {
    topic: String,
}

thread_local! {
    static KEY_NAME: RefCell<String>  = RefCell::new(EcdsaKeyEnvs{network: network::network::SupportedNetwork::Local}.to_key_name());
}

pub fn key_name() -> String {
    KEY_NAME.with(|val| val.borrow().clone())
}
