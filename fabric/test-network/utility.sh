#!/bin/bash

# Set configtx/configtx.yaml depending on number of nodes to create
function setconfigtx() {
    cat <<EOF > configtx/configtx.yaml
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

---
################################################################################
#
#   Section: Organizations
#
#   - This section defines the different organizational identities which will
#   be referenced later in the configuration.
#
################################################################################
Organizations:

    # SampleOrg defines an MSP using the sampleconfig.  It should never be used
    # in production but may be used as a template for other definitions
    - &OrdererOrg
        # DefaultOrg defines the organization which is used in the sampleconfig
        # of the fabric.git development environment
        Name: OrdererOrg

        # ID to load the MSP definition as
        ID: OrdererMSP

        # MSPDir is the filesystem path which contains the MSP configuration
        MSPDir: ../organizations/ordererOrganizations/example.com/msp

        # Policies defines the set of policies at this level of the config tree
        # For organization policies, their canonical path is usually
        #   /Channel/<Application|Orderer>/<OrgName>/<PolicyName>
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('OrdererMSP.member')"
            Writers:
                Type: Signature
                Rule: "OR('OrdererMSP.member')"
            Admins:
                Type: Signature
                Rule: "OR('OrdererMSP.admin')"

        OrdererEndpoints:
            - orderer.example.com:7050

    - &Gail
        # DefaultOrg defines the organization which is used in the sampleconfig
        # of the fabric.git development environment
        Name: GailMSP

        # ID to load the MSP definition as
        ID: GailMSP

        MSPDir: ../organizations/peerOrganizations/gail.example.com/msp

        # Policies defines the set of policies at this level of the config tree
        # For organization policies, their canonical path is usually
        #   /Channel/<Application|Orderer>/<OrgName>/<PolicyName>
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('GailMSP.admin', 'GailMSP.peer', 'GailMSP.client')"
            Writers:
                Type: Signature
                Rule: "OR('GailMSP.admin', 'GailMSP.client')"
            Admins:
                Type: Signature
                Rule: "OR('GailMSP.admin')"
            Endorsement:
                Type: Signature
                Rule: "OR('GailMSP.peer')"

        # leave this flag set to true.
        AnchorPeers:
            # AnchorPeers defines the location of peers which can be used
            # for cross org gossip communication.  Note, this value is only
            # encoded in the genesis block in the Application section context
            - Host: peer0.gail.example.com
              Port: 7051
EOF

    for i in $(seq 2 $1); do
        cat <<EOF >> configtx/configtx.yaml
            - Host: peer$(($i-1)).gail.example.com
              Port: $((7051+2*$i))
EOF
    done

    cat <<EOF >> configtx/configtx.yaml

    - &Contractors
        # DefaultOrg defines the organization which is used in the sampleconfig
        # of the fabric.git development environment
        Name: ContractorsMSP

        # ID to load the MSP definition as
        ID: ContractorsMSP

        MSPDir: ../organizations/peerOrganizations/contractors.example.com/msp

        # Policies defines the set of policies at this level of the config tree
        # For organization policies, their canonical path is usually
        #   /Channel/<Application|Orderer>/<OrgName>/<PolicyName>
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('ContractorsMSP.admin', 'ContractorsMSP.peer', 'ContractorsMSP.client')"
            Writers:
                Type: Signature
                Rule: "OR('ContractorsMSP.admin', 'ContractorsMSP.client')"
            Admins:
                Type: Signature
                Rule: "OR('ContractorsMSP.admin')"
            Endorsement:
                Type: Signature
                Rule: "OR('ContractorsMSP.peer')"

        AnchorPeers:
            # AnchorPeers defines the location of peers which can be used
            # for cross org gossip communication.  Note, this value is only
            # encoded in the genesis block in the Application section context
            - Host: peer0.contractors.example.com
              Port: 9051
EOF

    for i in $(seq 2 $2); do
        cat <<EOF >> configtx/configtx.yaml
            - Host: peer$(($i-1)).contractors.example.com
              Port: $((9051+2*$i))
EOF
    done

    cat <<EOF >> configtx/configtx.yaml

################################################################################
#
#   SECTION: Capabilities
#
#   - This section defines the capabilities of fabric network. This is a new
#   concept as of v1.1.0 and should not be utilized in mixed networks with
#   v1.0.x peers and orderers.  Capabilities define features which must be
#   present in a fabric binary for that binary to safely participate in the
#   fabric network.  For instance, if a new MSP type is added, newer binaries
#   might recognize and validate the signatures from this type, while older
#   binaries without this support would be unable to validate those
#   transactions.  This could lead to different versions of the fabric binaries
#   having different world states.  Instead, defining a capability for a channel
#   informs those binaries without this capability that they must cease
#   processing transactions until they have been upgraded.  For v1.0.x if any
#   capabilities are defined (including a map with all capabilities turned off)
#   then the v1.0.x peer will deliberately crash.
#
################################################################################
Capabilities:
    # Channel capabilities apply to both the orderers and the peers and must be
    # supported by both.
    # Set the value of the capability to true to require it.
    Channel: &ChannelCapabilities
        # V2_0 capability ensures that orderers and peers behave according
        # to v2.0 channel capabilities. Orderers and peers from
        # prior releases would behave in an incompatible way, and are therefore
        # not able to participate in channels at v2.0 capability.
        # Prior to enabling V2.0 channel capabilities, ensure that all
        # orderers and peers on a channel are at v2.0.0 or later.
        V2_0: true

    # Orderer capabilities apply only to the orderers, and may be safely
    # used with prior release peers.
    # Set the value of the capability to true to require it.
    Orderer: &OrdererCapabilities
        # V2_0 orderer capability ensures that orderers behave according
        # to v2.0 orderer capabilities. Orderers from
        # prior releases would behave in an incompatible way, and are therefore
        # not able to participate in channels at v2.0 orderer capability.
        # Prior to enabling V2.0 orderer capabilities, ensure that all
        # orderers on channel are at v2.0.0 or later.
        V2_0: true

    # Application capabilities apply only to the peer network, and may be safely
    # used with prior release orderers.
    # Set the value of the capability to true to require it.
    Application: &ApplicationCapabilities
        # V2_0 application capability ensures that peers behave according
        # to v2.0 application capabilities. Peers from
        # prior releases would behave in an incompatible way, and are therefore
        # not able to participate in channels at v2.0 application capability.
        # Prior to enabling V2.0 application capabilities, ensure that all
        # peers on channel are at v2.0.0 or later.
        V2_0: true

################################################################################
#
#   SECTION: Application
#
#   - This section defines the values to encode into a config transaction or
#   genesis block for application related parameters
#
################################################################################
Application: &ApplicationDefaults

    # Organizations is the list of orgs which are defined as participants on
    # the application side of the network
    Organizations:

    # Policies defines the set of policies at this level of the config tree
    # For Application policies, their canonical path is
    #   /Channel/Application/<PolicyName>
    Policies:
        Readers:
            Type: ImplicitMeta
            Rule: "ANY Readers"
        Writers:
            Type: ImplicitMeta
            Rule: "ANY Writers"
        Admins:
            Type: ImplicitMeta
            Rule: "MAJORITY Admins"
        LifecycleEndorsement:
            Type: ImplicitMeta
            Rule: "MAJORITY Endorsement"
        Endorsement:
            Type: ImplicitMeta
            Rule: "MAJORITY Endorsement"

    Capabilities:
        <<: *ApplicationCapabilities
################################################################################
#
#   SECTION: Orderer
#
#   - This section defines the values to encode into a config transaction or
#   genesis block for orderer related parameters
#
################################################################################
Orderer: &OrdererDefaults

    # Orderer Type: The orderer implementation to start
    OrdererType: etcdraft

    EtcdRaft:
        Consenters:
        - Host: orderer.example.com
          Port: 7050
          ClientTLSCert: ../organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt
          ServerTLSCert: ../organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt

    # Batch Timeout: The amount of time to wait before creating a batch
    BatchTimeout: 2s

    # Batch Size: Controls the number of messages batched into a block
    BatchSize:

        # Max Message Count: The maximum number of messages to permit in a batch
        MaxMessageCount: 10

        # Absolute Max Bytes: The absolute maximum number of bytes allowed for
        # the serialized messages in a batch.
        AbsoluteMaxBytes: 99 MB

        # Preferred Max Bytes: The preferred maximum number of bytes allowed for
        # the serialized messages in a batch. A message larger than the preferred
        # max bytes will result in a batch larger than preferred max bytes.
        PreferredMaxBytes: 512 KB

    # Organizations is the list of orgs which are defined as participants on
    # the orderer side of the network
    Organizations:

    # Policies defines the set of policies at this level of the config tree
    # For Orderer policies, their canonical path is
    #   /Channel/Orderer/<PolicyName>
    Policies:
        Readers:
            Type: ImplicitMeta
            Rule: "ANY Readers"
        Writers:
            Type: ImplicitMeta
            Rule: "ANY Writers"
        Admins:
            Type: ImplicitMeta
            Rule: "MAJORITY Admins"
        # BlockValidation specifies what signatures must be included in the block
        # from the orderer for the peer to validate it.
        BlockValidation:
            Type: ImplicitMeta
            Rule: "ANY Writers"

################################################################################
#
#   CHANNEL
#
#   This section defines the values to encode into a config transaction or
#   genesis block for channel related parameters.
#
################################################################################
Channel: &ChannelDefaults
    # Policies defines the set of policies at this level of the config tree
    # For Channel policies, their canonical path is
    #   /Channel/<PolicyName>
    Policies:
        # Who may invoke the 'Deliver' API
        Readers:
            Type: ImplicitMeta
            Rule: "ANY Readers"
        # Who may invoke the 'Broadcast' API
        Writers:
            Type: ImplicitMeta
            Rule: "ANY Writers"
        # By default, who may modify elements at this config level
        Admins:
            Type: ImplicitMeta
            Rule: "MAJORITY Admins"

    # Capabilities describes the channel level capabilities, see the
    # dedicated Capabilities section elsewhere in this file for a full
    # description
    Capabilities:
        <<: *ChannelCapabilities

################################################################################
#
#   Profile
#
#   - Different configuration profiles may be encoded here to be specified
#   as parameters to the configtxgen tool
#
################################################################################
Profiles:

    TwoOrgsOrdererGenesis:
        <<: *ChannelDefaults
        Orderer:
            <<: *OrdererDefaults
            Organizations:
                - *OrdererOrg
            Capabilities:
                <<: *OrdererCapabilities
        Consortiums:
            SampleConsortium:
                Organizations:
                    - *Gail
                    - *Contractors
    TwoOrgsChannel:
        Consortium: SampleConsortium
        <<: *ChannelDefaults
        Application:
            <<: *ApplicationDefaults
            Organizations:
                - *Gail
                - *Contractors
            Capabilities:
                <<: *ApplicationCapabilities
EOF
}

