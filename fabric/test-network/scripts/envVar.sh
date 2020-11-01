#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# This is a collection of bash functions used by different scripts

export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

# Set OrdererOrg.Admin globals
setOrdererGlobals() {
  export CORE_PEER_LOCALMSPID="OrdererMSP"
  export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
  export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp
}

# Set environment variables for the peer org
setGlobals() {
  local USING_ORG=""
  if [ -z "$OVERRIDE_ORG" ]; then
    USING_ORG=$1
  else
    USING_ORG="${OVERRIDE_ORG}"
  fi
  echo "Using organization ${USING_ORG}"
  if [[ $USING_ORG == "gail" ]]; then
    PORT_NUMBER=7051
    for i in $(seq 1 $2); do
        if [ $i -eq 1 ]; then
            PORT_NUMBER=$((PORT_NUMBER+4))
        else
            PORT_NUMBER=$((PORT_NUMBER+2))
        fi
    done
    export CORE_PEER_LOCALMSPID="GailMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/gail.example.com/peers/peer${2}.gail.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/gail.example.com/users/Admin@gail.example.com/msp
    export CORE_PEER_ADDRESS=localhost:${PORT_NUMBER}
  elif [[ $USING_ORG == "contractors" ]]; then
    PORT_NUMBER=9051
    for i in $(seq 1 $2); do
        if [ $i -eq 1 ]; then
            PORT_NUMBER=$((PORT_NUMBER+4))
        else
            PORT_NUMBER=$((PORT_NUMBER+2))
        fi
    done
    export CORE_PEER_LOCALMSPID="ContractorsMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/contractors.example.com/peers/peer${2}.contractors.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/contractors.example.com/users/Admin@contractors.example.com/msp
    export CORE_PEER_ADDRESS=localhost:${PORT_NUMBER}
  elif [ $USING_ORG -eq 3 ]; then
    export CORE_PEER_LOCALMSPID="Org3MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer${2}.org3.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
    export CORE_PEER_ADDRESS=localhost:11051
  else
    echo "================== ERROR !!! ORG Unknown =================="
  fi

  if [ "$VERBOSE" == "true" ]; then
    env | grep CORE
  fi
}

# parsePeerConnectionParameters $@
# Helper function that sets the peer connection parameters for a chaincode
# operation
parsePeerConnectionParameters() {

  PEER_CONN_PARMS=""
  PEERS=""
  while [ "$#" -gt 0 ]; do
    setGlobals $1 $2
    PEER="peer${2}.$1"
    ## Set peer adresses
    PEERS="$PEERS $PEER"
    PEER_CONN_PARMS="$PEER_CONN_PARMS --peerAddresses $CORE_PEER_ADDRESS"
    ## Set path to TLS certificate
    if [[ $1 == "gail" ]]; then
        PEER_GAIL_CA=${PWD}/organizations/peerOrganizations/gail.example.com/peers/peer${2}.gail.example.com/tls/ca.crt
        TLSINFO=$(eval echo "--tlsRootCertFiles \$PEER_GAIL_CA")
    elif [[ $1 == "contractors" ]]; then
        PEER_CONTRACTORS_CA=${PWD}/organizations/peerOrganizations/contractors.example.com/peers/peer${2}.contractors.example.com/tls/ca.crt
        TLSINFO=$(eval echo "--tlsRootCertFiles \$PEER_CONTRACTORS_CA")
    fi
    PEER_CONN_PARMS="$PEER_CONN_PARMS $TLSINFO"
    # shift by one to get to the next organization
    shift 2
  done
  # remove leading space for output
  PEERS="$(echo -e "$PEERS" | sed -e 's/^[[:space:]]*//')"
}

verifyResult() {
  if [ $1 -ne 0 ]; then
    echo "!!!!!!!!!!!!!!! "$2" !!!!!!!!!!!!!!!!"
    echo
    exit 1
  fi
}
