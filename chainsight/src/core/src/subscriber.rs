use candid::Principal;
use ic_cdk::api::call::CallResult;

pub async fn subscribe(target: String) {
    let principal: Principal = Principal::from_text(target).unwrap();
    let _: CallResult<()> = ic_cdk::call(principal, "add_subscriber", ()).await;
}