# Set docker/docker-compose-couch.yaml depending on number of nodes to create
function setcomposecouch() {
    cat <<EOF > docker/docker-compose-couch.yaml
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

version: '2'

networks:
    test:

services:
    couchdb00:
        container_name: couchdb00
        image: hyperledger/fabric-couchdb
        # Populate the COUCHDB_USER and COUCHDB_PASSWORD to set an admin user and password
        # for CouchDB.  This will prevent CouchDB from operating in an "Admin Party" mode.
        environment:
            - COUCHDB_USER=
            - COUCHDB_PASSWORD=
        # Comment/Uncomment the port mapping if you want to hide/expose the CouchDB service,
        # for example map it to utilize Fauxton User Interface in dev environments.
        ports:
            - "5984:5984"
        networks:
            - test

    peer0.gail.example.com:
        environment:
            - CORE_LEDGER_STATE_STATEDATABASE=CouchDB
            - CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb00:5984
            # The CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME and CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD
            # provide the credentials for ledger to connect to CouchDB.  The username and password must
            # match the username and password set for the associated CouchDB.
            - CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=
            - CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD=
        depends_on:
            - couchdb00
EOF

    for i in $(seq 2 $1); do
        cat <<EOF >> docker/docker-compose-couch.yaml

    couchdb0$(($i-1)):
        container_name: couchdb0$(($i-1))
        image: hyperledger/fabric-couchdb
        # Populate the COUCHDB_USER and COUCHDB_PASSWORD to set an admin user and password
        # for CouchDB.  This will prevent CouchDB from operating in an "Admin Party" mode.
        environment:
            - COUCHDB_USER=
            - COUCHDB_PASSWORD=
        # Comment/Uncomment the port mapping if you want to hide/expose the CouchDB service,
        # for example map it to utilize Fauxton User Interface in dev environments.
        ports:
            - "5984:5984"
        networks:
            - test

    peer$(($i-1)).gail.example.com:
      environment:
        - CORE_LEDGER_STATE_STATEDATABASE=CouchDB
        - CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb0$(($i-1)):5984
        # The CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME and CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD
        # provide the credentials for ledger to connect to CouchDB.  The username and password must
        # match the username and password set for the associated CouchDB.
        - CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=
        - CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD=
      depends_on:
        - couchdb0$(($i-1))
EOF
    done

    cat <<EOF >> docker/docker-compose-couch.yaml

    couchdb10:
        container_name: couchdb10
        image: hyperledger/fabric-couchdb
        # Populate the COUCHDB_USER and COUCHDB_PASSWORD to set an admin user and password
        # for CouchDB.  This will prevent CouchDB from operating in an "Admin Party" mode.
        environment:
            - COUCHDB_USER=
            - COUCHDB_PASSWORD=
        # Comment/Uncomment the port mapping if you want to hide/expose the CouchDB service,
        # for example map it to utilize Fauxton User Interface in dev environments.
        ports:
            - "7984:5984"
        networks:
            - test

    peer0.contractors.example.com:
        environment:
            - CORE_LEDGER_STATE_STATEDATABASE=CouchDB
            - CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb10:5984
            # The CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME and CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD
            # provide the credentials for ledger to connect to CouchDB.  The username and password must
            # match the username and password set for the associated CouchDB.
            - CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=
            - CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD=
        depends_on:
          - couchdb10
EOF

    for i in $(seq 2 $2); do
        cat <<EOF >> docker/docker-compose-couch.yaml

    couchdb1$(($i-1)):
        container_name: couchdb1$(($i-1))
        image: hyperledger/fabric-couchdb
        # Populate the COUCHDB_USER and COUCHDB_PASSWORD to set an admin user and password
        # for CouchDB.  This will prevent CouchDB from operating in an "Admin Party" mode.
        environment:
            - COUCHDB_USER=
            - COUCHDB_PASSWORD=
        # Comment/Uncomment the port mapping if you want to hide/expose the CouchDB service,
        # for example map it to utilize Fauxton User Interface in dev environments.
        ports:
            - "7984:5984"
        networks:
            - test

    peer$(($i-1)).contractors.example.com:
        environment:
            - CORE_LEDGER_STATE_STATEDATABASE=CouchDB
            - CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb1$(($i-1)):5984
            # The CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME and CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD
            # provide the credentials for ledger to connect to CouchDB.  The username and password must
            # match the username and password set for the associated CouchDB.
            - CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME=
            - CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD=
        depends_on:
          - couchdb1$(($i-1))
EOF
    done
}

