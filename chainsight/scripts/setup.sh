# !bin/sh
cd `dirname $0`
echo "updating addresses..."
sh 0_update_addresses.sh
echo "deploying canisters..."
sh 1_deploy_canisters.sh
echo "subscribing..."
sh 2_subscribe.sh
echo "sending ether..."
sh 3_send_ether.sh
