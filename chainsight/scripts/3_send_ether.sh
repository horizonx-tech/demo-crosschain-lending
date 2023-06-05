
# send ether
cd `dirname $0`
cd ..
echo "sending ether..."
ADDRESS=$(dfx canister call lock_relayer_optimism get_ethereum_address  |tr -d '"'|tr -d '('|tr -d ')')
to=$ADDRESS npx hardhat run ../scripts/1_send_ether.ts --network arbitrumGoerli
ADDRESS=$(dfx canister call lock_relayer_arbitrumGoerli get_ethereum_address  |tr -d '"'|tr -d '('|tr -d ')')
to=$ADDRESS npx hardhat run ../scripts/1_send_ether.ts --network optimismTest
ADDRESS=$(dfx canister call unlock_relayer_optimism get_ethereum_address  |tr -d '"'|tr -d '('|tr -d ')')
to=$ADDRESS npx hardhat run ../scripts/1_send_ether.ts --network arbitrumGoerli
ADDRESS=$(dfx canister call unlock_relayer_arbitrumGoerli get_ethereum_address  |tr -d '"'|tr -d '('|tr -d ')')
to=$ADDRESS npx hardhat run ../scripts/1_send_ether.ts --network optimismTest
ADDRESS=$(dfx canister call oracle_manager get_ethereum_address  |tr -d '"'|tr -d '('|tr -d ')')
to=$ADDRESS npx hardhat run ../scripts/1_send_ether.ts --network optimismTest
to=$ADDRESS npx hardhat run ../scripts/1_send_ether.ts --network arbitrumGoerli