# Set docker/docker-compose-test-net.yaml depending on number of nodes to create
function setcomposetestnet () {

    cat <<EOF > docker/docker-compose-test-net.yaml
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

version: '2'

volumes:
    orderer.example.com:
    peer0.gail.example.com:
    peer0.contractors.example.com:
EOF

    for i in $(seq 2 $1); do
        cat <<EOF >> docker/docker-compose-test-net.yaml
    peer$(($i-1)).gail.example.com:
EOF
    done

    for i in $(seq 2 $2); do
        cat <<EOF >> docker/docker-compose-test-net.yaml
    peer$(($i-1)).contractors.example.com:
EOF
    done

    cat <<EOF >> docker/docker-compose-test-net.yaml

networks:
    test:

services:

    orderer.example.com:
        container_name: orderer.example.com
        image: hyperledger/fabric-orderer:\$IMAGE_TAG
        environment:
            - FABRIC_LOGGING_SPEC=INFO
            - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0
            - ORDERER_GENERAL_LISTENPORT=7050
            - ORDERER_GENERAL_GENESISMETHOD=file
            - ORDERER_GENERAL_GENESISFILE=/var/hyperledger/orderer/orderer.genesis.block
            - ORDERER_GENERAL_LOCALMSPID=OrdererMSP
            - ORDERER_GENERAL_LOCALMSPDIR=/var/hyperledger/orderer/msp
            # enabled TLS
            - ORDERER_GENERAL_TLS_ENABLED=true
            - ORDERER_GENERAL_TLS_PRIVATEKEY=/var/hyperledger/orderer/tls/server.key
            - ORDERER_GENERAL_TLS_CERTIFICATE=/var/hyperledger/orderer/tls/server.crt
            - ORDERER_GENERAL_TLS_ROOTCAS=[/var/hyperledger/orderer/tls/ca.crt]
            - ORDERER_KAFKA_TOPIC_REPLICATIONFACTOR=1
            - ORDERER_KAFKA_VERBOSE=true
            - ORDERER_GENERAL_CLUSTER_CLIENTCERTIFICATE=/var/hyperledger/orderer/tls/server.crt
            - ORDERER_GENERAL_CLUSTER_CLIENTPRIVATEKEY=/var/hyperledger/orderer/tls/server.key
            - ORDERER_GENERAL_CLUSTER_ROOTCAS=[/var/hyperledger/orderer/tls/ca.crt]
        working_dir: /opt/gopath/src/github.com/hyperledger/fabric
        command: orderer
        volumes:
            - ../system-genesis-block/genesis.block:/var/hyperledger/orderer/orderer.genesis.block
            - ../organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp:/var/hyperledger/orderer/msp
            - ../organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/:/var/hyperledger/orderer/tls
            - orderer.example.com:/var/hyperledger/production/orderer
        ports:
            - 7050:7050
        networks:
            - test

    peer0.gail.example.com:
        container_name: peer0.gail.example.com
        image: hyperledger/fabric-peer:\$IMAGE_TAG
        environment:
            #Generic peer variables
            - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
            # the following setting starts chaincode containers on the same
            # bridge network as the peers
            # https://docs.docker.com/compose/networking/
            - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=\${COMPOSE_PROJECT_NAME}_test
            - FABRIC_LOGGING_SPEC=INFO
            #- FABRIC_LOGGING_SPEC=DEBUG
            - CORE_PEER_TLS_ENABLED=true
            - CORE_PEER_GOSSIP_USELEADERELECTION=true
            - CORE_PEER_GOSSIP_ORGLEADER=false
            - CORE_PEER_PROFILE_ENABLED=true
            - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt
            - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key
            - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt
            # Peer specific variabes
            - CORE_PEER_ID=peer0.gail.example.com
            - CORE_PEER_ADDRESS=peer0.gail.example.com:7051
            - CORE_PEER_LISTENADDRESS=0.0.0.0:7051
            - CORE_PEER_CHAINCODEADDRESS=peer0.gail.example.com:7052
            - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:7052
            - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.gail.example.com:7051
            - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.gail.example.com:7051
            - CORE_PEER_LOCALMSPID=GailMSP
        volumes:
            - /var/run/:/host/var/run/
            - ../organizations/peerOrganizations/gail.example.com/peers/peer0.gail.example.com/msp:/etc/hyperledger/fabric/msp
            - ../organizations/peerOrganizations/gail.example.com/peers/peer0.gail.example.com/tls:/etc/hyperledger/fabric/tls
            - peer0.gail.example.com:/var/hyperledger/production
        working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
        command: peer node start
        ports:
            - 7051:7051
        networks:
            - test
EOF

    for i in $(seq 2 $1); do
        cat <<EOF >> docker/docker-compose-test-net.yaml

    peer$(($i-1)).gail.example.com:
        container_name: peer$(($i-1)).gail.example.com
        image: hyperledger/fabric-peer:\$IMAGE_TAG
        environment:
            #Generic peer variables
            - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
            # the following setting starts chaincode containers on the same
            # bridge network as the peers
            # https://docs.docker.com/compose/networking/
            - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=\${COMPOSE_PROJECT_NAME}_test
            - FABRIC_LOGGING_SPEC=INFO
            #- FABRIC_LOGGING_SPEC=DEBUG
            - CORE_PEER_TLS_ENABLED=true
            - CORE_PEER_GOSSIP_USELEADERELECTION=true
            - CORE_PEER_GOSSIP_ORGLEADER=false
            - CORE_PEER_PROFILE_ENABLED=true
            - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt
            - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key
            - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt
            # Peer specific variabes
            - CORE_PEER_ID=peer$(($i-1)).gail.example.com
            - CORE_PEER_ADDRESS=peer$(($i-1)).gail.example.com:$((7051+2*$i))
            - CORE_PEER_LISTENADDRESS=0.0.0.0:$((7051+2*$i))
            - CORE_PEER_CHAINCODEADDRESS=peer$(($i-1)).gail.example.com:$((7052+2*$i))
            - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:$((7052+2*$i))
            - CORE_PEER_GOSSIP_BOOTSTRAP=peer$(($i-1)).gail.example.com:$((7051+2*$i))
            - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer$(($i-1)).gail.example.com:$((7051+2*$i))
            - CORE_PEER_LOCALMSPID=GailMSP
        volumes:
            - /var/run/:/host/var/run/
            - ../organizations/peerOrganizations/gail.example.com/peers/peer$(($i-1)).gail.example.com/msp:/etc/hyperledger/fabric/msp
            - ../organizations/peerOrganizations/gail.example.com/peers/peer$(($i-1)).gail.example.com/tls:/etc/hyperledger/fabric/tls
            - peer$(($i-1)).gail.example.com:/var/hyperledger/production
        working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
        command: peer node start
        ports:
            - $((7051+2*$i)):$((7051+2*$i))
        networks:
        - test
EOF
    done

    cat <<EOF >> docker/docker-compose-test-net.yaml

    peer0.contractors.example.com:
        container_name: peer0.contractors.example.com
        image: hyperledger/fabric-peer:\$IMAGE_TAG
        environment:
            #Generic peer variables
            - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
            # the following setting starts chaincode containers on the same
            # bridge network as the peers
            # https://docs.docker.com/compose/networking/
            - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=\${COMPOSE_PROJECT_NAME}_test
            - FABRIC_LOGGING_SPEC=INFO
            #- FABRIC_LOGGING_SPEC=DEBUG
            - CORE_PEER_TLS_ENABLED=true
            - CORE_PEER_GOSSIP_USELEADERELECTION=true
            - CORE_PEER_GOSSIP_ORGLEADER=false
            - CORE_PEER_PROFILE_ENABLED=true
            - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt
            - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key
            - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt
            # Peer specific variabes
            - CORE_PEER_ID=peer0.contractors.example.com
            - CORE_PEER_ADDRESS=peer0.contractors.example.com:9051
            - CORE_PEER_LISTENADDRESS=0.0.0.0:9051
            - CORE_PEER_CHAINCODEADDRESS=peer0.contractors.example.com:9052
            - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:9052
            - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.contractors.example.com:9051
            - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.contractors.example.com:9051
            - CORE_PEER_LOCALMSPID=ContractorsMSP
        volumes:
            - /var/run/:/host/var/run/
            - ../organizations/peerOrganizations/contractors.example.com/peers/peer0.contractors.example.com/msp:/etc/hyperledger/fabric/msp
            - ../organizations/peerOrganizations/contractors.example.com/peers/peer0.contractors.example.com/tls:/etc/hyperledger/fabric/tls
            - peer0.contractors.example.com:/var/hyperledger/production
        working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
        command: peer node start
        ports:
            - 9051:9051
        networks:
            - test
EOF

    for i in $(seq 2 $2); do
        cat <<EOF >> docker/docker-compose-test-net.yaml

    peer$(($i-1)).contractors.example.com:
        container_name: peer$(($i-1)).contractors.example.com
        image: hyperledger/fabric-peer:\$IMAGE_TAG
        environment:
            #Generic peer variables
            - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
            # the following setting starts chaincode containers on the same
            # bridge network as the peers
            # https://docs.docker.com/compose/networking/
            - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=\${COMPOSE_PROJECT_NAME}_test
            - FABRIC_LOGGING_SPEC=INFO
            #- FABRIC_LOGGING_SPEC=DEBUG
            - CORE_PEER_TLS_ENABLED=true
            - CORE_PEER_GOSSIP_USELEADERELECTION=true
            - CORE_PEER_GOSSIP_ORGLEADER=false
            - CORE_PEER_PROFILE_ENABLED=true
            - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt
            - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key
            - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt
            # Peer specific variabes
            - CORE_PEER_ID=peer$(($i-1)).contractors.example.com
            - CORE_PEER_ADDRESS=peer$(($i-1)).contractors.example.com:$((9051+2*$i))
            - CORE_PEER_LISTENADDRESS=0.0.0.0:$((9051+2*$i))
            - CORE_PEER_CHAINCODEADDRESS=peer$(($i-1)).contractors.example.com:$((9052+2*$i))
            - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:$((9052+2*$i))
            - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer$(($i-1)).contractors.example.com:$((9051+2*$i))
            - CORE_PEER_GOSSIP_BOOTSTRAP=peer$(($i-1)).contractors.example.com:$((9051+2*$i))
            - CORE_PEER_LOCALMSPID=ContractorsMSP
        volumes:
            - /var/run/:/host/var/run/
            - ../organizations/peerOrganizations/contractors.example.com/peers/peer$(($i-1)).contractors.example.com/msp:/etc/hyperledger/fabric/msp
            - ../organizations/peerOrganizations/contractors.example.com/peers/peer$(($i-1)).contractors.example.com/tls:/etc/hyperledger/fabric/tls
            - peer$(($i-1)).contractors.example.com:/var/hyperledger/production
        working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
        command: peer node start
        ports:
            - $((9051+2*$i)):$((9051+2*$i))
        networks:
            - test
EOF
    done
}

