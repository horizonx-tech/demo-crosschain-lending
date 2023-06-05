use candid::{Nat, Principal};
use ic_cdk::api::call::{CallResult, RejectionCode};

type InterCanisterCallResult = Result<(), (RejectionCode, std::string::String)>;
struct RewardToken {
    principal: Principal,
}

impl RewardToken {
    pub fn new(principal: Principal) -> Self {
        Self { principal }
    }
    pub async fn receive_reward(&self, amount: Nat) -> InterCanisterCallResult {
        self.transfer_from(ic_cdk::caller(), ic_cdk::id(), amount)
            .await
    }

    async fn transfer_from(
        &self,
        from: Principal,
        to: Principal,
        amount: Nat,
    ) -> InterCanisterCallResult {
        let out: CallResult<()> =
            ic_cdk::call(self.principal, "transferFrom", (from, to, amount)).await;
        out
    }

    pub async fn approve(&self, spender: Principal, amount: Nat) -> InterCanisterCallResult {
        let out: CallResult<()> = ic_cdk::call(self.principal, "approve", (spender, amount)).await;
        out
    }
}
