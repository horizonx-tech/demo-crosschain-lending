# !bin/sh
cd `dirname $0`
cd ..
cargo test
# stop all canisters
dfx canister stop --all 
# remove all canisters
dfx canister delete --all 
# deploy 
echo "deploying canisters..."
dfx deploy 
SRC_LEND_POOL="0x5Da6F4971221a64D932FeFa95D8fd07bF34290b9"
DST_LEND_POOL="0xfeE78229e61c93eF5A92c16eF0a96B6267Fa00A2"
SRC_ADAPTER="0x7C4E96452F1b6cbe407e1b8eA4a477848043c595"
DST_ADAPTER="0xeAc0E3202F6AEb6CE40497d21dd981fe1A725633"
SRC_ORACLE="0xCAe5e7411Ba8EFb862fC8a9D03Cb035A2A875F72"
DST_ORACLE="0x7C4E96452F1b6cbe407e1b8eA4a477848043c595"

# fund
dfx canister deposit-cycles 10000000000000 lock_indexer_optimism 
dfx canister deposit-cycles 10000000000000 lock_indexer_arbitrumGoerli 
dfx canister deposit-cycles 10000000000000 unlock_indexer_optimism 
dfx canister deposit-cycles 10000000000000 unlock_indexer_arbitrumGoerli 
dfx canister deposit-cycles 10000000000000 lock_relayer_optimism 
dfx canister deposit-cycles 10000000000000 lock_relayer_arbitrumGoerli 
dfx canister deposit-cycles 10000000000000 unlock_relayer_optimism 
dfx canister deposit-cycles 10000000000000 unlock_relayer_arbitrumGoerli 

# set address
echo "setting address..."
dfx canister call lock_indexer_optimism set_lend_pool '(variant{OptimismTestnet},"0x5Da6F4971221a64D932FeFa95D8fd07bF34290b9")' 
dfx canister call lock_indexer_arbitrumGoerli set_lend_pool '(variant{ArbitrumGoerli},"0xfeE78229e61c93eF5A92c16eF0a96B6267Fa00A2")' 
dfx canister call unlock_indexer_optimism set_lend_pool '(variant{OptimismTestnet},"0x5Da6F4971221a64D932FeFa95D8fd07bF34290b9")' 
dfx canister call unlock_indexer_arbitrumGoerli set_lend_pool '(variant{ArbitrumGoerli},"0xfeE78229e61c93eF5A92c16eF0a96B6267Fa00A2")' 
dfx canister call lock_relayer_optimism set_chainsight_adapter_address '(variant{OptimismTestnet},"0x7C4E96452F1b6cbe407e1b8eA4a477848043c595")' 
dfx canister call lock_relayer_optimism set_chainsight_adapter_address '(variant{ArbitrumGoerli},"0xeAc0E3202F6AEb6CE40497d21dd981fe1A725633")' 
dfx canister call lock_relayer_arbitrumGoerli set_chainsight_adapter_address '(variant{OptimismTestnet},"0x7C4E96452F1b6cbe407e1b8eA4a477848043c595")' 
dfx canister call lock_relayer_arbitrumGoerli set_chainsight_adapter_address '(variant{ArbitrumGoerli},"0xeAc0E3202F6AEb6CE40497d21dd981fe1A725633")' 
dfx canister call unlock_relayer_optimism set_chainsight_adapter_address '(variant{OptimismTestnet},"0x7C4E96452F1b6cbe407e1b8eA4a477848043c595")' 
dfx canister call unlock_relayer_optimism set_chainsight_adapter_address '(variant{ArbitrumGoerli},"0xeAc0E3202F6AEb6CE40497d21dd981fe1A725633")' 
dfx canister call unlock_relayer_arbitrumGoerli set_chainsight_adapter_address '(variant{OptimismTestnet},"0x7C4E96452F1b6cbe407e1b8eA4a477848043c595")' 
dfx canister call unlock_relayer_arbitrumGoerli set_chainsight_adapter_address '(variant{ArbitrumGoerli},"0xeAc0E3202F6AEb6CE40497d21dd981fe1A725633")' 
dfx canister call oracle_manager set_oracle_address '(variant{OptimismTestnet},"0xCAe5e7411Ba8EFb862fC8a9D03Cb035A2A875F72")' 
dfx canister call oracle_manager set_oracle_address '(variant{ArbitrumGoerli},"0x7C4E96452F1b6cbe407e1b8eA4a477848043c595")' 


dfx canister call lock_indexer_optimism do_task 
dfx canister call lock_indexer_arbitrumGoerli do_task 
dfx canister call unlock_indexer_optimism do_task 
dfx canister call unlock_indexer_arbitrumGoerli do_task 