# Set organizations/cryptogen/crypto-config-gail.yaml depending on number of nodes to create
function setcryptogail () {

    cat <<EOF > organizations/cryptogen/crypto-config-gail.yaml
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#


# ---------------------------------------------------------------------------
# "PeerOrgs" - Definition of organizations managing peer nodes
# ---------------------------------------------------------------------------
PeerOrgs:
  # ---------------------------------------------------------------------------
  # Gail
  # ---------------------------------------------------------------------------
  - Name: Gail
    Domain: gail.example.com
    EnableNodeOUs: true
    # ---------------------------------------------------------------------------
    # "Specs"
    # ---------------------------------------------------------------------------
    # Uncomment this section to enable the explicit definition of hosts in your
    # configuration.  Most users will want to use Template, below
    #
    # Specs is an array of Spec entries.  Each Spec entry consists of two fields:
    #   - Hostname:   (Required) The desired hostname, sans the domain.
    #   - CommonName: (Optional) Specifies the template or explicit override for
    #                 the CN.  By default, this is the template:
    #
    #                              "{{.Hostname}}.{{.Domain}}"
    #
    #                 which obtains its values from the Spec.Hostname and
    #                 Org.Domain, respectively.
    # ---------------------------------------------------------------------------
    #   - Hostname: foo # implicitly "foo.gail.example.com"
    #     CommonName: foo27.org5.example.com # overrides Hostname-based FQDN set above
    #   - Hostname: bar
    #   - Hostname: baz
    # ---------------------------------------------------------------------------
    # "Template"
    # ---------------------------------------------------------------------------
    # Allows for the definition of 1 or more hosts that are created sequentially
    # from a template. By default, this looks like "peer%d" from 0 to Count-1.
    # You may override the number of nodes (Count), the starting index (Start)
    # or the template used to construct the name (Hostname).
    #
    # Note: Template and Specs are not mutually exclusive.  You may define both
    # sections and the aggregate nodes will be created for you.  Take care with
    # name collisions
    # ---------------------------------------------------------------------------
    Template:
      Count: $1
      SANS:
        - localhost
      # Start: 5
      # Hostname: {{.Prefix}}{{.Index}} # default
    # ---------------------------------------------------------------------------
    # "Users"
    # ---------------------------------------------------------------------------
    # Count: The number of user accounts _in addition_ to Admin
    # ---------------------------------------------------------------------------
    Users:
      Count: 1
EOF
}

