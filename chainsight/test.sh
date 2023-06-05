# !bin/sh
cd `dirname $0`
cargo test
# stop all canisters
dfx canister stop --all
# remove all canisters
dfx canister delete --all
# deploy 
echo "deploying canisters..."
dfx deploy
SRC_LEND_POOL="0x7aa823273A7A816A26725234d7D6eAD10A4dFfb7"
DST_LEND_POOL="0xF14a29f53d816c34f19c19Aef693Ad76C97B55c9"
SRC_ADAPTER="0xe8dcBafaCb7F2a2fB49f8702b6dCD89E8f99B705"
DST_ADAPTER="0x7f402dAC2af429C33C8cF031E899aCE7D20a99F4"

# set address
echo "setting address..."
dfx canister call lock_indexer_optimism set_lend_pool '(variant{OptimismTestnet},"0x7aa823273A7A816A26725234d7D6eAD10A4dFfb7")'
dfx canister call lock_indexer_arbitrumGoerli set_lend_pool '(variant{ArbitrumGoerli},"0xF14a29f53d816c34f19c19Aef693Ad76C97B55c9")'
dfx canister call unlock_indexer_optimism set_lend_pool '(variant{OptimismTestnet},"0x7aa823273A7A816A26725234d7D6eAD10A4dFfb7")'
dfx canister call unlock_indexer_arbitrumGoerli set_lend_pool '(variant{ArbitrumGoerli},"0xF14a29f53d816c34f19c19Aef693Ad76C97B55c9")'
dfx canister call lock_relayer_optimism set_chainsight_adapter_address '(variant{OptimismTestnet},"0xe8dcBafaCb7F2a2fB49f8702b6dCD89E8f99B705")'
dfx canister call lock_relayer_optimism set_chainsight_adapter_address '(variant{ArbitrumGoerli},"0x7f402dAC2af429C33C8cF031E899aCE7D20a99F4")'
dfx canister call lock_relayer_arbitrumGoerli set_chainsight_adapter_address '(variant{OptimismTestnet},"0xe8dcBafaCb7F2a2fB49f8702b6dCD89E8f99B705")'
dfx canister call lock_relayer_arbitrumGoerli set_chainsight_adapter_address '(variant{ArbitrumGoerli},"0x7f402dAC2af429C33C8cF031E899aCE7D20a99F4")'
dfx canister call unlock_relayer_optimism set_chainsight_adapter_address '(variant{OptimismTestnet},"0xe8dcBafaCb7F2a2fB49f8702b6dCD89E8f99B705")'
dfx canister call unlock_relayer_optimism set_chainsight_adapter_address '(variant{ArbitrumGoerli},"0x7f402dAC2af429C33C8cF031E899aCE7D20a99F4")'
dfx canister call unlock_relayer_arbitrumGoerli set_chainsight_adapter_address '(variant{OptimismTestnet},"0xe8dcBafaCb7F2a2fB49f8702b6dCD89E8f99B705")'
dfx canister call unlock_relayer_arbitrumGoerli set_chainsight_adapter_address '(variant{ArbitrumGoerli},"0x7f402dAC2af429C33C8cF031E899aCE7D20a99F4")'

# subscribe
echo "subscribing..."
dfx canister call lock_relayer_optimism subscribe $(dfx canister id lock_indexer_optimism)
dfx canister call lock_relayer_arbitrumGoerli subscribe $(dfx canister id lock_indexer_arbitrumGoerli)
dfx canister call unlock_relayer_optimism subscribe $(dfx canister id unlock_indexer_optimism)
dfx canister call unlock_relayer_arbitrumGoerli subscribe $(dfx canister id unlock_indexer_arbitrumGoerli)

# send ether
echo "sending ether..."
ADDRESS=$(dfx canister call lock_relayer_optimism get_ethereum_address|tr -d '"'|tr -d '('|tr -d ')')
to=$ADDRESS npx hardhat run ../scripts/1_send_ether.ts --network arbitrumGoerli
ADDRESS=$(dfx canister call lock_relayer_arbitrumGoerli get_ethereum_address|tr -d '"'|tr -d '('|tr -d ')')
to=$ADDRESS npx hardhat run ../scripts/1_send_ether.ts --network optimismTest
ADDRESS=$(dfx canister call unlock_relayer_optimism get_ethereum_address|tr -d '"'|tr -d '('|tr -d ')')
to=$ADDRESS npx hardhat run ../scripts/1_send_ether.ts --network arbitrumGoerli
ADDRESS=$(dfx canister call unlock_relayer_arbitrumGoerli get_ethereum_address|tr -d '"'|tr -d '('|tr -d ')')
to=$ADDRESS npx hardhat run ../scripts/1_send_ether.ts --network optimismTest

echo "minting and locking..."
cd .. && npx hardhat run scripts/2_mint_and_lock_on_src.ts --network optimismTest
echo "unlocking..."
cd chainsight && dfx canister call lock_indexer_optimism save_logs
echo "borrowing..."
cd .. && npx hardhat run scripts/3_borrow_on_dst.ts --network arbitrumGoerli
echo "oracle price gets high..."
npx hardhat run scripts/4_oracle_price_gets_high.ts --network arbitrumGoerli
echo "liquidation..."
npx hardhat run scripts/5_liquidation_on_dst.ts --network arbitrumGoerli
echo "saving logs..."
cd chainsight && dfx canister call unlock_indexer_arbitrumGoerli save_logs