# Set organizations/cryptogen/crypto-config-contractors.yaml depending on number of nodes to create
function setcryptocontractors(){

    cat <<EOF > organizations/cryptogen/crypto-config-contractors.yaml
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# ---------------------------------------------------------------------------
# "PeerOrgs" - Definition of organizations managing peer nodes
# ---------------------------------------------------------------------------
PeerOrgs:
  # ---------------------------------------------------------------------------
  # Contractors
  # ---------------------------------------------------------------------------
  - Name: Contractors
    Domain: contractors.example.com
    EnableNodeOUs: true
    # ---------------------------------------------------------------------------
    # "Specs"
    # ---------------------------------------------------------------------------
    # Uncomment this section to enable the explicit definition of hosts in your
    # configuration.  Most users will want to use Template, below
    #
    # Specs is an array of Spec entries.  Each Spec entry consists of two fields:
    #   - Hostname:   (Required) The desired hostname, sans the domain.
    #   - CommonName: (Optional) Specifies the template or explicit override for
    #                 the CN.  By default, this is the template:
    #
    #                              "{{.Hostname}}.{{.Domain}}"
    #
    #                 which obtains its values from the Spec.Hostname and
    #                 Org.Domain, respectively.
    # ---------------------------------------------------------------------------
    # Specs:
    #   - Hostname: foo # implicitly "foo.gail.example.com"
    #     CommonName: foo27.org5.example.com # overrides Hostname-based FQDN set above
    #   - Hostname: bar
    #   - Hostname: baz
    # ---------------------------------------------------------------------------
    # "Template"
    # ---------------------------------------------------------------------------
    # Allows for the definition of 1 or more hosts that are created sequentially
    # from a template. By default, this looks like "peer%d" from 0 to Count-1.
    # You may override the number of nodes (Count), the starting index (Start)
    # or the template used to construct the name (Hostname).
    #
    # Note: Template and Specs are not mutually exclusive.  You may define both
    # sections and the aggregate nodes will be created for you.  Take care with
    # name collisions
    # ---------------------------------------------------------------------------
    Template:
      Count: $1
      SANS:
        - localhost
      # Start: 5
      # Hostname: {{.Prefix}}{{.Index}} # default
    # ---------------------------------------------------------------------------
    # "Users"
    # ---------------------------------------------------------------------------
    # Count: The number of user accounts _in addition_ to Admin
    # ---------------------------------------------------------------------------
    Users:
      Count: 1
EOF
}

# Check arguments provided with utility.sh
function validate(){
    if [[ $1 -le 1 ]] || [[ $1 -gt 100 ]]; then
        echo "Number of GAIL peer nodes should be between 2 and 100"
        exit 1
    fi
    if [[ $2 -le 1 ]] || [[ $2 -gt 100 ]]; then
        echo "Number of Contractor peer nodes should be between 2 and 100"
        exit 1
    fi
}
